const { JobLogger } = require('../cron-jobs/job-logger.js');
const JobStatus = require('../enums/job-status.js');
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require('../util/date-time-format-service.js');
const { parseCSV } = require("../util/csv-parse-service.js");
const { runQuery, getConnection, relaseConnection } = require("../util/db-query-service.js");

const jobType = "POC-JOB";
const jobName = `CRON JOB: POC Update Job`;

/**
 * Runs the POC job. Updates the POC data. Logs execution details and job status into the database.
 */
const runPocJob = async () => {
  const jobLogger = new JobLogger();
  let jobId;
  let dbConn;

  try {
    jobLogger.log(`${jobName} - Execution start`);

    // Check for any pending job
    const pendingJobId = await cronJobDbUtilService.getAnyPendingJob(jobType);
    if (pendingJobId) {
      jobLogger.log(`Active Job '${pendingJobId}' is Running. Aborting the job now.`);
      jobId = await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobStatus: JobStatus.CANCELLED });
      return;
    }

    // Insert new job record
    jobId = await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: '', jobStatus: JobStatus.PENDING });
    console.log(`Cron job id: ${jobId} - start`);

    // TODO: Add code to get data using Active Directory using activedirectory2 lib

    // Parse the CSV file & skip the first row
    const pocCsv = await parseCSV("scripts/pocs/GSA_Pocs.csv", false, 1);

    // Clear tmp_obj_ldap_poc table
    const clearQuery = "DELETE FROM tmp_obj_ldap_poc";
    await runQuery(clearQuery, []);
    jobLogger.log("Clear tmp_obj_ldap_poc records.");

    // Insert parsed data into tmp_obj_ldap_poc
    const insertQuery = "REPLACE INTO tmp_obj_ldap_poc (SamAccountName, FirstName, LastName, Email, Phone, OrgCode, Position, EmployeeType, Enabled) VALUES ?";
    await runQuery(insertQuery, [pocCsv]);
    jobLogger.log('Insert into tmp_obj_ldap_poc.');

    // Upsert data into obj_ldap_poc
    const upsertQuery = `
      INSERT INTO obj_ldap_poc (SamAccountName, FirstName, LastName, Email, Phone, OrgCode, Position, EmployeeType, Enabled)
      SELECT t.SamAccountName, t.FirstName, t.LastName, t.Email, t.Phone, t.OrgCode, t.Position, t.EmployeeType, t.Enabled
      FROM tmp_obj_ldap_poc t
      ON DUPLICATE KEY UPDATE
        FirstName = VALUES(FirstName), LastName = VALUES(LastName),
        Email = VALUES(Email), Phone = VALUES(Phone), OrgCode = VALUES(OrgCode),
        Position = VALUES(Position), EmployeeType = VALUES(EmployeeType), Enabled = VALUES(Enabled)
    `;
    await runQuery(upsertQuery, []);
    jobLogger.log('Insert into/update obj_ldap_poc.');

    // Update obj_ldap_poc to disable records
    const updateQuery = `
      UPDATE obj_ldap_poc poc
      SET Enabled = 'FALSE'
      WHERE poc.SamAccountName NOT IN (SELECT SamAccountName FROM tmp_obj_ldap_poc)
    `;
    await runQuery(updateQuery, []);
    jobLogger.log('Update obj_ldap_poc to disable records.');

    // Delete disabled records from obj_ldap_poc
    const deleteQuery = `
      DELETE FROM obj_ldap_poc
      WHERE Enabled = 'FALSE'
      AND SamAccountName NOT IN (SELECT obj_ldap_SamAccountName FROM zk_technology_poc)
    `;
    await runQuery(deleteQuery, []);
    jobLogger.log('Delete obj_ldap_poc disabled records.');

    // Update End of Life records and add a group account
    const updateEndOfLifeQuery = `
      UPDATE obj_ldap_poc poc
      SET EmployeeType = 'Separated'
      WHERE poc.SamAccountName NOT IN (SELECT SamAccountName FROM tmp_obj_ldap_poc) AND Enabled = 'FALSE' AND poc.EmployeeType = '';

      INSERT INTO gear_schema.obj_ldap_poc (SamAccountName, FirstName, LastName, Email, EmployeeType, Enabled, RISSO)
      VALUES ('AssistTechTeam', 'Assist', 'Tech Team', 'assisttechteam@gsa.gov', 'Group', 'True', '24')
      ON DUPLICATE KEY UPDATE SamAccountName = 'AssistTechTeam';
    `;
    await runQuery(updateEndOfLifeQuery, []);
    jobLogger.log('Update obj_ldap_poc to separate records and add group account.');

    await postprocesJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
  } catch (error) {
    // Log any errors
    const status = `Error occurred while running: \n${error}`;
    if (jobId) {
      jobLogger.log(`${jobName} - ${status}`);
      jobLogger.log(error.stack);
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    } else {
      jobLogger.log(error);
      jobLogger.log(error.stack);
      console.log(jobLogger.getLogs());
    }
  } finally {
    console.log(`Cron job id: ${jobId} - end`);
  }
};

/**
 * Finalizes the job execution by updating the job status and logs in the database.
 *
 * @param {number} jobId - The ID of the job to be updated.
 * @param {JobLogger} jobLogger - The JobLogger instance containing the job logs.
 * @param {string} jobStatus - The status to update the job with (e.g., SUCCESS, FAILURE).
 * @returns {Promise<void>} A promise that resolves when the job update is complete.
 */
const postprocesJobExecution = async (jobId, jobLogger, jobStatus) => {
  jobLogger.log(`Cron job id: ${jobId} - end`);
  await cronJobDbUtilService.updateDbData({
    jobStatus: jobStatus,
    endTime: formatDateTime(new Date()),
    jobLogs: jobLogger.getLogs(),
    jobId: jobId
  });
};

module.exports = {
  runPocJob,
};