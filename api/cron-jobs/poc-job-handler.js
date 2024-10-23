const fs = require('fs');
const { JobLogger } = require('../cron-jobs/job-logger.js');
const JobStatus = require('../enums/job-status.js');
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require('../util/date-time-format-service.js');
const { parseCSV } = require("../util/csv-parse-service.js");

const jobType = "POC-JOB";
const jobName = `CRON JOB: POC Update Job`;

const runPocJob = async () => {

    const jobLogger = new JobLogger();
    let jobId;
    try {
        jobLogger.log(jobName + ' - Execution start');
        const pendingJobId = await cronJobDbUtilService.getAnyPendingJob(jobType);
        if (pendingJobId) {
            jobLogger.log(`Active Job '${pendingJobId}' is Running. Aborting the job now.`);
            await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobStatus: JobStatus.CANCELLED })
            return;
        }
        jobId = await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: '', jobStatus: JobStatus.PENDING });
        console.log(`Cron job id: ${jobId} - start`);

        // TODO: Add code get data using active directory using activedirectory2 lib
        //parse file & skip first row
        const pocCsv = await parseCSV("../scripts/pocs/GSA_Pocs.csv", false, 1);

        const clearQuery = "DELETE FROM tmp_obj_ldap_poc";
        await cronJobDbUtilService.runQuery(clearQuery, []);
        jobLogger.log("Clear tmp_obj_ldap_poc records");

        const insertQuery =
            "REPLACE INTO tmp_obj_ldap_poc (SamAccountName, FirstName, LastName, Email, Phone, OrgCode, Position, EmployeeType, Enabled) VALUES ?";
        await cronJobDbUtilService.runQuery(insertQuery, [pocCsv]);
        jobLogger.log('Insert into tmp_obj_ldap_poc.');

        const upsertQuery =
            "INSERT INTO obj_ldap_poc (SamAccountName, FirstName, LastName, Email, Phone, OrgCode, Position, EmployeeType, Enabled) "
            + "SELECT t.SamAccountName, t.FirstName, t.LastName, t.Email, t.Phone, t.OrgCode, t.Position, t.EmployeeType, t.Enabled "
            + "FROM tmp_obj_ldap_poc t "
            + "ON DUPLICATE KEY UPDATE FirstName = VALUES(FirstName), LastName = VALUES(LastName),"
            + "Email = VALUES(Email), Phone = VALUES(Phone), OrgCode = VALUES(OrgCode),"
            + "Position = VALUES(Position), EmployeeType = VALUES(EmployeeType), Enabled = VALUES(Enabled) ";
        await cronJobDbUtilService.runQuery(upsertQuery, []);
        jobLogger.log('Insert into/update obj_ldap_poc.');

        const updateQuery =
            "UPDATE obj_ldap_poc poc "
            + "SET Enabled = 'FALSE' "
            + "WHERE poc.SamAccountName NOT IN (SELECT SamAccountName FROM tmp_obj_ldap_poc)";
        await cronJobDbUtilService.runQuery(updateQuery);
        jobLogger.log('Update obj_ldap_poc to disable poc.');

        const deleteQuery =
            "DELETE FROM obj_ldap_poc "
            + "WHERE Enabled = 'FALSE' "
            + "AND SamAccountName NOT IN (SELECT obj_ldap_SamAccountName FROM zk_technology_poc)";
        await cronJobDbUtilService.runQuery(deleteQuery);
        jobLogger.log('Delete obj_ldap_poc disabled records.');

        const updateEndOfLifeQuery = "UPDATE obj_ldap_poc poc "
            + "SET EmployeeType = 'Separated' "
            + "WHERE poc.SamAccountName NOT IN (SELECT SamAccountName FROM tmp_obj_ldap_poc) AND Enabled = 'FALSE' AND poc.EmployeeType = '';"
            + "INSERT INTO `gear_schema`.`obj_ldap_poc` "
            + "(`SamAccountName`, `FirstName`, `LastName`, `Email`, `EmployeeType`, `Enabled`, `RISSO`) "
            + "VALUES ('AssistTechTeam', 'Assist', 'Tech Team', 'assisttechteam@gsa.gov', 'Group', 'True', '24');"; //Adding group account as part of CTO team request
        await cronJobDbUtilService.runQuery(updateEndOfLifeQuery);
        jobLogger.log('Update obj_ldap_poc to separate poc.');
    } catch (error) {
        // log any errors
        const status = `error occurred while running:  \n ${error}`;
        if (jobId) {
            jobLogger.log(jobName + ' - ' + status);
            jobLogger.log(error.stack);
            await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
        } else {
            jobLogger.log(error);
            console.log(jobLogger.getLogs());
        }
    } finally {
        console.log(`Cron job id: ${jobId} - end`);
    }
};

const postprocesJobExecution = async (jobId, jobLogger, jobStatus) => {
    await cronJobDbUtilService.updateDbData({ jobStatus: jobStatus, endTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobId: jobId })
};

module.exports = {
    runPocJob,
};