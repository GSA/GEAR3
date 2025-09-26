const { JobLogger } = require('../cron-jobs/job-logger.js');
const JobStatus = require('../enums/job-status.js');
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require('../util/date-time-format-service.js');
const { runQuery, getConnection, relaseConnection } = require("../util/db-query-service.js");

const jobType = "CLOUD-ADOPTION-JOB";
const jobName = `CRON JOB: Cloud Adoption Rate Daily Log Job`;

/**
 * Runs the Cloud adoption job. Updates the obj_cloud_adoption_rate table. Logs execution details and job status into the database.
 */
const runCloudAdoptionJob = async () => {
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

    // Insert calculated cloud adoption rate based on obj_fisma_archer data for that day
    const clearQuery = 
    `
    INSERT INTO \`gear_schema\`.\`obj_cloud_adoption_rate\` (\`BusSysCloudAdoptionRate\`, \`ActiveBusSystemsCount\`, \`CloudActiveBusSystemsCount\`) 
    VALUES (
    (SELECT count(\`ex:System_Name\`) FROM obj_fisma_archer
    WHERE
    \`ex:Status\` = "Active" 
    AND \`ex:BusinessApplication\` = "Yes"
    AND \`ex:Cloud_Hosted\` = "Yes")
    /
    (SELECT count(\`ex:System_Name\`) FROM obj_fisma_archer
    WHERE
    \`ex:Status\` = "Active" 
    AND \`ex:BusinessApplication\` = "Yes"), 

    (SELECT count(\`ex:System_Name\`) FROM obj_fisma_archer
    WHERE
    \`ex:Status\` = "Active" 
    AND \`ex:BusinessApplication\` = "Yes"),

    (SELECT count(\`ex:System_Name\`) FROM obj_fisma_archer
    WHERE
    \`ex:Status\` = "Active" 
    AND \`ex:BusinessApplication\` = "Yes"
    AND \`ex:Cloud_Hosted\` = "Yes") 

    );

    DELETE t1
    FROM \`obj_cloud_adoption_rate\` t1
    INNER JOIN \`obj_cloud_adoption_rate\` t2
    WHERE DATE(t1.\`DTG\`) = DATE(t2.\`DTG\`) AND t1.\`Id\` > t2.\`Id\` AND DATE(t1.\`DTG\`) = CURDATE();
    `;
    await runQuery(clearQuery, []);
    jobLogger.log("Success: calculate cloud adoption and insert into obj_cloud_adoption_rate table.");

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
  runCloudAdoptionJob,
};