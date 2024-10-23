
const { promises: fs } = require('fs');
const path = require('path');
const queryPath = '../queries/';
const { connection_promise: conn } = require("../db.js");

const INSERT_JOB_PARAMS = ["jobType", "startTime", "jobLogs", "jobStatus"];
const UPDATE_JOB_PARAMS = ["jobStatus", "endTime", "jobLogs", "jobId"];

const parseFile = async (filePath) => {
    return await fs.readFile(filePath, 'utf8');
}

const runQuery = async (query, values) => {
    [rows, fields] = await conn.query(query, values);
    return rows;
};

const getAnyPendingJob = async (jobType) => {
    const query = await parseFile(path.join(__dirname, queryPath, "GET/get_any_pending_job_by_type.sql"));
    const result = await runQuery(query, [jobType]);
    return result && result.length > 0 ? result[0].jobId : null;
};

const insertDbData = async (rowData) => {
    const query = await parseFile(path.join(__dirname, queryPath, "CREATE/insert_cron_job.sql"));
    const values = INSERT_JOB_PARAMS.map(paramName => rowData[paramName]);
    const result = await runQuery(query, values);
    return result.insertId;
};

const updateDbData = async (rowData) => {
    const query = await parseFile(path.join(__dirname, queryPath, "UPDATE/update_cron_job_status.sql"));
    const values = UPDATE_JOB_PARAMS.map(paramName => rowData[paramName]);
    const result = await runQuery(query, values);
    return result;
};

module.exports = {
    runQuery,
    getAnyPendingJob,
    insertDbData,
    updateDbData,
};