const isEqual = require('lodash.isequal');
const jsonDiff = require('json-diff');

const { getFilePath, parseFile, } = require("../util/io-service.js");
const { JobLogger } = require('../cron-jobs/job-logger.js');
const JobStatus = require('../enums/job-status.js');
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require('../util/date-time-format-service.js');
const jsonTransformEngine = require("../util/json-transform-engine.js");
const { getJsonData } = require("../util/https-client-service.js");
const { prepareQuery, runQuery } = require("../util/db-query-service.js");

const jobType = "TPI-JOB";
const jobName = `CRON JOB: Touchpoint Daily Import`;
const mappingsPath = "../json-mappings/";

const apiKey = process.env.TOUCHPOINT_API_KEY;
const touchpointHost = "api.gsa.gov";
const touchpointUrlPath = `/analytics/touchpoints/v1/websites.json?all=1&API_KEY=${apiKey}`;
const insert_params = ["analytics_url", "authentication_tool", "cms_platform", "contact_email", "dap_gtm_code", "digital_brand_category", "domain", "feedback_tool", "has_authenticated_experience", "has_dap", "has_search", "hosting_platform", "https", "id", "mobile_friendly", "notes", "office", "production_status", "redirects_to", "repository_url", "required_by_law_or_policy", "site_owner_email", "sitemap_url", "status_code", "sub_office", "type_of_site", "uses_feedback", "uses_tracking_cookies", "uswds_version", "created_at", "updated_at", "target_decommission_date"];
const update_params = ["analytics_url", "authentication_tool", "cms_platform", "contact_email", "dap_gtm_code", "digital_brand_category", "domain", "feedback_tool", "has_authenticated_experience", "has_dap", "has_search", "hosting_platform", "https", "id", "mobile_friendly", "notes", "office", "production_status", "redirects_to", "repository_url", "required_by_law_or_policy", "site_owner_email", "sitemap_url", "status_code", "sub_office", "type_of_site", "uses_feedback", "uses_tracking_cookies", "uswds_version", "created_at", "updated_at", "target_decommission_date", "id"];


const getDbData = async () => {
  const query = await prepareQuery("GET/get_touchpoint_websites.sql");
  return await runQuery(query);
};

const insertDbData = async (rowData) => {
  const query = await prepareQuery("CREATE/insert_websites_from_touchpoint.sql");
  const values = insert_params.map(paramName => rowData[paramName]);
  await runQuery(query, values);
};

const updateDbData = async (rowData) => {
  const query = await prepareQuery("UPDATE/update_websites_from_touchpoint.sql");
  const values = update_params.map(paramName => rowData[paramName]);
  await runQuery(query, values);
};

const removeDbData = async (rowIds) => {
  const query = await prepareQuery("REMOVE/remove_websites_by_ids.sql");
  await runQuery(query, [rowIds]);
};

const analyzeData = async (dataItems, jobLogger) => {
  // get touch point data for comparison
  const mappingsJson = JSON.parse(await parseFile(getFilePath(mappingsPath, "touchpoint-to-website.json")));
  const touchpointDbRows = (await Promise.all(dataItems
    .filter(dataItem => dataItem["attributes"]["organization_id"] === 1)
    .map(async (dataItem) => await jsonTransformEngine.transform(dataItem, mappingsJson))))
    .sort((a, b) => a.id - b.id);

  const touchpointRowMap = Object.assign({}, ...touchpointDbRows.map(row => { return { [row.id]: row } }));
  const dbRows = (await getDbData()).sort((a, b) => a.id - b.id);
  const dbRowMap = Object.assign({}, ...dbRows.map(row => { return { [row.id]: row } }));

  jobLogger.log(`Total touchpoint count: ${touchpointDbRows.length}`);
  jobLogger.log(`Total db count: ${dbRows.length}`);

  updateIds = Object.keys(dbRowMap).filter(dbId => (dbId in touchpointRowMap) && !isEqual(dbRowMap[dbId], touchpointRowMap[dbId]));
  jobLogger.log("Update count: " + updateIds.length);
  //print data differences
  updateIds.forEach(id => jobLogger.log(`Update::: id: ${id}, diff: ${jsonDiff.diffString(dbRowMap[id], touchpointRowMap[id])}`));
  jobLogger.log(`Update Count: ${updateIds.length}`);


  newIds = Object.keys(touchpointRowMap).filter(dbId => !(dbId in dbRowMap))
  jobLogger.log(`New Count: ${newIds.length}`);

  removeIds = Object.keys(dbRowMap).filter(dbId => !(dbId in touchpointRowMap))
  jobLogger.log(`Remove Count: ${removeIds.length}`);

  return [newIds, updateIds, removeIds]
};

const transformTouchpointData = async (tpDataItems, mappingFileName, filterIds = []) => {
  // get complete touch point data json for import
  const mappingsCompleteJson = JSON.parse(await parseFile(getFilePath(mappingsPath, mappingFileName)));
  return await Promise.all(tpDataItems
    .filter(dataItem => dataItem["attributes"]["organization_id"] === 1 &&
      (filterIds.length === 0 || filterIds.indexOf(dataItem.id) !== -1))
    .map(async (dataItem) => await jsonTransformEngine.transform(dataItem, mappingsCompleteJson)));
}

const createData = async (tpDataItems, rowIds, jobLogger) => {
  if (!rowIds || rowIds.length === 0) {
    jobLogger.log(`${new Date()}: no new items.`)
    return;
  }
  const tpDataRows = await transformTouchpointData(tpDataItems, "touchpoint-to-website-complete.json", rowIds);
  jobLogger.log(`new row count ${tpDataRows.length}`);
  await Promise.all(tpDataRows.map(async (rowData) => await insertDbData(rowData)));
  jobLogger.log(`${new Date()}: Insertion is complete.`);
};

const updateData = async (tpDataItems, rowIds, jobLogger) => {
  if (!rowIds || rowIds.length === 0) {
    jobLogger.log(`${new Date()}: no update items.`)
    return;
  }
  const tpDataRows = await transformTouchpointData(tpDataItems, "touchpoint-to-website-complete.json", rowIds);
  jobLogger.log(`${new Date()}: update row count ${tpDataRows.length}`);
  await Promise.all(tpDataRows.map(async (rowData) => await updateDbData(rowData)));
  jobLogger.log(`${new Date()}: Update is complete.`);
};

const removeData = async (rowIds, jobLogger) => {
  if (!rowIds || rowIds.length === 0) {
    jobLogger.log(`${new Date()}: no remove items.`)
    return;
  }
  jobLogger.log(`${new Date()}: delete row count ${rowIds.length}`);
  await removeDbData(rowIds);
  jobLogger.log(`${new Date()}: Delete is complete.`);
};

const importWebsiteData = async (jobLogger) => {
  const tpDataObj = await getJsonData(touchpointHost, touchpointUrlPath);
  const tpDataItems = tpDataObj["data"];

  const [newIds, updateIds, removeIds] = await analyzeData(tpDataItems, jobLogger);
  await createData(tpDataItems, newIds, jobLogger);
  await updateData(tpDataItems, updateIds, jobLogger);
  await removeData(removeIds, jobLogger);
}


/**
 * Runs the Touchpoint Daily Import job. Updates the Websites data. Logs execution details and job status into the database.
 */
const runTouchpointImportJob = async () => {
  const jobLogger = new JobLogger();
  let jobId;

  try {
    jobLogger.log(`${jobName} - Execution start`);

    // Check for any pending job
    const pendingJobId = await cronJobDbUtilService.getAnyPendingJob(jobType);
    if (pendingJobId) {
      jobLogger.log(`Active Job '${pendingJobId}' is Running. Aborting the job now.`);
      await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: jobLogger.getLogs(), jobStatus: JobStatus.CANCELLED });
      return;
    }

    // Insert new job record
    jobId = await cronJobDbUtilService.insertDbData({ jobType, startTime: formatDateTime(new Date()), jobLogs: '', jobStatus: JobStatus.PENDING });
    jobLogger.log(`Cron job id: ${jobId} - start`);

    await importWebsiteData(jobLogger);
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
      jobLogger.log(jobLogger.getLogs());
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
  runTouchpointImportJob,
};