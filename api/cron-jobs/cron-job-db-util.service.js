const { prepareQuery, runQuery } = require("../util/db-query-service");

const INSERT_PARAMS = ["jobType", "startTime", "jobLogs", "jobStatus"];
const UPDATE_PARAMS = ["jobStatus", "endTime", "jobLogs", "jobId"];

/**
 * Retrieves any pending job of the specified type.
 *
 * @param {string} jobType - The type of job to look for.
 * @returns {Promise<number|null>} A promise that resolves to the jobId of the pending job or null if no job is found.
 */
const getAnyPendingJob = async (jobType) => {
  const query = await prepareQuery("GET/get_any_pending_job_by_type.sql");
  const result = await runQuery(query, [jobType]);
  return result && result.length > 0 ? result[0].jobId : null;
};

/**
 * Inserts a new job record into the database.
 *
 * @param {Object} rowData - The data for the new job.
 * @returns {Promise<number>} A promise that resolves to the ID of the inserted job.
 */
const insertDbData = async (rowData) => {
  const query = await prepareQuery("CREATE/insert_cron_job.sql");
  const values = INSERT_PARAMS.map(paramName => rowData[paramName]);
  const result = await runQuery(query, values);
  return result.insertId;
};

/**
 * Updates an existing job record in the database.
 *
 * @param {Object} rowData - The data to update the job with.
 * @returns {Promise<Array>} A promise that resolves to the result of the update operation.
 */
const updateDbData = async (rowData) => {
  const query = await prepareQuery("UPDATE/update_cron_job_status.sql");
  const values = UPDATE_PARAMS.map(paramName => rowData[paramName]);
  const result = await runQuery(query, values);
  return result;
};

module.exports = {
  runQuery,
  getAnyPendingJob,
  insertDbData,
  updateDbData,
};