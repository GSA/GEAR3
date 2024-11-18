const sql = require("../db.js").connection,
  // sql_cowboy  = require("../db.js").connection_cowboy,
  connPromisePool = require("../db.js").promisePool,
  path = require("path"),
  fs = require("fs"),
  readline = require("readline"),
  { google } = require("googleapis")
  fastcsv = require("fast-csv");

const SqlString = require('sqlstring');

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";
const JobStatus = require('../enums/job-status.js');
const { formatDateTime } = require('../util/date-time-format-service.js');

exports.getApiToken = async (req, res) => {
  //console.log('req.headers: ', req.headers); //debugging
  //console.log(`requester: ${req.headers.requester}, apitoken: ${req.headers.apitoken}`); //debugging

  //let [rows, fields] = await sql_promise.query(`CALL gear_acl.verifyJwt ('${req.headers.requester}', '${req.headers.apitoken}');`);

  let [rows, fields] = await connPromisePool.query(`select count(*) as sessions_cnt from gear_acl.logins where email = '${req.headers.requester}' and jwt = '${req.headers.apitoken}';`);

  return rows[0].sessions_cnt;

  //const response = await sql_promise.query(`CALL gear_acl.verifyJwt ('${req.headers.requester}', '${req.headers.apitoken}');`);

  //return response;
}

exports.sendQuery = (query, msg, response, postProcessFunc = null) => {
  return buildQuery(sql, query, msg, response, postProcessFunc);
};

exports.sendLogQuery = (event, user, msg, response) => {
  var data = buildLogQuery(sql, event, user, msg, response);
  return data;
};

// exports.sendQuery_cowboy = (query, msg, response) => {
//   return buildQuery(sql_cowboy, query, msg, response);
// };

/**
 * 
 * @param conn
 * @param {string} query - A complete sql query
 * @param {string} msg - A description of the query that will be printed if an error occurs
 * @return {object} - query results as JSON
 */
function buildQuery(conn, query, msg, response, postProcessFunc = null) {
  conn.query(query, (error, data) => {
    if (error) {
      console.log(`DB Query Error while executing ${msg}: `, error);
      response.status(501).json({
        message: error.message || `DB Query Error while executing ${msg}`,
      });
    } else {
      //console.log("Query Response: ", response);  // Debug
      if (typeof postProcessFunc === 'function') {
        data = postProcessFunc(data);
      }
      response.status(200).json(data);
    }
  });

  return response;
}

/**
 * 
 * @param conn
 * @param {string} event - A complete sql query
 * @param {string} user - A description of the query that will be printed if an error occurs
 * @param {string} msg - A description of the query that will be printed if an error occurs
 * @return {object} - query results as JSON
 */
function buildLogQuery(conn, event, user, msg, response) {
  // 
  var query = `insert into gear_log.event (Event, User, DTG) values ('${event}', '${user}', now());`;
  console.log(query);

  //
  conn.query(query, (error, data) => {
    if (error) {
      console.log(`DB Log Event Query Error while executing ${msg}: `, error);
      return { message: error.message || `DB Query Error while executing ${msg}`, };
    } else {
      //console.log("Event Logged");  // Debug
      return JSON.stringify(data);
    }
  });
}

async function buildLogQueryAsync(conn, event, user, msg) {
  // 
  var query = `insert into gear_log.event (Event, User, DTG) values ('${event}', '${user}', now());`;
  console.log(query);
  try {
    await conn.promise().query(query);
    return JSON.stringify(data);
  }
  catch (error) {
    console.log(`DB Log Event Query Error while executing ${msg}: `, error);
    return { message: error.message || `DB Query Error while executing ${msg}`, };
  }
}

exports.emptyTextFieldHandler = (content) => {
  if (!content) return "NULL";
  else return `'${content}'`;
};

exports.setEmptyTextFieldHandler = (content) => {
  if (!content) return '';
  else return content;
};

const msgLog = (message, logger) => {
  if (logger) {
    logger.log(message);
  }
  console.log(message);
}

async function readFileAsync(path, disableLogQuery, response, requester, jobLogger, jobId) {
  try {
    return await fs.promises.readFile(path, 'utf8');
  } catch (err) {
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - ERROR: loading client secret file`, requester, "log_update_zk_systems_subsystems_records", response);
    }
    if (requester === "GearCronJ") {
      msgLog(`Error loading client secret file: ${err} `, jobLogger);
      msgLog(err.stack, jobLogger);
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    } else {
      response.status(504).json({ error: "Error loading client secret file: " + err });
    }
  }
}

async function readFileAsync2(path, disableLogQuery, response, requester, jobLogger, jobId) {
  try {
    return await fs.promises.readFile(path, 'utf8');
  } catch (err) {
    let errMessage = "Reading the Token returned an error: " + err;
    errMessage = errMessage.replace(/'/g, "");
    msgLog(errMessage, jobLogger);
    if (requester === "GearCronJ") {
      msgLog(err.stack, jobLogger);
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    } else {
      sendResponse(response, { error: errMessage });
    }
  }
}

/* **** Google API ****
All this needs to be refactored as to not be so redundant*/
exports.googleMain = async (response, method, sheetID, dataRange, requester, key = null, jobLogger = null, jobId = null, postprocesJobExecution = null) => {

  msgLog("googleMain()", jobLogger);

  const disableLogQuery = jobLogger ? true : false;

  // get the current date and format it as yyyymmddhh
  let date = new Date();
  let formattedDate = null;

  if (requester === "GearCronJ") {
    formattedDate = `${date.getFullYear()}${String((date.getMonth() + 1)).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}`;
  } else {
    formattedDate = `${date.getFullYear()}${String((date.getMonth() + 1)).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
  }

  try {
    // log the start of the refresh to the database
    if (!disableLogQuery) {
      await sql.promise().query(`insert into gear_schema.google_api_run_log (id) values ('${formattedDate}');`);
      await buildLogQueryAsync(sql, `Update All Related Records - Starting`, requester, "log_update_zk_systems_subsystems_records", response);
    }

    // Load client secrets from a local file.
    const content = await readFileAsync("certs/gear_google_credentials.json", disableLogQuery, response, requester, jobLogger, jobId);
    if (!content) {
      return;
    }

    // Set callback based on method
    const callback_method = method === "all" ? retrieveAll 
      : method === "single" ? single 
      : method === "refresh" ? refresh : null;
    msgLog(`callback_method: ${method}`, jobLogger);

    // Authorize a client with credentials, then call the Google Sheets API.
    await authorize(JSON.parse(content), callback_method, response, sheetID,
      dataRange, requester, key, jobLogger, jobId, postprocesJobExecution, disableLogQuery);
  } catch (error) {
    msgLog(`Duplicate Google Sheets API Request: ${error}`, jobLogger);
    if (requester === "GearCronJ") {
      msgLog(error.stack, jobLogger);
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    } else {
      response.status(504).json({ error: "Duplicate Google Sheets API Request: " + error });
    }
  }
};

async function getOAuth2Client(credentials) {
  var client_secret = credentials.client_secret;
  var client_id = credentials.client_id;
  var redirect_uris = credentials.redirect_uris;

  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris
  );
  oAuth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      oAuth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      });
    }
  });
  return oAuth2Client;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {response} response Response Object
 */
async function authorize(
  credentials,
  callback,
  response,
  sheetID,
  dataRange,
  requester,
  key = null,
  jobLogger = null,
  jobId = null,
  postprocesJobExecution = null,
  disableLogQuery = false,
) {
  const oAuth2Client = await getOAuth2Client(credentials);
  try {
    // Check if we have previously stored a token.
    const token = await readFileAsync2(TOKEN_PATH, disableLogQuery, response, requester, jobLogger, jobId);
    if (!token) {
      return;
    }
    oAuth2Client.setCredentials(JSON.parse(token));

    return !key ? await callback(oAuth2Client, response, sheetID, dataRange, requester,
      jobLogger, jobId, postprocesJobExecution, disableLogQuery)
      : await callback(oAuth2Client, response, sheetID, dataRange, requester,
        jobLogger, jobId, postprocesJobExecution, disableLogQuery, key);
  } catch (err) {
    // log the error to the database
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - Token Issue: ` || json.stringify(err), requester, `log_update_zk_systems_subsystems_records`, response);
    }
    const errMessage = "Reading the Token returned an error: " + err;
    if (requester === "GearCronJ") {
      msgLog(errMessage, jobLogger);
      msgLog(err.stack, jobLogger);
    } else {
      sendResponse(response, { error: errMessage });
    }
  }
}

/**
 * Retrieves all data within the specified spreadsheet:
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
async function retrieveAll(auth, response, sheetID, dataRange, requester, jobLogger, jobId, postprocesJobExecution, disableLogQuery) {

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: dataRange,
    });
    const rows = res.data.values;
    if (rows.length) {
      const headers = rows[0];
      var data = [];

      // Structure rows into an object
      for (i = 1; i < rows.length; i++) {
        row = {};
        for (j = 0; j < headers.length; j++) {
          row[headers[j]] = rows[i][j];
        }
        data.push(row);
      }
      sendResponse(response, data);
    }
  } catch (error) {
    if (requester === "GearCronJ") {
      msgLog("The API returned an error: " + err, jobLogger);
      if (postprocesJobExecution) {
        await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      }
    } else {
      sendResponse(response, { error: "The API returned an error: " + err });
    }
  }
}

// This function refreshes the data in the database using the data from the spreadsheet
async function refresh(auth, response, sheetID, dataRange, requester, jobLogger, jobId, postprocesJobExecution, disableLogQuery) {
  try {
    // log the start of the refresh to the database
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - Refreshing Data`, requester, "log_update_zk_systems_subsystems_records", response);
    }
    msgLog("Update All Related Records - Refreshing Data: log_update_zk_systems_subsystems_records", jobLogger)

    // Get the data from the spreadsheet
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: dataRange,
    });

    // Get the rows from the spreadsheet
    const rows = res.data.values;
    // If rows is not empty
    if (rows.length <= 0 || rows == undefined) {
      if (!disableLogQuery) {
        await buildLogQueryAsync(sql, `Update All Related Records - ERROR: No Data Found`, requester, "log_update_zk_systems_subsystems_records", response);
      }
      if (requester === "GearCronJ") {
        msgLog("No data found.", jobLogger);
        if (postprocesJobExecution) {
          await postprocesJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
        }
        return;
      } else {
        sendResponse(response, { error: "No data found." });
        return;
      }
    }

    msgLog("Mapping values...", jobLogger);
    // Map values
    var m = new Map();
    // Keep track of how many rows are being processed
    rowCounter = 0
    // Map records to systems
    rows.forEach((r) => {
      // If the map does not contain the key, create an empty array
      if (!m.has(r[1])) {
        //Insert new key with empty array
        m.set(r[1], []);
      }
      // Push the value into the array
      if (m.get(r[1]).indexOf(r[0]) === -1) {
        m.get(r[1]).push(r[0]);
        // increment the rowCounter
        rowCounter++
      }
    })

    // Build DML statements from the map ================================================================================
    msgLog("Building DML Statements...", jobLogger)

    // Insert new IDs
    let systemString = ""

    // Keep track of how many DML statements are being sent
    dmlStatementCounter = 0

    // Keep track of how many inserts are being sent
    insertCounter = 0

    // Iterate through the map
    for (let recordsId of m.keys()) {
      // Delete all records for the given recordsId
      systemString += `DELETE FROM zk_systems_subsystems_records WHERE obj_records_Id=${recordsId}; `;
      dmlStatementCounter++
      // Insert new records for the given recordsId
      for (let systemId of m.get(recordsId)) {
        // Append the DML statement to the string
        systemString += `INSERT INTO zk_systems_subsystems_records (obj_records_Id, obj_systems_subsystems_Id) VALUES (${recordsId}, ${systemId}); `;
        dmlStatementCounter++
        insertCounter++
      }
    }

    msgLog("Sending DML Statements: " + dmlStatementCounter, jobLogger)

    // Send the DML statements to the database
    await executeDmlStmts(sql, systemString, rowCounter, insertCounter, response, requester, jobLogger, jobId, postprocesJobExecution, disableLogQuery);
  } catch (error) {
    msgLog("Google api error::: Start", jobLogger);
    msgLog(sheetID, jobLogger);
    msgLog(dataRange, jobLogger);
    msgLog(error, jobLogger);
    msgLog(error.stack, jobLogger);
    msgLog("Google api error::: End", jobLogger);
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - ERROR: Google Sheets API returned...\n${error.message}`, requester, "log_update_zk_systems_subsystems_records", response);
    }
    if (requester === "GearCronJ") {
      msgLog("The API returned an error: " + error, jobLogger);
      if (postprocesJobExecution) {
        await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      }
    } else {
      sendResponse(response, { error: "The API returned an error: " + error });
    }
  }
}

async function executeDmlStmts(sql, systemString, rowCounter, insertCounter, response, requester, jobLogger, jobId, postprocesJobExecution, disableLogQuery) {
  let msg = "Sending refresh all query using Google Sheet";
  try {
    const data = await sql.promise().query(`${systemString}`);

    let date = new Date();
    // log the success to the database
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - ${insertCounter} rows inserted successfully`, 
      requester, `log_update_zk_systems_subsystems_records`, response);
    }
    const summary = {
      "tot_executions": dmlStatementCounter,
      "tot_inserts": insertCounter,
      "tot_rows": rowCounter,
      "ran_by": requester,
      "last_ran": (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
    };

    if (requester === "GearCronJ") {
      msgLog(JSON.stringify(summary), jobLogger);
      if (postprocesJobExecution) {
        await postprocesJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
      }
    } else {
      response.status(200).json(summary);
    }
    console.log("Finished sending DML Statements");
  } catch (error) {
    msgLog(`DB Query Error while executing ${msg}: `, jobLogger);
    msgLog(error, jobLogger);

    // log the error to the database
    if (!disableLogQuery) {
      await buildLogQueryAsync(sql, `Update All Related Records - ERROR: ${msg}: ` || error.message, requester, `log_update_zk_systems_subsystems_records`, response);
    }
    if (requester === "GearCronJ") {
      msgLog(error.message || `DB Query Error while executing ${msg}`, jobLogger);
      msgLog(error.stack, jobLogger);
      if (postprocesJobExecution) {
        await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      }
    } else {
      response.status(501).json({ message: error.message || `DB Query Error while executing ${msg}`, });
    }
  }
}

/**
 * Retrieve only one record by ID from the following spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
async function single(auth, response, sheetID, dataRange, requester, jobLogger, jobId, postprocesJobExecution, disableLogQuery, key) {

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: dataRange,
    });

    const rows = res.data.values;
    if (rows.length) {
      const headers = rows[0];
      var data = [];

      // Structure rows into an object
      for (let i = 1; i < rows.length; i++) {
        row = {};
        for (j = 0; j < headers.length; j++) {
          row[headers[j]] = rows[i][j];
        }
        data.push(row);
      }

      // Send error if no data
      if (!data) {
        sendResponse(response, null);
        return;
      }

      // Filter down to desired ID
      var singleID = data.filter(function (d) {
        if (d.Id) {
          return d.Id === key;
        } else if (d.Rec_ID) {
          return d.Rec_ID === key;
        }
      });
      sendResponse(response, singleID);
      return singleID;
    }
  } catch (error) {
    if (requester === "GearCronJ") {
      msgLog("The API returned an error: " + err, jobLogger);
      if (postprocesJobExecution) {
        await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      }
    } else {
      sendResponse(response, { error: "The API returned an error: " + err });
    }
  }
}

// Send the response
function sendResponse(response, data) {
  if (data) response = response.status(200).json(data);
  else if (data === null)
    response = response.status(506).json({ error: "No data found." });
  else if (data.error)
    response = response
      .status(507)
      .json({ error: "The API returned an error: " + err });
}

exports.updatePocs = (req, res) => {
  let stream = fs.createReadStream("./pocs/GSA_Pocs.csv");
  let pocCsv = [];
  let csvStream = fastcsv
    .parse()
    .on("data", function (data) {
      pocCsv.push(data);
    })
    .on("end", function () {
      // remove the first line: header
      pocCsv.shift();

      let query = "REPLACE INTO obj_ldap_poc (SamAccountName, FirstName, LastName, Email, Phone, OrgCode, Position, EmployeeType) VALUES ?";

      sql.query(query, [pocCsv], (error, response) => {
        console.log(error || response);
      });
    });

  stream.pipe(csvStream);
}


// ========================================================================================================================================
// Technopedia
// ========================================================================================================================================
// ... the code below facilitates the integration with Flexera to import the Technopedia data
// ========================================================================================================================================


// ===================================
// log folder paths

const logFolderPath = `tech_catalog_data/logs`;     // path for main log folder

// ===================================
// import component functions

function getValidDatasets() {
  const validDatasets =
    ['Manufacturer',
      'Platform',
      'SoftwareEdition',
      'SoftwareFamily',
      'SoftwareLifecycle',
      'SoftwareMarketVersion',
      'SoftwareProduct',
      'SoftwareProductLink',
      'SoftwareRelease',
      'SoftwareReleaseLink',
      'SoftwareReleasePlatform',
      'SoftwareVersion',
      'Taxonomy'];

  return validDatasets;
}

async function validateRequest(data, logHeader = null) {

  // - description: validates the refresh token and dataset name
  // - parameters: refreshToken (string), datasetName (string)
  // - returns: result (boolean)
  // - throws: error (string)

  const refreshToken = data.refreshtoken;
  const datasetName = data.dataset;
  const takeAmount = data.takeamount;
  const importId = data.importid;

  let validationMsg = '';
  let result = true;

  logger(`${formatDateTime(new Date())}${logHeader}`, `... validating import request parameters`);

  // validating refreshToken
  // verify if refreskToken was provided
  if (refreshToken === undefined || refreshToken === null || refreshToken === '') {
    validationMsg = validationMsg + `- refresh token provided is empty or invalid\n`;
    result = false;
  }

  // validating datasetName
  // verify if datasetName was provided
  if (datasetName === undefined || datasetName === null || datasetName === '') {
    validationMsg = validationMsg + `- dataset name provided is empty or invalid\n`;
    result = false;
  }

  // validating datasetName
  // TO DO: update this to verify by querying the datasets db table
  // verify if datasetName is supported
  if (!getValidDatasets().includes(datasetName)) {
    validationMsg = validationMsg + `- dataset name provided is not supported\n`;
    result = false;
  }

  // validating takeAmount
  if (takeAmount === undefined || takeAmount === null || takeAmount === '') {
    validationMsg = validationMsg + `- take amount provided is empty or invalid\n`;
    result = false;
  } else if (takeAmount < 1 || takeAmount > 10000) {
    validationMsg = validationMsg + `- take amount provided is out of range\n`;
    result = false;
  }

  // TO DO: validating importId



  if (result) {
    logger(`${formatDateTime(new Date())}${logHeader}`, `... request parameters are valid`);
    return result;
  } else {
    throw validationMsg;
  }
}

async function getLastRecordId(tableName, logHeader = null) {

  // - description: gets the id for the last record inserted into the database table for a dataset
  // - parameters: tableName (string)
  // - returns: lastRecordId (string)

  let timer = timer();

  logger(`${formatDateTime(new Date())}${logHeader}`, `... getting the last id from ${tableName}`);

  let lastRecordId = null;

  // get the max id from the database
  let [rows, fields] = await connPromisePool.query(`select max(id) as lastId from ${tableName};`);

  // set the lastRecordId
  lastRecordId = rows[0].lastId;

  if (lastRecordId === null || lastRecordId === '') {
    throw `database returned null for last record id`;
  }

  timer = timer(timer);

  logger(`${formatDateTime(new Date())}${logHeader}`, `... retrieved last id: [${lastRecordId}] in ${timer}`);

  return lastRecordId;
}

async function getLastSyncDate(tableName, logHeader = null) {

  // - description: gets the max synchronizedDate value from the database table for a dataset
  // - parameters: tableName (string)
  // - returns: lastSynchronizedDate (string)

  logger(`${formatDateTime(new Date())}${logHeader}`, `... getting the last synchronizedDate from db table ${tableName}`);

  let lastSynchronizedDate = null;

  // send request for the max synchronizedDate from the database
  let [rows, fields] = await connPromisePool.query(`select max(synchronizedDate) as lastSynchronizedDate from ${tableName};`);

  // get lastSynchronizedDate from response
  lastSynchronizedDate = rows[0].lastSynchronizedDate;

  // check if lastSynchronizedDate is null
  if (lastSynchronizedDate === null || lastSynchronizedDate === undefined) {
    throw `database returned null for last synchronized date`;
  }

  logger(`${formatDateTime(new Date())}${logHeader}`, `... retrieved last synchronizedDate: [${formatDateTime(lastSynchronizedDate)}]`);

  return lastSynchronizedDate;

}

async function getTableRecordCount(tableName, logHeader = null) {

  // - description: gets the total record count of a database table for a dataset
  // - parameters: tableName (string)
  // - returns: count (int)

  logger(`${formatDateTime(new Date())}${logHeader}`, `... getting table record count from ${tableName}`);

  let count = null;

  // send request
  let [rows, fields] = await connPromisePool.query(`select count(*) as totalCount from ${tableName};`);

  // get lastSynchronizedDate from response
  count = rows[0].totalCount;

  // check if lastSynchronizedDate is null
  if (count === null || count === undefined) {
    throw `database returned null for total record count`;
  }

  logger(`${formatDateTime(new Date())}${logHeader}`, `... ${count} records in ${tableName}`);

  return count;

}

async function getAccessToken(refreshToken, logHeader = null) {

  // - description: get a new access token from flexera API
  // - parameters: refreshToken
  // - returns: accessToken, errorMessage

  logger(`${formatDateTime(new Date())}${logHeader}`, `... getting the access token`);

  let accessToken = null;

  const response = await fetch('https://login.flexera.com/oidc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  // check if response is ok
  if (response.ok) {

    // get json from response
    const data = await response.json();

    // set the access token
    accessToken = String(data.access_token);

    // check if accessToken is empty
    if (accessToken === null || accessToken === '') {
      throw `access token api call returned null`;
    }

  } else {
    throw `access token api call returned bad response: ${response.status} ${response.statusText}`;
  }

  logger(`${formatDateTime(new Date())}${logHeader}`, `... retrieved access token (${accessToken.length})`);

  return accessToken;

}

async function buildAPIQuery(datasetName, takeAmt, afterId, queryColumnType, isToBeDeleted = null, logHeader = null, recordId = null) {

  // - description: assembles the graphql query that gets the correct data by dataset
  // - parameters: datasetName, takeAmt(default:10,000), afterId(string), queryColumnType("all" or "meta")
  // - returns: apiQuery(string), errorMessage(string)
  // - throws: error when datasetName is not supported

  logger(`${formatDateTime(new Date())}${logHeader}`, `... building graphql query (afterId:${afterId}, columns:${queryColumnType})`);

  let graphqlQuery = null;              // stores the graphql query to return
  let additionalQueryParameters = '';   // stores the additional graphql query parameters
  let columnList = '';                  // stores the column list to add to graphql query

  // ... check if requesting for specific record
  if (recordId !== null) {
    // ... add recordId to the query
    additionalQueryParameters = additionalQueryParameters + ` id: "${recordId}"`;
  } else {
    // ... add afterId parameter and lastRecordId value to the query, if afterId is not null
    if (afterId !== null) {
      additionalQueryParameters = additionalQueryParameters + ` afterId: "${afterId}"`;
    }
  }

  // ... add isToBeDeleted parameter and isToBeDeleted value to the query, if isToBeDeleted is not null
  if (isToBeDeleted !== null) {
    additionalQueryParameters = additionalQueryParameters + ` isToBeDeleted: ${isToBeDeleted}`;
  }

  if (queryColumnType === 'all') {

    // ... select column list to add to graphql query to get data for ALL columns
    switch (await datasetName) {
      case 'Manufacturer':
        columnList = `id
        acquiredDate
        city
        country
        createdDate
        deleteReason
        description
        email
        employees
        employeesDate
        fax
        fiscalEndDate
        isPubliclyTraded
        isToBeDeleted
        knownAs
        legal
        name
        ownerId
        phone
        profitsDate
        profitsPerYear
        replacementId
        revenue
        revenueDate
        state
        street
        symbol
        synchronizedDate
        tier
        toBeDeletedOn
        updatedDate
        website
        zip
        `;
        break;
      case 'Platform':
        columnList = `id
        createdDate
        deleteReason
        isToBeDeleted
        name
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        `;
        break;
      case 'SoftwareEdition':
        columnList = `id
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isToBeDeleted
        name
        order
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        softwareProduct { id }
        `;
        break;
      case 'SoftwareFamily':
        columnList = `id
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isToBeDeleted
        name
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        manufacturer { id }
        taxonomy { id }
        `;
        break;
      case 'SoftwareLifecycle':
        columnList = `id
        createdDate
        deleteReason
        endOfLife
        endOfLifeCalculatedCase
        endOfLifeDate
        endOfLifeDateCalculated
        endOfLifeException
        endOfLifeSupportLevel
        generalAvailability
        generalAvailabilityDate
        generalAvailabilityDateCalculated
        generalAvailabilityException
        isToBeDeleted
        obsolete
        obsoleteCalculatedCase
        obsoleteDate
        obsoleteDateCalculated
        obsoleteException
        obsoleteSupportLevel
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        softwareRelease { id }
        softwareSupportStage {
          definition
          endDate
          manufacturerId
          name
          order
          policy
          publishedEndDate
        }
        `;
        break;
      case 'SoftwareMarketVersion':
        columnList = `id
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isToBeDeleted
        name
        order
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        softwareProduct { id }
        `;
        break;
      case 'SoftwareProduct':
        columnList = `id
        alias
        application
        cloud
        component
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isFamilyInFullName
        isSuite
        isToBeDeleted
        name
        productLicensable
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        manufacturer { id }
        softwareFamily { id }
        taxonomy { id }
        `;
        break;
      case 'SoftwareProductLink':
        columnList = `id
        cloud
        createdDate
        deleteReason
        formerSoftwareProductId
        isToBeDeleted
        laterSoftwareProductId
        latestSoftwareProductId
        oldestSoftwareProductId
        replacementId
        softwareCloudId
        softwareOnPremId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        `;
        break;
      case 'SoftwareRelease':
        columnList = `id
        application
        cloud
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isLicensable
        isMajor
        isToBeDeleted
        majorSoftwareReleaseId
        name
        patchLevel
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        scaOpenSource { id }
        softwareEdition { id }
        softwareProduct { id }
        softwareVersion { id }
        `;
        break;
      case 'SoftwareReleaseLink':
        columnList = `id
        createdDate
        deleteReason
        formerSoftwareReleaseId
        isToBeDeleted
        laterSoftwareReleaseId
        latestSoftwareReleaseId
        oldestSoftwareReleaseId
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        softwareRelease { id }
        `;
        break;
      case 'SoftwareReleasePlatform':
        columnList = `id
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isToBeDeleted
        platformLabel
        platformType
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        platform { id }
        softwareRelease { id }
        `;
        break;
      case 'SoftwareVersion':
        columnList = `id
        createdDate
        deleteReason
        isDesupported
        isDiscontinued
        isMajor
        isToBeDeleted
        majorSoftwareVersionId
        name
        order
        patchLevel
        replacementId
        synchronizedDate
        toBeDeletedOn
        updatedDate
        versionStage
        softwareMarketVersion { id }
        softwareProduct { id }
        `;
        break;
      case 'Taxonomy':
        columnList = `id
        category
        categoryGroup
        categoryId
        createdDate
        deleteReason
        description
        isToBeDeleted
        replacementId
        softwareOrHardware
        subcategory
        synchronizedDate
        toBeDeletedOn
        updatedDate
        `;
        break;
      default:
        throw 'invalid dataset name provided when building graphql query';
    }

  } else if (queryColumnType === "meta") {

    // ... select column list to add to graphql query to get data for meta columns
    // ...... these columns are shared by all datasets
    columnList = `id
                  createdDate
                  deleteReason
                  isToBeDeleted
                  replacementId
                  synchronizedDate
                  toBeDeletedOn
                  updatedDate
                  `;

  } else {
    throw `invalid queryColumnType provided when building graphql query`;
  }

  // build graphql query
  graphqlQuery = JSON.stringify({
    query: `{
      ${datasetName}(take: ${takeAmt}${additionalQueryParameters} ) {
          ${columnList}
      }
    }`,
  });

  logger(`${formatDateTime(new Date())}${logHeader}`, `... completed building graphql query`);

  //logger(`${formatDateTime(new Date())}${logHeader}`, `(TESTING) graphql query: ${graphqlQuery}`); // DEBUG

  // return query string
  return graphqlQuery;
}

async function sendAPIQuery(graphqlQuery, accessToken, logHeader = null) {

  // - description: sends the graphql query to flexeras api and returns the json response
  // - parameters: graphqlQuery (string), accessToken (string)
  // - returns: pageJson (json object)

  logger(`${formatDateTime(new Date())}${logHeader}`, `... sending API request for page data`);

  let pageJson = {};      // json object to hold the json response from the api

  // get data from api
  const apiResponse = await fetch("https://beta.api.flexera.com/content/v2/orgs/35253/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + accessToken,
    },
    body: graphqlQuery,
  });

  // check if api response is ok
  if (apiResponse.ok) {

    // get json from api response
    pageJson = await apiResponse.json();

    logger(`${formatDateTime(new Date())}${logHeader}`, `... request for page data returned ok response`);

    return pageJson;

  } else {
    throw `ERROR: the flexera api returned a bad response when sending the flexera api query: \n${graphqlQuery} \nFlexera API Response: \n${apiResponse.status} - ${apiResponse.statusText}`;
  }

}

function getInsertColumnsList(datasetName) {

  // - description: gets the list of columns used when inserting a record for a dataset
  // - parameters: datasetName (string)
  // - returns: insertColumnsList (string)
  // - throws: error if invalid datasetName provided

  let insertStatement = '';     // string to hold the insert query

  // select and add columns list for the insert statement
  switch (datasetName) {
    case 'Manufacturer':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'acquiredDate,'	   // dt:DATETIME
        + 'city,'	   // dt:VARCHAR
        + 'country,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:DATETIME
        + 'deleteReason,'	   // dt:VARCHAR
        + 'description,'	   // dt:VARCHAR
        + 'email,'	   // dt:VARCHAR
        + 'employees,'	   // dt:VARCHAR
        + 'employeesDate,'	   // dt:DATETIME
        + 'fax,'	   // dt:VARCHAR
        + 'fiscalEndDate,'	   // dt:DATETIME
        + 'isPubliclyTraded,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'knownAs,'	   // dt:VARCHAR
        + 'legal,'	   // dt:VARCHAR
        + 'name,'	   // dt:VARCHAR
        + 'ownerId,'	   // dt:VARCHAR
        + 'phone,'	   // dt:VARCHAR
        + 'profitsDate,'	   // dt:DATETIME
        + 'profitsPerYear,'	   // dt:INT
        + 'replacementId,'	   // dt:VARCHAR
        + 'revenue,'	   // dt:INT
        + 'revenueDate,'	   // dt:DATETIME
        + 'state,'	   // dt:VARCHAR
        + 'street,'	   // dt:VARCHAR
        + 'symbol,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:DATETIME
        + 'tier,'	   // dt:INT
        + 'toBeDeletedOn,'	   // dt:DATETIME
        + 'updatedDate,'	   // dt:DATETIME
        + 'website,'	   // dt:VARCHAR
        + 'zip,'	   // dt:VARCHAR
      break;
    case 'Platform':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:DATETIME
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'name,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:DATETIME
        + 'toBeDeletedOn,'	   // dt:DATETIME
        + 'updatedDate,'	   // dt:DATETIME
      break;
    case 'SoftwareEdition':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:DATETIME
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'name,'	   // dt:VARCHAR
        + 'order_,'	   // dt:INT
        + 'replacementId,'	   // dt:INT
        + 'synchronizedDate,'	   // dt:DATETIME
        + 'toBeDeletedOn,'	   // dt:DATETIME
        + 'updatedDate,'	   // dt:DATETIME
        + 'softwareProduct,'	   // dt:VARCHAR
      break;
    case 'SoftwareFamily':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'name,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:INT
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'manufacturer,'	   // dt:VARCHAR
        + 'taxonomy,'	   // dt:VARCHAR
      break;
    case 'SoftwareLifecycle':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'endOfLife,'	   // dt:VARCHAR
        + 'endOfLifeCalculatedCase,'	   // dt:VARCHAR
        + 'endOfLifeDate,'	   // dt:DATE
        + 'endOfLifeDateCalculated,'	   // dt:TIMESTAMP
        + 'endOfLifeException,'	   // dt:VARCHAR
        + 'endOfLifeSupportLevel,'	   // dt:VARCHAR
        + 'generalAvailability,'	   // dt:VARCHAR
        + 'generalAvailabilityDate,'	   // dt:TIMESTAMP
        + 'generalAvailabilityDateCalculated,'	   // dt:TIMESTAMP
        + 'generalAvailabilityException,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'obsolete,'	   // dt:VARCHAR
        + 'obsoleteCalculatedCase,'	   // dt:VARCHAR
        + 'obsoleteDate,'	   // dt:TIMESTAMP
        + 'obsoleteDateCalculated,'	   // dt:TIMESTAMP
        + 'obsoleteException,'	   // dt:VARCHAR
        + 'obsoleteSupportLevel,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'softwareRelease,'	   // dt:VARCHAR
      break;
    case 'SoftwareMarketVersion':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'name,'	   // dt:VARCHAR
        + 'order_,'	   // dt:INT
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'softwareProduct,'	   // dt:VARCHAR
      break;
    case 'SoftwareProduct':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'alias,'	   // dt:VARCHAR
        + 'application,'	   // dt:VARCHAR
        + 'cloud,'	   // dt:VARCHAR
        + 'component,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isFamilyInFullName,'	   // dt:TINYINT
        + 'isSuite,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'name,'	   // dt:VARCHAR
        + 'productLicensable,'	   // dt:INT
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'manufacturer,'	   // dt:VARCHAR
        + 'softwareFamily,'	   // dt:VARCHAR
        + 'taxonomy,'	   // dt:VARCHAR
      break;
    case 'SoftwareProductLink':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'cloud,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'formerSoftwareProductId,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'laterSoftwareProductId,'	   // dt:VARCHAR
        + 'latestSoftwareProductId,'	   // dt:VARCHAR
        + 'oldestSoftwareProductId,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'softwareCloudId,'	   // dt:VARCHAR
        + 'softwareOnPremId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'softwareProduct,'	   // dt:VARCHAR
      break;
    case 'SoftwareRelease':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'application,'	   // dt:VARCHAR
        + 'cloud,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isLicensable,'	   // dt:TINYINT
        + 'isMajor,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'majorSoftwareReleaseId,'	   // dt:VARCHAR
        + 'name,'	   // dt:VARCHAR
        + 'patchLevel,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'scaOpenSource,'	   // dt:VARCHAR
        + 'softwareEdition,'	   // dt:VARCHAR
        + 'softwareProduct,'	   // dt:VARCHAR
        + 'softwareVersion,'	   // dt:VARCHAR
      break;
    case 'SoftwareReleaseLink':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'formerSoftwareReleaseId,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'laterSoftwareReleaseId,'	   // dt:VARCHAR
        + 'latestSoftwareReleaseId,'	   // dt:VARCHAR
        + 'oldestSoftwareReleaseId,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'softwareRelease,'	   // dt:VARCHAR
      break;
    case 'SoftwareReleasePlatform':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:TIMESTAMP
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'platformLabel,'	   // dt:VARCHAR
        + 'platformType,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:TIMESTAMP
        + 'toBeDeletedOn,'	   // dt:DATE
        + 'updatedDate,'	   // dt:TIMESTAMP
        + 'platform,'	   // dt:VARCHAR
        + 'softwareRelease,'	   // dt:VARCHAR
      break;
    case 'SoftwareVersion':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:DATETIME
        + 'deleteReason,'	   // dt:VARCHAR
        + 'isDesupported,'	   // dt:TINYINT
        + 'isDiscontinued,'	   // dt:TINYINT
        + 'isMajor,'	   // dt:TINYINT
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'majorSoftwareVersionId,'	   // dt:VARCHAR
        + 'name,'	   // dt:VARCHAR
        + 'order_,'	   // dt:INT
        + 'patchLevel,'	   // dt:VARCHAR
        + 'replacementId,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:DATETIME
        + 'toBeDeletedOn,'	   // dt:DATETIME
        + 'updatedDate,'	   // dt:DATETIME
        + 'versionStage,'	   // dt:VARCHAR
        + 'softwareMarketVersion,'	   // dt:VARCHAR
        + 'softwareProduct,'	   // dt:VARCHAR
      break;
    case 'Taxonomy':
      insertStatement = insertStatement
        + 'id,'	   // dt:VARCHAR
        + 'category,'	   // dt:VARCHAR
        + 'categoryGroup,'	   // dt:VARCHAR
        + 'categoryId,'	   // dt:VARCHAR
        + 'createdDate,'	   // dt:DATETIME
        + 'deleteReason,'	   // dt:VARCHAR
        + 'description,'	   // dt:VARCHAR
        + 'isToBeDeleted,'	   // dt:TINYINT
        + 'replacementId,'	   // dt:VARCHAR
        + 'softwareOrHardware,'	   // dt:VARCHAR
        + 'subcategory,'	   // dt:VARCHAR
        + 'synchronizedDate,'	   // dt:DATETIME
        + 'toBeDeletedOn,'	   // dt:DATETIME
        + 'updatedDate,'	   // dt:DATETIME
      break;
    default:
      throw `dataset provide when getting insert columns list is not supported: ${datasetName}`;
  }

  return insertStatement;
}

async function getUpdateColumnsList(datasetName) {

  // - description: gets the list of columns used when inserting a record for a dataset
  // - parameters: datasetName (string)
  // - returns: insertColumnsList (string)
  // - throws: error if invalid datasetName provided

  let setStatement = '';

  // ... add column names to SET clause
  switch (await datasetName) {
    case 'Manufacturer':
      setStatement = `
        acquiredDate = VALUES(acquiredDate),
        city = VALUES(city),
        country = VALUES(country),
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        description = VALUES(description),
        email = VALUES(email),
        employees = VALUES(employees),
        employeesDate = VALUES(employeesDate),
        fax = VALUES(fax),
        fiscalEndDate = VALUES(fiscalEndDate),
        isPubliclyTraded = VALUES(isPubliclyTraded),
        isToBeDeleted = VALUES(isToBeDeleted),
        knownAs = VALUES(knownAs),
        legal = VALUES(legal),
        name = VALUES(name),
        ownerId = VALUES(ownerId),
        phone = VALUES(phone),
        profitsDate = VALUES(profitsDate),
        profitsPerYear = VALUES(profitsPerYear),
        replacementId = VALUES(replacementId),
        revenue = VALUES(revenue),
        revenueDate = VALUES(revenueDate),
        state = VALUES(state),
        street = VALUES(street),
        symbol = VALUES(symbol),
        synchronizedDate = VALUES(synchronizedDate),
        tier = VALUES(tier),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        website = VALUES(website),
        zip = VALUES(zip); `;
      break;
    case 'Platform':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isToBeDeleted = VALUES(isToBeDeleted),
        name = VALUES(name),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate); `;
      break;
    case 'SoftwareEdition':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isToBeDeleted = VALUES(isToBeDeleted),
        name = VALUES(name),
        order_ = VALUES(order_),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        softwareProduct = VALUES(softwareProduct); `;
      break;
    case 'SoftwareFamily':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isToBeDeleted = VALUES(isToBeDeleted),
        name = VALUES(name),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        manufacturer = VALUES(manufacturer),
        taxonomy = VALUES(taxonomy); `;
      break;
    case 'SoftwareLifecycle':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        endOfLife = VALUES(endOfLife),
        endOfLifeCalculatedCase = VALUES(endOfLifeCalculatedCase),
        endOfLifeDate = VALUES(endOfLifeDate),
        endOfLifeDateCalculated = VALUES(endOfLifeDateCalculated),
        endOfLifeException = VALUES(endOfLifeException),
        endOfLifeSupportLevel = VALUES(endOfLifeSupportLevel),
        generalAvailability = VALUES(generalAvailability),
        generalAvailabilityDate = VALUES(generalAvailabilityDate),
        generalAvailabilityDateCalculated = VALUES(generalAvailabilityDateCalculated),
        generalAvailabilityException = VALUES(generalAvailabilityException),
        isToBeDeleted = VALUES(isToBeDeleted),
        obsolete = VALUES(obsolete),
        obsoleteCalculatedCase = VALUES(obsoleteCalculatedCase),
        obsoleteDate = VALUES(obsoleteDate),
        obsoleteDateCalculated = VALUES(obsoleteDateCalculated),
        obsoleteException = VALUES(obsoleteException),
        obsoleteSupportLevel = VALUES(obsoleteSupportLevel),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        softwareRelease = VALUES(softwareRelease); `;
      break;
    case 'SoftwareMarketVersion':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isToBeDeleted = VALUES(isToBeDeleted),
        name = VALUES(name),
        order_ = VALUES(order_),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        softwareProduct = VALUES(softwareProduct); `;
      break;
    case 'SoftwareProduct':
      setStatement = `
        alias = VALUES(alias),
        application = VALUES(application),
        cloud = VALUES(cloud),
        component = VALUES(component),
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isFamilyInFullName = VALUES(isFamilyInFullName),
        isSuite = VALUES(isSuite),
        isToBeDeleted = VALUES(isToBeDeleted),
        name = VALUES(name),
        productLicensable = VALUES(productLicensable),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        manufacturer = VALUES(manufacturer),
        softwareFamily = VALUES(softwareFamily),
        taxonomy = VALUES(taxonomy); `;
      break;
    case 'SoftwareProductLink':
      setStatement = `
        cloud = VALUES(cloud),
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        formerSoftwareProductId = VALUES(formerSoftwareProductId),
        isToBeDeleted = VALUES(isToBeDeleted),
        laterSoftwareProductId = VALUES(laterSoftwareProductId),
        latestSoftwareProductId = VALUES(latestSoftwareProductId),
        oldestSoftwareProductId = VALUES(oldestSoftwareProductId),
        replacementId = VALUES(replacementId),
        softwareCloudId = VALUES(softwareCloudId),
        softwareOnPremId = VALUES(softwareOnPremId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        softwareProduct = VALUES(softwareProduct); `;
      break;
    case 'SoftwareRelease':
      setStatement = `
        application = VALUES(application),
        cloud = VALUES(cloud),
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isLicensable = VALUES(isLicensable),
        isMajor = VALUES(isMajor),
        isToBeDeleted = VALUES(isToBeDeleted),
        majorSoftwareReleaseId = VALUES(majorSoftwareReleaseId),
        name = VALUES(name),
        patchLevel = VALUES(patchLevel),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        scaOpenSource = VALUES(scaOpenSource),
        softwareEdition = VALUES(softwareEdition),
        softwareProduct = VALUES(softwareProduct),
        softwareVersion = VALUES(softwareVersion); `;
      break;
    case 'SoftwareReleaseLink':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        formerSoftwareReleaseId = VALUES(formerSoftwareReleaseId),
        isToBeDeleted = VALUES(isToBeDeleted),
        laterSoftwareReleaseId = VALUES(laterSoftwareReleaseId),
        latestSoftwareReleaseId = VALUES(latestSoftwareReleaseId),
        oldestSoftwareReleaseId = VALUES(oldestSoftwareReleaseId),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        softwareRelease = VALUES(softwareRelease); `;
      break;
    case 'SoftwareReleasePlatform':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isToBeDeleted = VALUES(isToBeDeleted),
        platformLabel = VALUES(platformLabel),
        platformType = VALUES(platformType),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        platform = VALUES(platform),
        softwareRelease = VALUES(softwareRelease); `;
      break;
    case 'SoftwareVersion':
      setStatement = `
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        isDesupported = VALUES(isDesupported),
        isDiscontinued = VALUES(isDiscontinued),
        isMajor = VALUES(isMajor),
        isToBeDeleted = VALUES(isToBeDeleted),
        majorSoftwareVersionId = VALUES(majorSoftwareVersionId),
        name = VALUES(name),
        order_ = VALUES(order_),
        patchLevel = VALUES(patchLevel),
        replacementId = VALUES(replacementId),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate),
        versionStage = VALUES(versionStage),
        softwareMarketVersion = VALUES(softwareMarketVersion),
        softwareProduct = VALUES(softwareProduct); `;
      break;
    case 'Taxonomy':
      setStatement = `
        category = VALUES(category),
        categoryGroup = VALUES(categoryGroup),
        categoryId = VALUES(categoryId),
        createdDate = VALUES(createdDate),
        deleteReason = VALUES(deleteReason),
        description = VALUES(description),
        isToBeDeleted = VALUES(isToBeDeleted),
        replacementId = VALUES(replacementId),
        softwareOrHardware = VALUES(softwareOrHardware),
        subcategory = VALUES(subcategory),
        synchronizedDate = VALUES(synchronizedDate),
        toBeDeletedOn = VALUES(toBeDeletedOn),
        updatedDate = VALUES(updatedDate); `;
      break;
    default:
      throw 'invalid dataset name provided when building update statement';
  }

  return setStatement;
}


// TO DO: incomplete functions
/*
async function getDatasetDetails(datasetName) {

  // - description: 
  // - parameters: datasetName (string)
  // - returns: datasetDetails (string)



}

async function insertUpdateRecordAsync (insertStatement, insertValuesMap, importType, datasetName) {

  // - description: insert a record into the database and will wait until the reponse is returned
  // - parameters: 
  // - returns: 


  //logger(`${getLogHeader()}`, `... executing ${importType} statement`);

  // ... insert the record
  // ... send request to insert record into db table and wait for response
  let responseDB = await sql_promise.query(insertStatement, [insertValuesMap]);

  //console.log(responseDB);

  affectRowsCounter = affectRowsCounter + responseDB[0].affectedRows;

  // ... verify in response that correct number of records inserted
  //if (responseDB[0].affectedRows !== insertValuesMap.length) {
  if (responseDB[0].affectedRows <= 0) {

    // ... log error message and continue with the next record
    throw `ERROR: failed to ${importType} ${insertValuesMap.length} ${datasetName} records`;

  }

  //logger(`${getLogHeader()}`, `... completed update updating record`);

}

async function insertUpdateSoftwareSupportStageAsync (insertStatement, insertValuesMap, insertValuesMapSftwSupportStage, importType, datasetName, lastRecordId) {

  let deleteStatementSftwSupportStage = `DELETE FROM tech_catalog.tp_softwareSupportStage WHERE softwareLifecycleId = '${lastRecordId}'; `;
  let insertStatementSftwSupportStage = ``;
    
  
  // DELETE OLD
  // ... delete all existing SoftwareLifecycle.softwareSupportStage records for this softwareLifecycleId
  // ... send request to delete softwareSupportStage records from db table and wait for response
  let responseDB = await sql_promise.query(deleteStatementSftwSupportStage);

  // ... verify in response that correct number of records deleted
  //if (responseDB[0].affectedRows !== insertValuesMapSftwSupportStage.length) {
  if (responseDB[0].affectedRows <= 0) {
    // ... log error message and continue with the next record
    throw `ERROR: failed to delete old tp_softwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
  }

  // INSERT NEW RECORDS
  // ... send request to inSsert softwareSupportStage record into db table and wait for response
  const responseDBSftwSupportStage = await sql_promise.query(insertStatementSftwSupportStage, [insertValuesMapSftwSupportStage]);

  // ... verify in response that correct number of records inserted
  //if (responseDBSftwSupportStage[0].affectedRows !== insertValuesMapSftwSupportStage.length) {
  if (responseDBSftwSupportStage[0].affectedRows <= 0) {
    // ... log error message and continue with the next record
    throw `failed to ${importType} tp_softwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
  }

}

function insertUpdateRecord (record, insertStatement, columnList) {
  
  // - description: 
  // - parameters: 
  // - returns: 



}

async function insertUpdateSoftwareSupportStage (insertStatement, insertValuesMap, insertValuesMapSftwSupportStage, importType, datasetName, lastRecordId) {

  let deleteStatementSftwSupportStage = `DELETE FROM tech_catalog.tp_softwareSupportStage WHERE softwareLifecycleId = '${lastRecordId}'; `;
  let insertStatementSftwSupportStage = ``;
    
  
  // DELETE OLD
  // ... delete all existing SoftwareLifecycle.softwareSupportStage records for this softwareLifecycleId
  // ... send request to delete softwareSupportStage records from db table and wait for response
  let responseDB = await sql_promise.query(deleteStatementSftwSupportStage);

  // ... verify in response that correct number of records deleted
  //if (responseDB[0].affectedRows !== insertValuesMapSftwSupportStage.length) {
  if (responseDB[0].affectedRows <= 0) {
    // ... log error message and continue with the next record
    throw `ERROR: failed to delete old tp_softwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
  }

  // INSERT NEW RECORDS
  // ... send request to inSsert softwareSupportStage record into db table and wait for response
  const responseDBSftwSupportStage = await sql_promise.query(insertStatementSftwSupportStage, [insertValuesMapSftwSupportStage]);

  // ... verify in response that correct number of records inserted
  //if (responseDBSftwSupportStage[0].affectedRows !== insertValuesMapSftwSupportStage.length) {
  if (responseDBSftwSupportStage[0].affectedRows <= 0) {
    // ... log error message and continue with the next record
    throw `failed to ${importType} tp_softwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
  }

}
*/

// ===================================
// import utility functions

//const logMode = '';    

function logger(heading, msg, error = null, logFileName = null) {

  // - description: logs a message to the console, db, and/or file
  // - parameters: msg (string), error (string), errorLogPath (string
  // - returns: msg (string)(optional for returning the response)

  let logMsg = heading + ' ' + msg;

  if (error) {
    logMsg = `${logMsg}\n ${error}\n\n`;
  }

  // log to console
  console.log(`${logMsg}`);

  // log to file
  if (logFileName !== null && logFileName !== '' && logFileName !== undefined) {
    fs.appendFileSync(logFileName, logMsg + '\n');
  }

  // log to db


  return msg;
}

function writeToLogFile(msg, logFileName = null) {

  // - description: writes a message to a log file
  // - parameters: msg (string), logFileName (string)
  // - returns: none

  fs.appendFileSync(logFileName, msg);

}
exports.formatDateTime = (dateObj) => formatDateTime(dateObj);

function formatFileDateTime(dateObj) {

  // - description: formats a date object to the format used in the file name
  // - parameters: dateObj (date object)
  // - returns: formattedDate (string)

  if (dateObj === null || dateObj === '') {
    return null;
  } else {
    let formattedDate = new Date(dateObj);

    // Get the individual date components
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');

    // Get the individual time components
    const hours = String(formattedDate.getHours()).padStart(2, '0');
    const minutes = String(formattedDate.getMinutes()).padStart(2, '0');
    const seconds = String(formattedDate.getSeconds()).padStart(2, '0');

    // Combine the components into the desired format
    formattedDate = `${year}${month}${day}_${hours}.${minutes}`;

    return formattedDate;
  }
}

function formatDuration(start_date, end_date) {

  // - description: calculates the duration between two dates and returns a formatted date string
  // - parameters: start_date (date object), end_date (date object)
  // - returns: result (string)
  if (start_date === null || start_date === '' || end_date === null || end_date === '') {
    return null;
  } else {
    const duration = new Date(end_date - start_date);

    const hours = duration.getUTCHours();
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();

    let result = "";
    if (hours > 0) {
      result += hours + (hours === 1 ? " hour" : " hours");
    }
    if (minutes > 0) {
      if (result !== "") {
        result += ", ";
      }
      result += minutes + (minutes === 1 ? " minute" : " minutes");
    }
    if (seconds > 0) {
      if (result !== "") {
        result += ", ";
      }
      result += seconds + (seconds === 1 ? " second" : " seconds");
    }

    return result;
  }
}

function stringToDate(dateString) {

  // - description: converts a date formatted string to a date object
  // - parameters: dateString (string)
  // - returns: newDate (date object)

  if (dateString === null || dateString === '' || dateString === undefined) {
    return null;
  } else {
    if (dateString.includes('T') && dateString.slice(-1) === 'Z') {
      dateString = dateString.replace('T', ' ').replace('Z', '');
    }

    var newDate = new Date(dateString);
    newDate = newDate.getFullYear() + "-" +
      String(newDate.getMonth() + 1).padStart(2, '0') + "-" +
      String(newDate.getDate()).padStart(2, '0') + " " +
      String(newDate.getHours()).padStart(2, '0') + ":" +
      String(newDate.getMinutes()).padStart(2, '0') + ":" +
      String(newDate.getSeconds()).padStart(2, '0');
    if (newDate === 'NaN-NaN-NaN NaN:NaN:NaN') {
      return null;
    } else {
      return newDate;
    }
  }
}

/*function removeSpecialChar (string) {

  // - description: removes special characters from a string that have been identified as causing issues during insert
  // - parameters: string (string)
  // - returns: string (string)

  if (string === null) {
    return null;
  } else {
    return string = string.replace(/'/g, "").replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\"/g, ' ').replace(/\\/g, ' ');
  }
}*/

function booleanToTinyint(boolean) {

  // - description: converts a boolean to a tinyint when inserting booleans into the database
  // - parameters: boolean (boolean)
  // - returns: tinyint (string)

  if (boolean === null) {
    return null;
  } else {
    if (boolean === true) {
      return '1';
    } else {
      return '0';
    }
  }
}

/*function handleNullId (record) {

  // - description: handles null id values returned from the database
  // - parameters: record (object)
  // - returns: id (string)

  try {
    if (record.id === null) {
      return null;
    } else {
      return record.id;
    }
  } catch (error) {
    return null;
  }
}*/
/*
let timerArray = [];  // array to hold timer objects
function timer (timerObj = null) {

  if (timerObj === null) { // starts timer

    // create new timer object
    let newTimer = new Date();
    let newTimerObject = {
      id : timerArray.length + 1,
      start : newTimer,
      end : null,
      duration : null
    };
    
    // add timer to array
    timerArray.push(newTimerObject);

    logger(`new timer created: `, newTimerObject); // DEBUG
    
    // return new timer object
    return newTimerObject;

  } else { // stops timer

    // add end and duration to timer object
    timerObj.end = formatDateTime(new Date());
    timerObj.duration = formatDuration(timerObj.start, timerObj.end);

    // replace existing log with updated log
    timerArray[timerObj.id] = timerObj;
    
    // return timer object
    return timerObj;

  }

}*/

function getImportId(data = null) {

  var formattedDate = new Date();

  // Get the individual date components
  const year = formattedDate.getFullYear();
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const day = String(formattedDate.getDate()).padStart(2, '0');
  const hours = String(formattedDate.getHours()).padStart(2, '0');
  let minutes = '';
  let seconds = '';

  try {
    if (data.singlerecimportidoverride) {
      minutes = String(formattedDate.getMinutes()).padStart(2, '0');
      //seconds = String(formattedDate.getSeconds()).padStart(2, '0');
    }
  } catch (error) {
    minutes = '';
    seconds = '';
  }

  // Combine the components into the desired format
  formattedDate = parseInt(`${year}${month}${day}${hours}${minutes}${seconds}`);

  return formattedDate;
}


// ===================================
// import process functions

exports.importTechCatlogData = async (data, response) => {

  // IMPORT PARAMETER VARIABLES
  const importType = data.importtype;                                     // import type identifies the type of import to be used for logging
  const refreshToken = data.refreshtoken;                                 // retrieved from the requests body, stores the refresh token for the flexera api to get a new access token
  const requester = data.requester;                                       // retrieved from the requests body, stores the requester's email address
  const datasetName = data.dataset;                                       // dataset name to be pulled // ie. "Taxonomy";
  const takeAmt = data.takeamount;                                        // amount of records to pull per page
  const importId = getImportId(data);                                     // import id identifies a group of import requests to be used for logging
  const isDryRun = data.dryrun;                                           // flag to determine if the import insert/update statement or not
  const importMethod = data.importmethod ? data.importmethod : 'nowait';  // import method to be used for the performing the insert/update statement
  // - 'nowait' or '' sends the insert/update statement to the database and does not wait for a response
  // - 'wait' sends the insert/update statement to the database and waits for a response

  let lastSyncDateOverride = null;                          // last synchronized date to override the last sync date in the database
  let lastIdOverride = null;                                // last id to override the last id in the database
  let maxSyncDateOverride = null;                           // max sync date to override the max sync date in the database
  let isToBeDeletedOnly = null;                             // flag to determine if only records istobedeleted=true should be returned by the flexera api
  let singleRecImportId = null;                             // import id for a single record import

  // 
  let accessToken = '';                                 // stores the flerera api access token
  let graphqlQuery = '';                                // stores the graphql query to be sent to the flexera api

  const tableName = `tech_catalog.tp_${datasetName}`;   // table name based on dataset name// insert table name based on dataset name
  let insertStatement = `insert into ${tableName} (`;   // insert statement for table records
  let isStatementBuilt = false;                         // flag to determine if the update statement has been built

  // SoftwareSupportStage Import (only used for SoftwareLifecycle dataset ONLY)
  //const insertStatementSftwSupportStage = `insert into tech_catalog.tp_SoftwareSupportStage (softwareLifecycleId, definition, endDate, manufacturerId, name, order_, policy, publishedEndDate) values ?`;
  const insertStatementSftwSupportStage = `insert into tech_catalog.tp_SoftwareSupportStage (softwareLifecycleId, synchronizedDate, definition, endDate, manufacturerId, name, order_, policy, publishedEndDate) values (`;

  let softwareSupportStageCounter = 0;                  // counter to determine if the softwareSupportStage insert statement should be built
  let softwareSupportStageInsertedCounter = 0;          // total number of softwareSupportStage records inserted into db
  let softwareSupportStageErrorCounter = 0;             // total number of softwareSupportStage records that failed to insert into db

  let pageCounter = 0;                                  // total number of pages processed
  let pageRequestCounter = 0;                           // total number of page requests made
  let recordCounter = 0;                                // total number of records received
  let recordsFailedCounter = 0;                         // total number of records that failed to insert into db
  let isFatalError = 0;                                 // flag to determine if a fatal error has occurred
  let gatherStats = true;                               // flag to determine if stats should be gathered
  let duplicateJobsRunning = 0;                         // flag to determine if duplicate jobs are running

  let recordsInsertedCounter = 0;                       // total number of records inserted into db
  let recordToUpdateCounter = 0;                        // total number of records to update

  let pageSummaryArray = [];                            // array of page summary objects, page added after completed
  let recordsFailedList = [];                           // list of records that failed to insert into db
  let reImportFailedRecords = false;
  let reImportAttempts = 0;

  let beginTableRecordCount = 0;                        // number of records in the table before the import process begins
  let endTableRecordCount = 0;                          // number of records in the table after the import process ends

  let isLastPage = false;                               // flag to determine if this is the last page
  let lastRecordId = null;                              // id of last record processed
  let lastRecordIdUsed = null;                          // the inital last id value used to start the import process
  let lastSynchronizedDate = null;                      // the last synchronized date for the dataset
  const uploadStartTime = new Date();                   // upload start time //TIMESTAMP();
  let uploadEndTime = null;                             // upload end time //TIMESTAMP();
  let recordCountDisplay = 0;                           // number of records to be displayed in the log header
  let affectRowsCounter1 = 0;                           // number of rows affected by the insert/update statement
  let affectRowsCounter2 = 0;                           // number of rows affected by the insert/update statement
  let affectRowsCounter3 = 0;                           // number of rows affected by the insert/update statement
  let recordsToBeDeletedArray = [];                     // array of records to be deleted
  let deletedRecsNotRemovedCounter = 0;                 // number of records deleted from the table

  let earliestSyncDate = null;                          // earliest sync date for the dataset
  let latestSyncDate = null;                            // latest sync date for the dataset
  let syncYYYYMMDDArray = [];                           // array of sync dates in YYYYMMDD format


  // log file to store general import information
  const importLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_import_log_${formatFileDateTime(uploadStartTime)}.log`;
  // log file to store the list of records to be inserted/updated
  const toSyncListLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_records_to_sync_list_${formatFileDateTime(uploadStartTime)}.log`;
  // log file to store the list of records that were inserted/updated
  const syncedListLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_records_synced_list_${formatFileDateTime(uploadStartTime)}.log`;
  // log file to store the list of records that failed to be inserted/updated
  const deleteListLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_records_to_delete_list_${formatFileDateTime(uploadStartTime)}.log`;
  // log file to store the list of records that failed to be inserted/updated or any other errors during the import process
  const errorLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_ERRORs_${formatFileDateTime(uploadStartTime)}.log`;
  // log file to store the import summary json
  const importSummaryLogFileName = `${logFolderPath}/import_${importType}_${datasetName}_import_summary_${formatFileDateTime(uploadStartTime)}.log`;


  // ... prepares a header without the time to be put in front of each logger message
  function getLogHeaderNoTime() {
    return `/${importId}/${datasetName}/`
      + (pageCounter > 0 ? `p${pageCounter}/`
        + (recordCountDisplay > 0 ? `r${recordCountDisplay}/` : '') : '');
  }
  // ... prepares a header to be put in front of each logger message
  function getLogHeader() {
    return `${formatDateTime(new Date())}${getLogHeaderNoTime()}`;
  }
  // ... returns the import summary at any point in the import process
  function getImportSummary() {
    const summary = {
      message: `Technopedia Data Import`,
      importId: importId,
      importType: importType,
      dataset: datasetName,
      takeAmount: takeAmt,
      dryRun: (isDryRun === 'true' ? 'true' : 'false'),
      lastSyncDateOverride: formatDateTime(lastSyncDateOverride),
      maxSyncDateOverride: formatDateTime(maxSyncDateOverride),
      lastIdOverride: lastIdOverride,
      singleRecImportIdOverride: singleRecImportId,
      isToBeDeletedRecordsOnly: isToBeDeletedOnly,
      lastRecordId: lastRecordId,
      firstAfterIdUsed: lastRecordIdUsed,
      lastSynchronizedDateUsed: formatDateTime(lastSynchronizedDate),
      startTime: formatDateTime(uploadStartTime),
      endTime: formatDateTime(uploadEndTime),
      duration: formatDuration(uploadStartTime, uploadEndTime),
      totalPageRequestsMade: pageRequestCounter,
      totalPages: pageCounter,
      totalRecords: recordCounter,
      totalRecordsToBeInsertedUpdated: recordToUpdateCounter,
      totalRecordsInsertedUpdated: recordsInsertedCounter,
      totalRecordsFailed: recordsFailedCounter,
      totalSoftwareSupportStageRecords: softwareSupportStageCounter,
      totalSoftwareSupportStageRecordsInsUpd: softwareSupportStageInsertedCounter,
      totalSoftwareSupportStageRecordsFailed: softwareSupportStageErrorCounter,
      beginTableRecordCount: beginTableRecordCount,
      endTableRecordCount: endTableRecordCount,
      affectRowsCounter1: affectRowsCounter1,
      affectRowsCounter2: affectRowsCounter2,
      affectRowsCounter3: affectRowsCounter3,
      fatalError: isFatalError,
      logDateTime: formatDateTime(new Date()),
      pageSummaries: "see logs",
      deletedRecsNotRemovedCounter: deletedRecsNotRemovedCounter,
      recordsToBeDeleted: "see logs",
      earliestSyncDate: (earliestSyncDate === null ? null : formatDateTime(earliestSyncDate)),
      latestSyncDate: formatDateTime(latestSyncDate),
      syncYYYYMMDDArray: `see tech_catalog.dataset_syncdate_log table`,
      isGatheringStats: gatherStats,
      failedRecordsList: recordsFailedList
    };
    return summary;
  }
  // ... 
  function updateImportLog(logMessage) {
    try {
      let importLogStatement = null;

      if (uploadEndTime) {
        // get update statement for end of import
        importLogStatement =
          `update tech_catalog.dataset_import_log
            set import_status = '${logMessage}',
                takeAmount = ${takeAmt},
                dryRun = '${(isDryRun === 'true' ? 'true' : 'false')}',
                lastSyncDateOverride = ${lastSyncDateOverride === null ? 'null' : "'" + formatDateTime(lastSyncDateOverride) + "'"},
                lastIdOverride = ${lastIdOverride === null ? 'null' : "'" + lastIdOverride + "'"},
                lastRecordId = '${lastRecordId}',
                firstAfterIdUsed = '${lastRecordIdUsed}',
                lastSynchronizedDateUsed = ${lastSynchronizedDate === null ? 'null' : "'" + formatDateTime(lastSynchronizedDate) + "'"},
                startTime = ${uploadStartTime === null ? 'null' : "'" + formatDateTime(uploadStartTime) + "'"},
                endTime = ${uploadEndTime === null ? 'null' : "'" + formatDateTime(uploadEndTime) + "'"},
                duration = '${formatDuration(uploadStartTime, uploadEndTime)}',
                totalPageRequestsMade = ${pageRequestCounter},
                totalPages = ${pageCounter},
                totalRecords = ${recordCounter},
                totalRecordsToBeInsertedUpdated = ${recordToUpdateCounter},
                totalRecordsInsertedUpdated = ${recordsInsertedCounter},
                totalRecordsFailed = ${recordsFailedCounter},
                totalSoftwareSupportStageRecords = ${softwareSupportStageCounter},
                beginTableRecordCount = ${beginTableRecordCount},
                endTableRecordCount = ${endTableRecordCount},
                fatalError = ${isFatalError},
                fatalErrorMessage = ${isFatalError === 1 ? `'see error log file'` : 'null'}
          WHERE import_id = '${importId}' AND datasetName = '${datasetName}'; `;
      } else {
        // get update statement for end of a page
        importLogStatement =
          `update tech_catalog.dataset_import_log
            set takeAmount = ${takeAmt},
                dryRun = '${(isDryRun === 'true' ? 'true' : 'false')}',
                lastSyncDateOverride = ${lastSyncDateOverride === null ? 'null' : "'" + formatDateTime(lastSyncDateOverride) + "'"},
                lastIdOverride = ${lastIdOverride === null ? 'null' : "'" + lastIdOverride + "'"},
                lastRecordId = '${lastRecordId}',
                firstAfterIdUsed = '${lastRecordIdUsed}',
                lastSynchronizedDateUsed = ${lastSynchronizedDate === null ? 'null' : "'" + formatDateTime(lastSynchronizedDate) + "'"},
                startTime = ${uploadStartTime === null ? 'null' : "'" + formatDateTime(uploadStartTime) + "'"},
                totalPageRequestsMade = ${pageRequestCounter},
                totalPages = ${pageCounter},
                totalRecords = ${recordCounter},
                totalRecordsToBeInsertedUpdated = ${recordToUpdateCounter},
                totalRecordsInsertedUpdated = ${recordsInsertedCounter},
                totalRecordsFailed = ${recordsFailedCounter},
                totalSoftwareSupportStageRecords = ${softwareSupportStageCounter},
                beginTableRecordCount = ${beginTableRecordCount},
                fatalError = ${isFatalError}
          WHERE import_id = '${importId}' AND datasetName = '${datasetName}'; `;
      }

      sql.query(importLogStatement, (err, result) => {
        if (err) {
          logger(`${getLogHeader()}`, `failed to update import log`, err, errorLogFileName);
        }
      });

    } catch (error) {
      logger(`${getLogHeader()}`, `an unexpected error occurred during updateImportLog()`, error, errorLogFileName);
    }
  }
  // ... performs the required tasks before ending the import process
  async function endImport() {
    try {

      let logMessage = null;

      // ... setting end time
      uploadEndTime = new Date();

      // ... if fatalError or duplicateJobsRunning
      if (isFatalError === 1) {
        logger(`${getLogHeader()}`, `ENDING IMPORT DUE TO FATAL ERROR`, null, importLogFileName);
      } else if (duplicateJobsRunning === 1) {
        logger(`${getLogHeader()}`, `ENDING IMPORT DUE TO DUPLICATE JOB RUNNING`, null, importLogFileName);
      }

      // ... inserting the record count summary by syncdate
      let syncDateInsertStatements = '';

      for (let i = 0; i < syncYYYYMMDDArray.length; i++) {
        syncDateInsertStatements = syncDateInsertStatements + ` insert into tech_catalog.dataset_syncdate_log (import_id, datasetName, syncDate, recordCount) values ( '${importId}', '${datasetName}', '${syncYYYYMMDDArray[i].syncDate}', ${syncYYYYMMDDArray[i].recordCount}); `;
      }

      if (syncDateInsertStatements !== '') {
        sql.query(syncDateInsertStatements, (err, result) => {
          if (err) {
            logger(`${getLogHeader()}`, `failed to insert sync date log`, err, errorLogFileName);
          }
        });
      }

      // ... wait 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));

      // ... get the ending table record count
      endTableRecordCount = await getTableRecordCount(tableName, getLogHeaderNoTime());

      // ... get the import summary
      let summary = getImportSummary();

      // ... log import summary file
      writeToLogFile(JSON.stringify(summary), importSummaryLogFileName);

      // ... set the import status message
      if (isFatalError === 1) {
        logMessage = `${datasetName} import FAILED`;
      } else if (duplicateJobsRunning === 1) {
        logMessage = `${datasetName} import stopped - duplicate job running`;
      } else if (recordsFailedCounter > 0) {
        logMessage = `${datasetName} import completed with errors (${recordsFailedCounter})`;
      } else {
        logMessage = `${datasetName} import completed successful`;
      }

      // ... log to event table
      sql.query(`insert into gear_log.event (Event, User, DTG) values ('${logMessage}', '${requester}', now());`, (err, result) => {
        if (err) {
          logger(`${getLogHeader()}`, `failed to log event`, err, errorLogFileName);
        }
      });

      if (duplicateJobsRunning !== 1) {
        // ... log to dataset import log table
        updateImportLog(logMessage);
      }

      // ... log import summary and complete import request.
      logger(`${getLogHeader()}`, `... import summary logged`);
      logger(`${getLogHeader()}`, `********** ENDING ${importType} IMPORT PROCESS **********\n\n`);

      // ... return the import summary object
      return summary;

    } catch (error) {
      logger(`${getLogHeader()}`, `an unexpected error occurred during endImport()`, error, errorLogFileName);
      isFatalError = 1;
      return error;
    }

  }

  // -----------------------------------------------

  // -----------------------------------------------
  // import process
  try {


    // -----------------------------------------------
    // pre-import steps
    try {

      logger(`${getLogHeader()}`, `********** TECH_CATALOG [${importType}] IMPORT EXECUTED FOR DATASET [${datasetName}] IMPORT PROCESS **********\n`, null, importLogFileName);

      logger(`${getLogHeader()}`, `*** STARTING PRE-IMPORT STEPS ***`);

      // -----------------------------------------------
      // 1. validate parameters
      try {

        // ... run validation
        await validateRequest(data, getLogHeaderNoTime());

        if (requester === null || requester === '' || requester === undefined) {
          throw `requester is required`;
        }

      } catch (error) {
        // ... log failure, end import.
        logger(`${getLogHeader()}`, `failed validating request parameters`, error, errorLogFileName);
        return { message: `ERROR: Tech Catalog Import Request Parameters Contains Invalid Values:\n${error}`, fatalError: 1 };
      }

      // 1. log start to tech_catalog.dataset_import_log
      try {
        // log start to db
        await connPromisePool.query(`insert into tech_catalog.dataset_import_log (import_id, datasetName, import_status) values ('${importId}', '${datasetName}', '${datasetName} import in progress...'); `);
      } catch (er) {
        console.log(`\n****** ${datasetName} import is already in progress ******\n`); //, er);
        duplicateJobsRunning = 1;
        return { message: `${datasetName} import is already in progress`, fatalError: 0, duplicateJobsRunning: duplicateJobsRunning };
      }

      // -----------------------------------------------
      // 2. get the last id and/or the last synchronizedDate from the database and apply OVERRIDEs
      try {

        // check singleRecImportId exists (for single record imports ONLY)
        try {
          if (data.singlerecimportidoverride) {
            singleRecImportId = data.singlerecimportidoverride;

            // turn off stats gathering for single record imports
            gatherStats = false;

            // if string singleRecImportId contains a comma, throw error
            if (singleRecImportId.includes(',')) {
              throw `single record import id cannot contain a comma`;
            }

            logger(`${getLogHeader()}`, `... ***OVERRIDING*** to perform single import for id: ${singleRecImportId}`, null, importLogFileName);
          } else {
            singleRecImportId = null;
          }
        } catch (error) {
          singleRecImportId = null;
        }

        if (!singleRecImportId) {
          // handle OVERRIDE values

          // check lastIdOverride exists
          try {
            if (data.lastidoverride) {
              lastRecordId = lastRecordIdUsed = lastIdOverride = data.lastidoverride;

              // turn off stats gathering for imports using last id overrides
              gatherStats = false;

              logger(`${getLogHeader()}`, `... ***OVERRIDING*** last id = ${lastRecordId}`, null, importLogFileName);
            }
          } catch (error) {
            lastRecordId = lastRecordIdUsed = null;
          }

          // check lastSyncDateOverride exists
          try {
            if (data.lastsyncdateoverride) {
              lastSynchronizedDate = lastSyncDateOverride = new Date(stringToDate(String(data.lastsyncdateoverride).replace('T', ' ').replace('Z', '')));
              lastSynchronizedDate.setHours(0, 0, 0, 0);
              lastSyncDateOverride.setHours(0, 0, 0, 0);
              logger(`${getLogHeader()}`, `... ***OVERRIDING*** last sync date = ${formatDateTime(lastSynchronizedDate)}`, null, importLogFileName);
            }
          } catch (error) {
            lastSynchronizedDate = null;
          }

          // check maxSyncDateOverride exists
          try {
            if (data.maxsyncdateoverride) {
              maxSyncDateOverride = new Date(stringToDate(String(data.maxsyncdateoverride).replace('T', ' ').replace('Z', '')));

              // set time to end of day (23:59:59.999)
              maxSyncDateOverride.setHours(23, 59, 59, 999);

              logger(`${getLogHeader()}`, `... ***OVERRIDING*** max sync date = ${formatDateTime(maxSyncDateOverride)}`, null, importLogFileName);
            } else {
              maxSyncDateOverride = new Date();

              // set time to beginning of current day (06:00:00.000)
              maxSyncDateOverride.setHours(6, 0, 0, 0);
            }
          } catch (error) {
            maxSyncDateOverride = new Date();

            // set time to beginning of current day (06:00:00.000)
            maxSyncDateOverride.setHours(6, 0, 0, 0);
          }

          // check isToBeDeletedOnlyOverride exists
          try {
            if (data.istobedeletedonlyoverride === 'true') {
              isToBeDeletedOnly = data.istobedeletedonlyoverride;
              logger(`${getLogHeader()}`, `... ***OVERRIDING*** to import only records where isToBeDeletedOnly = ${isToBeDeletedOnly}`, null, importLogFileName);
            }
          } catch (error) {
            isToBeDeletedOnly = null;
          }

          // -------

          // get last id from db if not already set
          if (importType === 'insert' && !lastRecordId) {
            // ... get the last record id from the database
            lastRecordId = lastRecordIdUsed = await getLastRecordId(tableName, getLogHeaderNoTime());
          }

          // get last synchronizedDate
          if (!lastSynchronizedDate) {
            // ... get the last synchronizedDate from the database
            lastSynchronizedDate = await getLastSyncDate(tableName, getLogHeaderNoTime());
            lastSynchronizedDate.setHours(0, 0, 0, 0);
          }

          logger(`${getLogHeader()}`, `... last record id: ${lastRecordId}`, null, importLogFileName);
          logger(`${getLogHeader()}`, `... last synchronizedDate: ${lastSynchronizedDate}`, null, importLogFileName);
        }

      } catch (error) {
        // ... log failure, end import.
        logger(`${getLogHeader()}`, `failed getting the last id and synchronizedDate`, error, errorLogFileName);
        isFatalError = 1;
        return endImport();
      }

      // ... get the beginning table record count
      beginTableRecordCount = await getTableRecordCount(tableName, getLogHeaderNoTime());

    } catch (error) {
      // ... log error, end import.
      logger(`${getLogHeader()}`, `an unexpected error occurred during pre-import steps`, error, errorLogFileName);
      isFatalError = 1;
      return endImport();
    }
    // end pre-import --------------------------------


    // -----------------------------------------------
    // import steps
    try {

      logger(`${getLogHeader()}`, `*** STARTING IMPORT STEPS ***`);

      // -----------------------------------------------
      // page process
      do {

        // ... increment import counters
        pageCounter++;

        // ... setting page variables and functions
        const pageStartTime = new Date();
        let pageEndTime = null;
        let pageRecordCounter = 0;
        let pageRecordsInsertedCounter = 0;
        let pageRecordsToUpdateCounter = 0;
        let pageRecordsFailedCounter = 0;
        let consecutiveFailedRecordCounter = 0;
        let notificationCounter = 0;
        let insertUpdatesPerformed = 0;
        let filteredRecordsCounter = 0;
        let lastRecordIdInArray = null;
        let lastInsertedUpdatedRecNum = 0;

        let pageJson = null;
        let datasetArray = [];

        // ... returns the page summary at any point in the import process
        function getPageSummary() {
          pageEndTime = new Date();
          const summary = {
            importId: importId,
            page: pageCounter,
            startTime: formatDateTime(pageStartTime),
            endTime: formatDateTime(pageEndTime),
            duration: formatDuration(pageStartTime, pageEndTime),
            arraySize: datasetArray.length,
            pageRecordsProcessed: pageRecordCounter,
            pageRecordsInserted: pageRecordsInsertedCounter,
            pageRecordsToUpdate: pageRecordsToUpdateCounter,
            pageRecordsFailed: pageRecordsFailedCounter,
            consecutiveFailedRecords: consecutiveFailedRecordCounter,
            isLastPage: isLastPage,
            logDateTime: formatDateTime(new Date())
          };
          pageSummaryArray.push(summary);
          return summary;
        }


        // -----------------------------------------------
        // part 1: page request
        try {

          logger(`${getLogHeader()}`, `------ PAGE ${pageCounter} ------`);


          // -----------------------------------------------
          // 1. get the access token
          try {

            try {

              // ... get the access token from the flexera api
              accessToken = await getAccessToken(refreshToken, getLogHeaderNoTime());

            } catch (error) {

              logger(`${getLogHeader()}`, `WARNING: Page ${pageCounter} Access Token API request failed, waiting 30 seconds and will try again\n>>>>ERROR: ${error}`, null, importLogFileName);

              // wait 30 sec and try again
              await new Promise(resolve => setTimeout(resolve, 30000));
              accessToken = await getAccessToken(refreshToken, getLogHeaderNoTime());
            }

          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed getting the access token`, error, errorLogFileName);
            isFatalError = 1;
            return endImport();
          }


          // -----------------------------------------------
          // 2. build graphql query
          try {

            // ... build graphql query
            graphqlQuery = await buildAPIQuery(datasetName, takeAmt, lastRecordId, 'all', isToBeDeletedOnly, getLogHeaderNoTime(), (singleRecImportId === null ? null : singleRecImportId));

            // ... log graphql query
            writeToLogFile(`page ${pageCounter} graphqlQuery: ` + graphqlQuery + `,\n`, importLogFileName);

          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed building the graphql query`, error, errorLogFileName);
            isFatalError = 1;
            return endImport();
          }


          // -----------------------------------------------
          // 3. execute page request
          try {

            try {

              // ... sending api request for page data to flexera
              pageJson = await sendAPIQuery(graphqlQuery, accessToken, getLogHeaderNoTime());

            } catch (error) {

              logger(`${getLogHeader()}`, `WARNING: Page ${pageCounter} Data API request failed, waiting 30 seconds and will try again\n>>>>ERROR: ${error}`, null, importLogFileName);

              // wait 30 sec and try again
              await new Promise(resolve => setTimeout(resolve, 30000));
              pageJson = await sendAPIQuery(graphqlQuery, accessToken, getLogHeaderNoTime());

            }

            pageRequestCounter++;
          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed executing page request`, error, errorLogFileName);
            isFatalError = 1;
            return endImport();
          }


          // -----------------------------------------------
          // 4. verifying page response
          try {

            logger(`${getLogHeader()}`, `... verifying page response`);

            // ... get the dataset array from the page json
            datasetArray = pageJson.data[datasetName];

            // ... check if dataset array is empty
            if (datasetArray.length === 0) {

              // ... if array is empty,
              // ... logging no records returned
              logger(`${getLogHeader()}`, `... no records returned from flexera api for this page`);

              // ... set isLastPage to true to end the import process
              isLastPage = true;

              // ... decrement page counter since page contains no records
              pageCounter--;

            } else {

              // ... logging number of records on page
              logger(`${getLogHeader()}`, `... ${datasetArray.length} records received`);

            }

          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed verifying api response`, error, errorLogFileName);
            isFatalError = 1;

            return endImport();
          }

        } catch (error) {
          // ... log error, end import.
          logger(`${getLogHeader()}`, `unexpected error occurred during page request`, error, errorLogFileName);
          isFatalError = 1;
          return endImport();
        }


        // -----------------------------------------------
        // (parts: 2 and 3)
        // if page request returned data,
        if (!isLastPage) {


          // -----------------------------------------------
          // part 2: import page record
          try {

            logger(`${getLogHeader()}`, `--- STARTING PAGE ${pageCounter} RECORD IMPORT ---`);

            // remove all records from the array that have a synchronizedDate value earlier than the lastSynchronizedDate
            if (importType === 'update' && lastSyncDateOverride !== null && datasetArray.length > 0) {

              // turn off gatherStats
              gatherStats = false;

              // get the id value of the last record in the array
              lastRecordIdInArray = datasetArray[datasetArray.length - 1].id;

              const previousRecordCount = datasetArray.length;

              datasetArray = datasetArray.filter(datasetArray => new Date(stringToDate(datasetArray.synchronizedDate)) >= lastSynchronizedDate);

              const filteredRecordCount = datasetArray.length;
              filteredRecordsCounter = previousRecordCount - filteredRecordCount;

              logger(`${getLogHeader()}`, `... *** ${previousRecordCount - filteredRecordCount} records removed *** from page array because synchronizedDate < lastSynchronizedDate`, null, importLogFileName);

              if (maxSyncDateOverride !== null && datasetArray.length > 0) {
                const previousRecordCount = datasetArray.length;

                datasetArray = datasetArray.filter(datasetArray => new Date(stringToDate(datasetArray.synchronizedDate)) <= maxSyncDateOverride);

                const filteredRecordCount = datasetArray.length;
                filteredRecordsCounter = filteredRecordsCounter + (previousRecordCount - filteredRecordCount);

                logger(`${getLogHeader()}`, `... *** ${previousRecordCount - filteredRecordCount} records removed *** from page array because synchronizedDate > maxSyncDateOverride`, null, importLogFileName);
              }

              if (filteredRecordsCounter > 0) {
                logger(`${getLogHeader()}`, `... *** ${datasetArray.length} records to import after filtering ***`, null, importLogFileName);
              }

            }



            // -----------------------------------------------
            // records process
            for (let datasetObject of datasetArray) {

              // ... increment record loop iteration counters
              recordCounter++;
              pageRecordCounter++;
              notificationCounter++;
              recordCountDisplay++;

              // ... set the current record as lastRecordId
              lastRecordId = datasetObject.id;

              let recordsToInsert = [];           // stores the array of record objects to insert
              let insertValuesMap = new Map();    // stores the map of record values to columns for insert statement

              //let recordsToUpdate = [];           // stores the array of record objects to update
              //let updateValuesMap = new Map();    // stores the map of record values to columns for update statement

              // ... (for SoftwareLifecycle ONLY) stores SoftwareLifecycle.softwareSupportStage Object data 
              //let recordsToInsertSftwSupportStage = [];
              //let insertValuesMapSftwSupportStage = new Map();
              let insertValuesMapSftwSupportStage = '';
              //let insertValuesMapSftwSupportStageCount = 0;

              //let recordGraphqlQuery = null;
              //let updateDatasetArray = [];
              //let pageRecordJson = null;
              let insertUpdateRequired = false;

              if (importType === 'insert') {

                // ... when importType = insert, all records will be inserted or updated
                insertUpdateRequired = true;

              } else if (importType === 'update') {

                // ... when importType = update, only records that have a later synchronizedDate will be updated
                // -----------------------------------------------
                // 1. compare synchronizedDate values
                try {

                  // ... get the record's synchronizedDate
                  let recordSynchronizedDate = new Date(stringToDate(datasetObject.synchronizedDate));

                  // if gathering stats in turned on (only for imports with no override values)
                  if (gatherStats) {
                    // gathering counts of records by sync date to insert into tech_catalog.dataset_syncdate_log
                    let recordSynchronizedDateYYYYMMDD = recordSynchronizedDate.getFullYear() + '-' + String(recordSynchronizedDate.getMonth() + 1).padStart(2, '0') + '-' + String(recordSynchronizedDate.getDate()).padStart(2, '0');
                    // ... check if recordSynchronizedDateYYYYMMDD exists in syncYYYYMMDDArray
                    let recordSynchronizedDateYYYYMMDDObject = syncYYYYMMDDArray.find(syncYYYYMMDDArray => String(syncYYYYMMDDArray.syncDate) === recordSynchronizedDateYYYYMMDD);

                    if (recordSynchronizedDateYYYYMMDDObject) {
                      // ... increment the record count
                      recordSynchronizedDateYYYYMMDDObject.recordCount++;
                    } else {
                      // ... add the record to the array
                      syncYYYYMMDDArray.push({ import_id: importId, datasetName: datasetName, syncDate: recordSynchronizedDateYYYYMMDD, recordCount: 1 });
                    }
                  }

                  // ... determine if recordSynchronizedDate is earlier than the earliestSyncDate
                  if (earliestSyncDate === null || recordSynchronizedDate < earliestSyncDate) {
                    earliestSyncDate = recordSynchronizedDate;
                  }

                  // ... determine if recordSynchronizedDate is later than the latestSyncDate
                  if (latestSyncDate === null || recordSynchronizedDate > latestSyncDate) {
                    latestSyncDate = recordSynchronizedDate;
                  }

                  // ... compare the record's synchronizedDate to the lastSynchronizedDate from the db
                  if (recordSynchronizedDate >= lastSynchronizedDate) {

                    // if maxSyncDateOverride has a value and the recordSynchronizedDate is later than the maxSyncDateOverride value
                    if (maxSyncDateOverride !== null && recordSynchronizedDate >= maxSyncDateOverride) {

                      // ... this record needs to be updated
                      insertUpdateRequired = false;

                      // when updating and no maxsyncdateoverride was provided in the request,
                      // decrement the record counter since this record will included in the next import.
                      if (!data.maxsyncdateoverride) {
                        recordCounter--;
                      }

                      //logger(`${getLogHeader()}`, `...... ignoring update id:"${lastRecordId}", synchronizedDate > maxSyncDate`);

                    } else {

                      //logger(`${getLogHeader()}`, `...... updating id:"${lastRecordId}"`);

                      // ... logging record to sync list log
                      try {

                        // ... create record object
                        let insertTxt =
                        {
                          id: lastRecordId
                          // synchronizedDate : datasetObject.synchronizedDate
                        };

                        // ... write record to sync list log
                        fs.appendFileSync(toSyncListLogFileName, JSON.stringify(insertTxt) + ',\n');

                      } catch (error) {
                        logger(`${getLogHeader()}`, `failed writing record to sync list log`, error, errorLogFileName);
                      }

                      // ... increment the counters when a record to update is found
                      recordToUpdateCounter++;

                      // ... this record needs to be updated
                      insertUpdateRequired = true;

                    }

                    // -----------------------------------------------
                    // 1.5 check if the record should be deleted
                    try {

                      // ... check isToBeDeleted value
                      if (datasetObject.isToBeDeleted === true) {
                        let deletedNotRemoved = false;

                        // check if toBeDeletedOn is less than the beginning of the current day
                        if (datasetObject.toBeDeletedOn !== null && datasetObject.toBeDeletedOn !== "") {
                          let toBeDeletedOnDate = new Date(stringToDate(datasetObject.toBeDeletedOn));
                          toBeDeletedOnDate.setHours(0, 0, 0, 0);

                          if (toBeDeletedOnDate < new Date()) {
                            // ... this record needs to be deleted
                            deletedRecsNotRemovedCounter++;
                            deletedNotRemoved = true;

                            logger(`${getLogHeader()}`, `...... id:"${lastRecordId}" already deleted... should have been removed on "${datasetObject.toBeDeletedOn}"`);
                          } else {
                            logger(`${getLogHeader()}`, `...... id:"${lastRecordId}" will be deleted on "${datasetObject.toBeDeletedOn}"`);
                          }
                        } else {
                          logger(`${getLogHeader()}`, `...... id:"${lastRecordId}" will be deleted in the near future`);
                        }

                        let deleteTxt =
                        {
                          id: lastRecordId,
                          synchronizedDate: datasetObject.synchronizedDate,
                          isToBeDeleted: datasetObject.isToBeDeleted,
                          toBeDeletedOn: datasetObject.toBeDeletedOn,
                          deleteReason: datasetObject.deleteReason,
                          deletedNotRemoved: deletedNotRemoved
                        };

                        // ... write record to sync list log
                        fs.appendFileSync(deleteListLogFileName, JSON.stringify(deleteTxt) + ',\n');

                        recordsToBeDeletedArray.push(deleteTxt);

                        // for SoftwareRelease, updating obj_technology table ToBeDelete columns
                        if (datasetName === 'SoftwareRelease') {
                          try {
                            let toBeDeletedOnValue = null;

                            if (datasetObject.toBeDeletedOn === null || datasetObject.toBeDeletedOn === "") {
                              toBeDeletedOnValue = `null`;
                            } else {
                              toBeDeletedOnValue = `"${stringToDate(datasetObject.toBeDeletedOn)}"`;
                            }

                            const updateObjTechStatement =
                              `update gear_schema.obj_technology 
                                  set softwareReleaseIsToBeDeleted = ${booleanToTinyint(datasetObject.isToBeDeleted)},
                                      softwareReleaseToBeDeletedOn = ${toBeDeletedOnValue}
                                where softwareRelease = "${lastRecordId}"; `;

                            if (isDryRun === 'true') {
                              // ... skip inserting 
                              logger(`${getLogHeader()}`, `... skipping executing ${importType} statement obj_technology table ToBeDelete columns (dry run)`);
                            } else {
                              sql.query(updateObjTechStatement, (error, data) => {
                                if (error) {
                                  logger(`${getLogHeader()}`, `...... failed updating obj_technology table ToBeDelete columns for id:"${lastRecordId}"`, error, errorLogFileName);
                                } else {
                                  logger(`${getLogHeader()}`, `...... updated obj_technology table ToBeDelete columns for id:"${lastRecordId}"`);
                                }
                              });
                            }
                          } catch (error) {
                            logger(`${getLogHeader()}`, `...... failed updating obj_technology table ToBeDelete columns for id:"${lastRecordId}"`, error, errorLogFileName);
                          }
                        }
                      }

                    } catch (error) {
                      // ... raise error
                      throw error;
                    }

                  } else {

                    // ... this record does NOT need to be updated
                    insertUpdateRequired = false;

                  }

                } catch (error) {
                  // ... raise error
                  throw error;
                }

              } else {
                // ... raise error
                throw `importType value is invalid`;
              }


              // -----------------------------------------------
              // insert/update statement
              if (insertUpdateRequired) {

                // -----------------------------------------------
                // 1. build insert/update statement
                try {

                  // ... add the record object to array 
                  recordsToInsert.push(datasetObject);

                  // ... add the column values to map
                  switch (datasetName) {
                    case 'Manufacturer':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        datasetObject.acquiredDate,
                        datasetObject.city,
                        datasetObject.country,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        datasetObject.description,
                        datasetObject.email,
                        datasetObject.employees,
                        stringToDate(datasetObject.employeesDate),
                        datasetObject.fax,
                        stringToDate(datasetObject.fiscalEndDate),
                        datasetObject.isPubliclyTraded,
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.knownAs,
                        datasetObject.legal,
                        datasetObject.name,
                        datasetObject.ownerId,
                        datasetObject.phone,
                        stringToDate(datasetObject.profitsDate),
                        datasetObject.profitsPerYear,
                        datasetObject.replacementId,
                        datasetObject.revenue,
                        stringToDate(datasetObject.revenueDate),
                        datasetObject.state,
                        datasetObject.street,
                        datasetObject.symbol,
                        stringToDate(datasetObject.synchronizedDate),
                        datasetObject.tier,
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.website,
                        datasetObject.zip,
                        ]);
                      break;
                    case 'Platform':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.name,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        ]);
                      break;
                    case 'SoftwareEdition':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isDesupported),
                        booleanToTinyint(datasetObject.isDiscontinued),
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.name,
                        datasetObject.order,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.softwareProduct.id,
                        ]);
                      break;
                    case 'SoftwareFamily':
                      try {
                        insertValuesMap = recordsToInsert.map(recordsToInsert =>
                          [datasetObject.id,
                          stringToDate(datasetObject.createdDate),
                          datasetObject.deleteReason,
                          booleanToTinyint(datasetObject.isDesupported),
                          booleanToTinyint(datasetObject.isDiscontinued),
                          booleanToTinyint(datasetObject.isToBeDeleted),
                          datasetObject.name,
                          datasetObject.replacementId,
                          stringToDate(datasetObject.synchronizedDate),
                          stringToDate(datasetObject.toBeDeletedOn),
                          stringToDate(datasetObject.updatedDate),
                          datasetObject.manufacturer.id,
                          datasetObject.taxonomy.id,
                          ]);
                      } catch (error) {
                        try {
                          insertValuesMap = recordsToInsert.map(recordsToInsert =>
                            [datasetObject.id,
                            stringToDate(datasetObject.createdDate),
                            datasetObject.deleteReason,
                            booleanToTinyint(datasetObject.isDesupported),
                            booleanToTinyint(datasetObject.isDiscontinued),
                            booleanToTinyint(datasetObject.isToBeDeleted),
                            datasetObject.name,
                            datasetObject.replacementId,
                            stringToDate(datasetObject.synchronizedDate),
                            stringToDate(datasetObject.toBeDeletedOn),
                            stringToDate(datasetObject.updatedDate),
                            datasetObject.manufacturer.id,
                            datasetObject.taxonomy,
                            ]);
                        } catch (error) {
                          insertValuesMap = recordsToInsert.map(recordsToInsert =>
                            [datasetObject.id,
                            stringToDate(datasetObject.createdDate),
                            datasetObject.deleteReason,
                            booleanToTinyint(datasetObject.isDesupported),
                            booleanToTinyint(datasetObject.isDiscontinued),
                            booleanToTinyint(datasetObject.isToBeDeleted),
                            datasetObject.name,
                            datasetObject.replacementId,
                            stringToDate(datasetObject.synchronizedDate),
                            stringToDate(datasetObject.toBeDeletedOn),
                            stringToDate(datasetObject.updatedDate),
                            datasetObject.manufacturer,
                            datasetObject.taxonomy,
                            ]);
                        }
                      }
                      break;
                    case 'SoftwareLifecycle':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        datasetObject.endOfLife,
                        datasetObject.endOfLifeCalculatedCase,
                        stringToDate(datasetObject.endOfLifeDate),
                        stringToDate(datasetObject.endOfLifeDateCalculated),
                        datasetObject.endOfLifeException,
                        datasetObject.endOfLifeSupportLevel,
                        datasetObject.generalAvailability,
                        stringToDate(datasetObject.generalAvailabilityDate),
                        stringToDate(datasetObject.generalAvailabilityDateCalculated),
                        datasetObject.generalAvailabilityException,
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.obsolete,
                        datasetObject.obsoleteCalculatedCase,
                        stringToDate(datasetObject.obsoleteDate),
                        stringToDate(datasetObject.obsoleteDateCalculated),
                        datasetObject.obsoleteException,
                        datasetObject.obsoleteSupportLevel,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.softwareRelease.id,
                        ]);

                      // check if softwareSupportStage has data
                      if (datasetObject.softwareSupportStage !== null && datasetObject.softwareSupportStage !== undefined) {

                        let softwareSupportStageArray = datasetObject["softwareSupportStage"];

                        function handleNulls(value) {
                          if (value === null || value === undefined) {
                            return 'null';
                          } else {
                            return `'${value}'`;
                          }
                        }

                        for (let supportStageObject of softwareSupportStageArray) {
                          // create insert statement
                          let insertStatementSSS = insertStatementSftwSupportStage +
                            `'${datasetObject.id}', ` +
                            `'${formatDateTime(String(datasetObject.synchronizedDate).replace('T', ' ').replace('Z', ''))}', ` +
                            `${supportStageObject.definition === null || supportStageObject.definition === '' ? 'null' : "'" + String(supportStageObject.definition).replace(/'/g, "''").replace(/\n/g, "").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + "'"}, ` +
                            `${supportStageObject.endDate === null || supportStageObject.endDate === '' ? 'null' : "'" + formatDateTime(String(new Date(supportStageObject.endDate))) + "'"}, ` +
                            `${supportStageObject.manufacturerId === null || supportStageObject.manufacturerId === '' ? 'null' : "'" + supportStageObject.manufacturerId + "'"}, ` +
                            `'${supportStageObject.name}', ` +
                            `${supportStageObject.order === null || supportStageObject.order === '' ? 'null' : "'" + supportStageObject.order + "'"}, ` +
                            `${supportStageObject.policy === null || supportStageObject.policy === '' ? 'null' : "'" + supportStageObject.policy + "'"}, ` +
                            `${supportStageObject.publishedEndDate === null || supportStageObject.publishedEndDate === '' ? 'null' : "'" + supportStageObject.publishedEndDate + "'"})`;

                          // add the ON DUPLICATE KEY UPDATE clause to update the record if it already exists
                          insertStatementSSS = insertStatementSSS + ' ON DUPLICATE KEY UPDATE ' +
                            // PK 'id = VALUES(id), ' +
                            'synchronizedDate = VALUES(synchronizedDate), ' +
                            'definition = VALUES(definition), ' +
                            'endDate = VALUES(endDate), ' +
                            'manufacturerId = VALUES(manufacturerId), ' +
                            // PK 'name = VALUES(name), ' +
                            // PK 'order = VALUES(order), ' +
                            'policy = VALUES(policy), ' +
                            'publishedEndDate = VALUES(publishedEndDate)';

                          // add semi-colon to end of insert statement
                          insertStatementSSS = insertStatementSSS + '; ';

                          //console.log('INSERT STATEMENT: ' + insertStatementSSS + '\n'); // testing

                          // add insert statement to insertValuesMapSftwSupportStage
                          insertValuesMapSftwSupportStage = insertValuesMapSftwSupportStage + insertStatementSSS;
                        }

                        // increment softwareSupportStageCounter
                        softwareSupportStageCounter = softwareSupportStageCounter + insertValuesMapSftwSupportStage.length;
                      }
                      break;
                    case 'SoftwareMarketVersion':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isDesupported),
                        booleanToTinyint(datasetObject.isDiscontinued),
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.name,
                        datasetObject.order,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.softwareProduct.id,
                        ]);
                      break;
                    case 'SoftwareProduct':
                      if (datasetObject.softwareFamily === null) {
                        datasetObject.softwareFamily = null;
                      } else {
                        datasetObject.softwareFamily = datasetObject.softwareFamily.id;
                      }

                      if (datasetObject.taxonomy === null) {
                        datasetObject.taxonomy = null;
                      } else {
                        datasetObject.taxonomy = datasetObject.taxonomy.id;
                      }

                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        datasetObject.alias,
                        datasetObject.application,
                        datasetObject.cloud,
                        datasetObject.component,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isDesupported),
                        booleanToTinyint(datasetObject.isDiscontinued),
                        booleanToTinyint(datasetObject.isFamilyInFullName),
                        booleanToTinyint(datasetObject.isSuite),
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.name,
                        datasetObject.productLicensable,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.manufacturer.id,
                        datasetObject.softwareFamily,
                        datasetObject.taxonomy,
                        ]);
                      break;
                    case 'SoftwareProductLink':
                      try {
                        insertValuesMap = recordsToInsert.map(recordsToInsert =>
                          [datasetObject.id,
                          datasetObject.cloud,
                          stringToDate(datasetObject.createdDate),
                          datasetObject.deleteReason,
                          datasetObject.formerSoftwareProductId,
                          booleanToTinyint(datasetObject.isToBeDeleted),
                          datasetObject.laterSoftwareProductId,
                          datasetObject.latestSoftwareProductId,
                          datasetObject.oldestSoftwareProductId,
                          datasetObject.replacementId,
                          datasetObject.softwareCloudId,
                          datasetObject.softwareOnPremId,
                          stringToDate(datasetObject.synchronizedDate),
                          stringToDate(datasetObject.toBeDeletedOn),
                          stringToDate(datasetObject.updatedDate),
                          datasetObject.softwareProduct.id,
                          ]);
                      } catch (error) {
                        insertValuesMap = recordsToInsert.map(recordsToInsert =>
                          [datasetObject.id,
                          datasetObject.cloud,
                          stringToDate(datasetObject.createdDate),
                          datasetObject.deleteReason,
                          datasetObject.formerSoftwareProductId,
                          booleanToTinyint(datasetObject.isToBeDeleted),
                          datasetObject.laterSoftwareProductId,
                          datasetObject.latestSoftwareProductId,
                          datasetObject.oldestSoftwareProductId,
                          datasetObject.replacementId,
                          datasetObject.softwareCloudId,
                          datasetObject.softwareOnPremId,
                          stringToDate(datasetObject.synchronizedDate),
                          stringToDate(datasetObject.toBeDeletedOn),
                          stringToDate(datasetObject.updatedDate),
                          datasetObject.softwareProduct,
                          ]);
                      }
                      break;
                    case 'SoftwareRelease':
                      // check if scaOpenSource has data
                      if (datasetObject.scaOpenSource === null) {
                        datasetObject.scaOpenSource = null;
                      } else {
                        datasetObject.scaOpenSource = datasetObject.scaOpenSource.id;
                      }

                      // check if softwareEdition has data
                      if (datasetObject.softwareEdition === null) {
                        datasetObject.softwareEdition = null;
                      } else {
                        datasetObject.softwareEdition = datasetObject.softwareEdition.id;
                      }

                      // check if softwareVersion has data
                      if (datasetObject.softwareVersion === null) {
                        datasetObject.softwareVersion = null;
                      } else {
                        datasetObject.softwareVersion = datasetObject.softwareVersion.id;
                      }

                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        datasetObject.application,
                        datasetObject.cloud,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isDesupported),
                        booleanToTinyint(datasetObject.isDiscontinued),
                        booleanToTinyint(datasetObject.isLicensable),
                        booleanToTinyint(datasetObject.isMajor),
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.majorSoftwareReleaseId,
                        datasetObject.name,
                        datasetObject.patchLevel,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.scaOpenSource,
                        datasetObject.softwareEdition,
                        datasetObject.softwareProduct.id,
                        datasetObject.softwareVersion,
                        ]);

                      break;
                    case 'SoftwareReleaseLink':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        datasetObject.formerSoftwareReleaseId,
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.laterSoftwareReleaseId,
                        datasetObject.latestSoftwareReleaseId,
                        datasetObject.oldestSoftwareReleaseId,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.softwareRelease.id,
                        ]);
                      break;
                    case 'SoftwareReleasePlatform':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        booleanToTinyint(datasetObject.isDesupported),
                        booleanToTinyint(datasetObject.isDiscontinued),
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.platformLabel,
                        datasetObject.platformType,
                        datasetObject.replacementId,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        datasetObject.platform.id,
                        datasetObject.softwareRelease.id,
                        ]);
                      break;
                    case 'SoftwareVersion':
                      try {
                        insertValuesMap = recordsToInsert.map(recordsToInsert =>
                          [datasetObject.id,
                          stringToDate(datasetObject.createdDate),
                          datasetObject.deleteReason,
                          booleanToTinyint(datasetObject.isDesupported),
                          booleanToTinyint(datasetObject.isDiscontinued),
                          booleanToTinyint(datasetObject.isMajor),
                          booleanToTinyint(datasetObject.isToBeDeleted),
                          datasetObject.majorSoftwareVersionId,
                          datasetObject.name,
                          datasetObject.order,
                          datasetObject.patchLevel,
                          datasetObject.replacementId,
                          stringToDate(datasetObject.synchronizedDate),
                          stringToDate(datasetObject.toBeDeletedOn),
                          stringToDate(datasetObject.updatedDate),
                          datasetObject.versionStage,
                          datasetObject.softwareMarketVersion.id,
                          datasetObject.softwareProduct.id,
                          ]);
                      } catch (error) {
                        insertValuesMap = recordsToInsert.map(recordsToInsert =>
                          [datasetObject.id,
                          stringToDate(datasetObject.createdDate),
                          datasetObject.deleteReason,
                          booleanToTinyint(datasetObject.isDesupported),
                          booleanToTinyint(datasetObject.isDiscontinued),
                          booleanToTinyint(datasetObject.isMajor),
                          booleanToTinyint(datasetObject.isToBeDeleted),
                          datasetObject.majorSoftwareVersionId,
                          datasetObject.name,
                          datasetObject.order,
                          datasetObject.patchLevel,
                          datasetObject.replacementId,
                          stringToDate(datasetObject.synchronizedDate),
                          stringToDate(datasetObject.toBeDeletedOn),
                          stringToDate(datasetObject.updatedDate),
                          datasetObject.versionStage,
                          datasetObject.softwareMarketVersion,
                          datasetObject.softwareProduct.id,
                          ]);
                      }
                      break;
                    case 'Taxonomy':
                      insertValuesMap = recordsToInsert.map(recordsToInsert =>
                        [datasetObject.id,
                        datasetObject.category,
                        datasetObject.categoryGroup,
                        datasetObject.categoryId,
                        stringToDate(datasetObject.createdDate),
                        datasetObject.deleteReason,
                        datasetObject.description,
                        booleanToTinyint(datasetObject.isToBeDeleted),
                        datasetObject.replacementId,
                        datasetObject.softwareOrHardware,
                        datasetObject.subcategory,
                        stringToDate(datasetObject.synchronizedDate),
                        stringToDate(datasetObject.toBeDeletedOn),
                        stringToDate(datasetObject.updatedDate),
                        ]);
                      break;
                  }

                  // ... check if this is the first record on the first page for an import request
                  if (!isStatementBuilt) {

                    // ... get the list of columns for the insert statement
                    insertStatement = insertStatement + getInsertColumnsList(datasetName);

                    // ... if insert statements column list end with a comma
                    if (insertStatement.endsWith(',')) {

                      // ... remove last comma from the insert statements column list
                      insertStatement = insertStatement.substring(0, insertStatement.length - 1);

                    }

                    // ... assemble the insert statement to be used for this import request
                    insertStatement = insertStatement + ') values ?';

                    if (importType === 'update') {

                      // add ON DUPLICATE KEY UPDATE
                      insertStatement = insertStatement + ' ON DUPLICATE KEY UPDATE ';

                      // add each column name to the ON DUPLICATE KEY UPDATE clause
                      insertStatement = insertStatement + await getUpdateColumnsList(datasetName);

                    }

                    isStatementBuilt = true;

                    logger(`${getLogHeader()}`, `... completed building ${importType} statement (on first page only)`); //: \n` + insertStatement);

                  }

                } catch (error) {
                  // ... raise error
                  throw error;
                }


                // ---------------------------------------------
                // 2. execute insert/update statement
                try {

                  //logger(`${getLogHeader()}`, `executing ${importType} statement`);

                  if (isDryRun === 'true') {

                    // ... skip inserting 
                    logger(`${getLogHeader()}`, `... skipping executing ${importType} statement (dry run)`);

                  } else {

                    // check if recordsInsertedCounter is divisible by 20
                    //if (importType === 'insert' && recordsInsertedCounter % 20 === 0) {

                    insertUpdatesPerformed++;

                    // this IF was implemented to prevent the database from being overloaded with inserts/updates
                    if (lastInsertedUpdatedRecNum === pageRecordCounter) {
                      // wait 1/1000 of the second
                      await new Promise(resolve => setTimeout(resolve, 1));
                    }

                    lastInsertedUpdatedRecNum = pageRecordCounter + 1;

                    // ... execute insert/update statement
                    sql.query(insertStatement, [insertValuesMap], (error, data) => {

                      // ... get the id value from the insertValuesMap
                      let idValue = insertValuesMap[0][0];

                      if (error) {
                        // when insert/update FAILS

                        // ... increment counters when fails
                        recordsFailedCounter++;
                        pageRecordsFailedCounter++;

                        // ... add id to recordsFailedList
                        recordsFailedList.push(idValue);

                        // ... log failure
                        logger(`${getLogHeader()}`, `ERROR: database returned error when executing the insert/update ${insertValuesMap.length} ${datasetName} records for id: ${idValue}`, error, errorLogFileName);

                        let errorLogInsert = `insert into tech_catalog.dataset_record_error_log (import_id, datasetName, id, import_error) values ('${importId}', '${datasetName}', '${idValue}', '${error}'); `;

                        // ... execute insert statement
                        sql.query(errorLogInsert, (error, data) => {
                          if (error) {
                            logger(`${getLogHeader()}`, `ERROR: failed inserting into dataset_record_error_log table for id: ${idValue}`, error, errorLogFileName);
                          }
                        });

                      } else {
                        // when insert/update SUCCEEDS

                        // write to syncedListLogFileName file
                        try {
                          // ... create record object
                          let insertTxt = { id: idValue };

                          // ... write record to sync list log
                          fs.appendFileSync(syncedListLogFileName, JSON.stringify(insertTxt) + ',\n');

                        } catch (error) {
                          logger(`${getLogHeader()}`, `failed writing record to sync list log`, error, errorLogFileName);
                        }

                        // ... verify in response that correct number of records inserted
                        if (data.affectedRows == 1) {
                          affectRowsCounter1++;
                        } else if (data.affectedRows == 2) {
                          affectRowsCounter2++;
                        } else if (data.affectedRows == 3) {
                          affectRowsCounter3++;
                        } else {

                          // ... add id to recordsFailedList
                          recordsFailedList.push(idValue);

                          // ... log bad affectedRows response received
                          logger(`${getLogHeader()}`, `ERROR: record was not inserted/updated id: ${idValue}(affectedRows: ${data.affectedRows})`, error, errorLogFileName);

                          let errorLogInsert = `insert into tech_catalog.dataset_record_error_log (import_id, datasetName, id, import_error) values ('${importId}', '${datasetName}', '${idValue}', '${error}'); `;

                          // ... execute insert statement
                          sql.query(errorLogInsert, (error, data) => {
                            if (error) {
                              logger(`${getLogHeader()}`, `ERROR: failed inserting into dataset_record_error_log table for id: ${idValue}`, error, errorLogFileName);
                            }
                          });
                        }

                        if (data.affectedRows == 1 || data.affectedRows == 2 || data.affectedRows == 3) {
                          // ... increment counters when insert is successful
                          recordsInsertedCounter++;
                          pageRecordsInsertedCounter++;

                          // ***SoftwareLifecycle ONLY***
                          // handling SoftwareLifecycle.SoftwareSupportStage[] data
                          if (datasetName === 'SoftwareLifecycle' && insertValuesMapSftwSupportStage.length > 0) {

                            // ... execute insert statement
                            sql.query(insertValuesMapSftwSupportStage, (error, data) => {

                              if (error) {
                                // when insert/update FAILS
                                softwareSupportStageErrorCounter = softwareSupportStageErrorCounter + (insertValuesMapSftwSupportStage.match(/tp_SoftwareSupportStage/g) || []).length;
                                // ... add id to recordsFailedList
                                recordsFailedList.push(idValue);
                                // ... log failure
                                logger(`${getLogHeader()}`, `ERROR: failed executing the insert ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records for id: ${idValue}`, error, errorLogFileName);
                                // ... assemble the error log insert statement
                                let errorLogInsert = `insert into tech_catalog.dataset_record_error_log (import_id, datasetName, id, import_error) values ('${importId}', '${datasetName}', '${idValue}', '${error}'); `;

                                // ... execute insert statement
                                sql.query(errorLogInsert, (error, data) => {
                                  if (error) {
                                    logger(`${getLogHeader()}`, `ERROR: failed inserting into dataset_record_error_log table for id: ${idValue}`, error, errorLogFileName);
                                  }
                                });

                              } else {
                                // when insert/update SUCCEEDS
                                softwareSupportStageInsertedCounter = softwareSupportStageInsertedCounter + (insertValuesMapSftwSupportStage.match(/tp_SoftwareSupportStage/g) || []).length;
                              }
                            });
                          } // end if SoftwareLifecycle 
                        }
                      }
                    });
                  } // end if
                } catch (error) {
                  // ... increment counters when fails
                  recordsFailedCounter++;
                  pageRecordsFailedCounter++;
                  consecutiveFailedRecordCounter++;
                  // ... log failure and continue to next record
                  logger(`${getLogHeader()}`, `failed ${importType} record`, error, errorLogFileName);
                  // ... create the error log insert statement
                  let errorLogInsert = `insert into tech_catalog.dataset_record_error_log (import_id, datasetName, id, import_error) values ('${importId}', '${datasetName}', '${lastRecordId}', '${error}'); `;
                  // ... execute insert statement
                  sql.query(errorLogInsert, (error, data) => {
                    if (error) {
                      logger(`${getLogHeader()}`, `ERROR: failed inserting into dataset_record_error_log table for id:${lastRecordId}`, error, errorLogFileName);
                    }
                  });
                }
              } // END IF (insertUpdateRequired)

            } // end of records loop
            // -----------------------------------------------

            recordCountDisplay = 0;

            logger(`${getLogHeader()}`, `... completed page ${pageCounter} record import`);

          } catch (error) {
            // ... log error, end import.
            logger(`${getLogHeader()}`, `an unexpected error occurred while processing the page records`, error, errorLogFileName);
            isFatalError = 1;
            return endImport();
          }


          // -----------------------------------------------
          // part 3: summarize page imported
          try {

            if (!isLastPage) {

              logger(`${getLogHeader()}`, `... summarizing page ${pageCounter} data imported`);

              // ... get the page summary object
              const pageSummary = getPageSummary();

              // ... updates the dataset import log table with the page summary
              updateImportLog();

              // ... log page summary
              logger(`${getLogHeader()}`, `... page summary logged`);

            } // end of !isLastPage

          } catch (error) {
            // ... log failure
            logger(`${getLogHeader()}`, `an unexpected error occurred while calculating and logging page summary`, error, errorLogFileName);
            isFatalError = 1;
            return endImport();
          }

        } // end of !isLastPage
        // -----------------------------------------------

        // set the correct lastRecordId value if any records were filtered out
        if (filteredRecordsCounter > 0) {
          lastRecordId = lastRecordIdInArray;
        }


        // ... if the data returned is less than the takeAmt, then this is the last page
        if ((datasetArray.length + filteredRecordsCounter) != takeAmt) {
          isLastPage = true;
          logger(`${getLogHeader()}`, `... last page reached`);
        }

      } while (!isLastPage);  // end of page loop
      // -----------------------------------------------

    } catch (error) {
      // ... log error, end import.
      logger(`${getLogHeader()}`, `an unexpected error occurred during the import steps`, error, errorLogFileName);
      isFatalError = 1;
      return endImport();
    }
    // end import steps ------------------------------


    // -----------------------------------------------
    // post-import steps
    try {

      logger(`${getLogHeader()}`, `*** STARTING POST-IMPORT STEPS ***`);


      // -----------------------------------------------
      // 1. calc, log summary, and complete import request

      return endImport();

    } catch (error) {
      // ... log error, end import.
      logger(`${getLogHeader()}`, `an unexpected error occurred during the post-import steps`, error, errorLogFileName);
      isFatalError = 1;
      return endImport();
    }
    // end post-import -------------------------------


  } catch (error) {
    // ... log error, end import.
    logger(`${getLogHeader()}`, `an unexpected error occurred during the import process`, error, errorLogFileName);
    isFatalError = 1;
    return endImport();
  }
  // end import process -----------------------------

}