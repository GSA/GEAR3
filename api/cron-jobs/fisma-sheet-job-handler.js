const { JobLogger } = require('../cron-jobs/job-logger.js');
const JobStatus = require('../enums/job-status.js');
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require('../util/date-time-format-service.js');
const { prepareQuery, runQuery } = require("../util/db-query-service.js");
const { clearAndWriteTab } = require("../util/google-sheets-writer-service.js");

const jobType = "FISMA-SHEET-JOB";
const jobName = `CRON JOB: FISMA Data to Google Sheet (TEST tab)`;

// Same spreadsheet used elsewhere in the app.
const SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A';
const TAB_NAME = 'TEST';

/**
 * Converts an array of row objects into a 2D array (headers + values) for Google Sheets.
 *
 * @param {Array<Object>} rows - The FISMA rows returned from the database.
 * @returns {Array<Array<*>>} A 2D array where the first row is the header row.
 */
const toSheetValues = (rows) => {
  if (!rows || rows.length === 0) {
    return [];
  }

  const headers = Object.keys(rows[0]);
  const dataRows = rows.map((row) =>
    headers.map((header) => {
      const value = row[header];
      return value === null || value === undefined ? '' : value;
    })
  );

  return [headers, ...dataRows];
};

/**
 * Runs the FISMA-to-Sheet job. Pulls all FISMA data from the database (the same data served by
 * the /api/fisma endpoint) and writes it into the TEST tab of the Google Sheet.
 * Logs execution details and job status into the database.
 */
const runFismaSheetJob = async () => {
  const jobLogger = new JobLogger();
  let jobId;

  // Logs to both the in-memory job logger (persisted to DB) and stdout (iisnode log).
  const log = (message) => {
    jobLogger.log(message);
    console.log(`[${jobType}] ${message}`);
  };

  try {
    log(`${jobName} - Execution start`);

    // Check for any pending job
    const pendingJobId = await cronJobDbUtilService.getAnyPendingJob(jobType);
    if (pendingJobId) {
      log(`Active Job '${pendingJobId}' is Running. Aborting the job now.`);
      await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobStatus: JobStatus.CANCELLED });
      return;
    }

    // Insert new job record
    jobId = await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: '', jobStatus: JobStatus.PENDING });
    console.log(`Cron job id: ${jobId} - start`);

    // Pull all FISMA data (matches fisma.controller.findAll).
    log('Preparing FISMA query...');
    const query = await prepareQuery("GET/get_fisma_archer.sql") + " GROUP BY archer.`ex:GEAR_ID`;";
    log('Running FISMA query against the database...');
    const rows = await runQuery(query, []);
    log(`Retrieved ${rows.length} FISMA records from the database.`);

    const values = toSheetValues(rows);
    if (values.length === 0) {
      log('No FISMA data found. Nothing written to the sheet.');
      await postprocessJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
      return;
    }

    // Clear the TEST tab and write headers + data.
    log(`Writing to spreadsheet '${SHEET_ID}', tab '${TAB_NAME}' (${values.length - 1} data rows + header)...`);
    await clearAndWriteTab(SHEET_ID, TAB_NAME, values);
    log(`Wrote ${values.length - 1} data rows to the '${TAB_NAME}' tab.`);

    await postprocessJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
    log(`${jobName} - Completed successfully.`);
  } catch (error) {
    // Log full error details to the iisnode log (stdout/stderr) and to the job logger.
    console.error(`[${jobType}] ERROR:`, error && error.message ? error.message : error);
    console.error(`[${jobType}] STACK:`, error && error.stack ? error.stack : '(no stack)');
    if (error && error.response && error.response.data) {
      console.error(`[${jobType}] API RESPONSE:`, JSON.stringify(error.response.data));
    }

    const status = `error occurred while running:  \n` + (error && error.stack ? error.stack : error);
    jobLogger.log(jobName + ' - ' + status);
    if (error && error.response && error.response.data) {
      jobLogger.log(`API response: ${JSON.stringify(error.response.data)}`);
    }

    if (jobId) {
      await postprocessJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    }
  }
};

/**
 * Persists the final job status, end time, and accumulated logs to the database.
 *
 * @param {number} jobId - The database job identifier.
 * @param {JobLogger} jobLogger - The logger holding accumulated log messages.
 * @param {number} jobStatus - The final job status from JobStatus.
 */
async function postprocessJobExecution(jobId, jobLogger, jobStatus) {
  await cronJobDbUtilService.updateDbData({ jobStatus, endTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobId });
}

module.exports = {
  runFismaSheetJob,
};
