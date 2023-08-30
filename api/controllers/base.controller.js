const sql = require("../db.js").connection,
  // sql_cowboy  = require("../db.js").connection_cowboy,
  sql_promise = require("../db.js").connection_promise,
  path = require("path"),
  fs = require("fs"),
  readline = require("readline"),
  { google } = require("googleapis")
  fastcsv = require("fast-csv");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

exports.getApiToken = async (req, res) => {
  console.log('req.headers: ', req.headers); //debugging
  console.log(`requester: ${req.headers.requester}, apitoken: ${req.headers.apitoken}`); //debugging

  //let [rows, fields] = await sql_promise.query(`CALL acl.verifyJwt ('${req.headers.requester}', '${req.headers.apitoken}');`);

  let [rows, fields] = await sql_promise.query(`select count(*) as sessions_cnt from acl.logins where email = '${req.headers.requester}' and jwt = '${req.headers.apitoken}';`);

  return rows[0].sessions_cnt;

  //const response = await sql_promise.query(`CALL acl.verifyJwt ('${req.headers.requester}', '${req.headers.apitoken}');`);

  //return response;
}

exports.sendQuery = (query, msg, response) => {
  return buildQuery(sql, query, msg, response);
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
function buildQuery(conn, query, msg, response) {
  conn.query(query, (error, data) => {
    if (error) {
      console.log(`DB Query Error while executing ${msg}: `, error);
      response.status(501).json({
        message: error.message || `DB Query Error while executing ${msg}`,
      });
    } else {
      //console.log("Query Response: ", response);  // Debug
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
  var query = `insert into log.event (Event, User, DTG) values ('${event}', '${user}', now());`;
  console.log(query);
  
  //
  conn.query(query, (error, data) => {
    if (error) {
      console.log(`DB Log Event Query Error while executing ${msg}: `, error);
      return {message: error.message || `DB Query Error while executing ${msg}`,};
    } else {
      //console.log("Event Logged");  // Debug
      return JSON.stringify(data);
    }
  });
}

exports.emptyTextFieldHandler = (content) => {
  if (!content) return "NULL";
  else return `'${content}'`;
};

/* **** Google API ****
All this needs to be refactored as to not be so redundant*/
exports.googleMain = (response, method, sheetID, dataRange, requester, key = null) => {
  console.log("googleMain()");
  // Load client secrets from a local file.
  fs.readFile("certs/gear_google_credentials.json", (err, content) => {
    if (err) {
      if (requester === "GearCronJ") {
        console.log("Error loading client secret file: " + err);
        return;
      } else {
        response = response.status(504).json({ error: "Error loading client secret file: " + err });
        return;
      }
    }

    // Set callback based on method
    var callback_method = null;
    if (method === "all") callback_method = retrieveAll;
    else if (method === "single") callback_method = single;
    else if (method === "refresh") callback_method = refresh;

    console.log("callback_method: ", callback_method);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(
      JSON.parse(content),
      callback_method,
      response,
      sheetID,
      dataRange,
      requester,
      key
    );
  });
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {response} response Response Object
 */
function authorize(
  credentials,
  callback,
  response,
  sheetID,
  dataRange,
  requester,
  key = null
) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
    try {
      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          let errMessage = "Reading the Token returned an error: " + err;
          errMessage = errMessage.replace(/'/g, "");

          sendResponse(response, { error: errMessage });
          return;
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        oAuth2Client.on("tokens", (tokens) => {
          if (tokens.refresh_token) {
            oAuth2Client.setCredentials({
              refresh_token: tokens.refresh_token,
            });
          }
        });
    
        if (!key) callback(oAuth2Client, response, sheetID, dataRange, requester);
        else callback(oAuth2Client, response, sheetID, dataRange, requester, key);
      });
    } catch (err) {
      // log the error to the database
      buildLogQuery(sql, `Update All Related Records - Token Issue: ` || json.stringify(err), requester, `log_update_zk_systems_subsystems_records`, response);
      sendResponse(response, { error: "Reading the Token returned an error: " + err });
    }
}

/**
 * Retrieves all data within the specified spreadsheet:
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function retrieveAll(auth, response, sheetID, dataRange, requester) {
  const sheets = google.sheets({ version: "v4", auth });

  sheets.spreadsheets.values.get(
    {
      spreadsheetId: sheetID,
      range: dataRange,
    },
    (err, res) => {
      if (err) {
        sendResponse(response, { error: "The API returned an error: " + err });
        return;
      }

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
    }
  );
}

// This function refreshes the data in the database using the data from the spreadsheet
function refresh(auth, response, sheetID, dataRange, requester) {

  // log the start of the refresh to the database
  //buildLogQuery(sql, `Update All Related Records - Start`, requester, "log_update_zk_systems_subsystems_records", response);
  
  // Get the data from the spreadsheet
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: sheetID,
      range: dataRange,
    },
    (err, res) => {

      // If there is an error with the API call to the spreadsheet return the error
      if (err) {
        if (requester === "GearCronJ") {
          console.log("The API returned an error: " + err);
          return;
        } else {
          sendResponse(response, { error: "The API returned an error: " + err });
          return;
        }
      }

      // Get the rows from the spreadsheet
      const rows = res.data.values;

      // If rows is not empty
      if (rows.length <= 0 || rows == undefined) {
        if (requester === "GearCronJ") {
          console.log("No data found.");
          return;
        } else {
          sendResponse(response, { error: "No data found." });
          return;
        }
      }
      console.log("Mapping values...")
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
        m.get(r[1]).push(r[0]);

          // increment the rowCounter
          rowCounter++
        })

      // Build DML statements from the map ================================================================================
      console.log("Building DML Statements...")
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

      console.log("Sending DML Statements: " + dmlStatementCounter)

      // Send the DML statements to the database 
      sql.query(`${systemString}`, (error, data) => {
        let date = new Date();
        let msg = "Sending refresh all query using Google Sheet"
        
        // Send the response
        if (error) {
          console.log(`DB Query Error while executing ${msg}: `, error);

          // log the error to the database
          buildLogQuery(sql, `Update All Related Records - ${msg}: ` || error.message, requester, `log_update_zk_systems_subsystems_records`, response);

          if (requester === "GearCronJ") {
            console.log(error.message || `DB Query Error while executing ${msg}`);
            return;
          } else {
            response.status(501).json({message: error.message || `DB Query Error while executing ${msg}`,});
          }
        } else {
          //console.log("Query Response: ", response);  // Debug

          // log the success to the database
          buildLogQuery(sql, `Update All Related Records - ${insertCounter} rows inserted`, requester, `log_update_zk_systems_subsystems_records`, response);

          const summary = {
            "tot_executions": dmlStatementCounter,
            "tot_inserts": insertCounter,
            "tot_rows": rowCounter,
            "ran_by": requester,
            "last_ran": (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),              
          };

          if (requester === "GearCronJ") {
            console.log(summary);
            return;
          } else {
            response.status(200).json(summary);
          }
        }
        console.log("Finished sending DML Statements")
      });
    }
  );

}

/**
 * Retrieve only one record by ID from the following spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function single(auth, response, sheetID, dataRange, requester, key) {
  const sheets = google.sheets({ version: "v4", auth });

  // Grab all data first
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: sheetID,
      range: dataRange,
    },
    (err, res) => {
      if (err) {
        sendResponse(response, { error: "The API returned an error: " + err });
        return;
      }

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
    }
  );
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

  let timer = timer ();

  logger(`${formatDateTime(new Date())}${logHeader}`, `... getting the last id from ${tableName}`);

  let lastRecordId = null;

  // get the max id from the database
  let [rows, fields] = await sql_promise.query(`select max(id) as lastId from ${tableName};`);

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
  let [rows, fields] = await sql_promise.query(`select max(synchronizedDate) as lastSynchronizedDate from ${tableName};`);

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
  let [rows, fields] = await sql_promise.query(`select count(*) as totalCount from ${tableName};`);

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

async function buildAPIQuery(datasetName, takeAmt, afterId, queryColumnType, logHeader = null, recordId = null) {

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
    additionalQueryParameters = ` id: "${recordId}"`;
  }

  // ... add afterId parameter and lastRecordId value to the query, if afterId is not null
  if (afterId !== null) {
    additionalQueryParameters = ` afterId: "${afterId}"`;
  }

  // TO DO: change this to get the value from the db datasets table
  
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

function formatDateTime(dateObj) {
  
  // - description: formats the date and time for logging
  // - parameters: dateObj (date object)
  // - returns: formattedDate (string)
  
  let formattedDate = new Date(dateObj);

  if (formattedDate === null || formattedDate === '') {
    return null;
  } else {
    // Get the individual date components
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');

    // Get the individual time components
    const hours = String(formattedDate.getHours()).padStart(2, '0');
    const minutes = String(formattedDate.getMinutes()).padStart(2, '0');
    const seconds = String(formattedDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(formattedDate.getMilliseconds()).padStart(3, '0');

    // Combine the components into the desired format
    formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

    return formattedDate;
  }
}

function formatFileDateTime(dateObj) {

  // - description: formats a date object to the format used in the file name
  // - parameters: dateObj (date object)
  // - returns: formattedDate (string)

  var formattedDate = new Date(dateObj);

  if (formattedDate === null || formattedDate === '') {
    return null;
  } else {
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

function stringToDate (dateString) {

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
                  String(newDate.getDate()).padStart(2, '0') +  " " +
                  String(newDate.getHours()).padStart(2, '0') +  ":" +
                  String(newDate.getMinutes()).padStart(2, '0') +  ":" +
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

function booleanToTinyint (boolean) {

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

function getImportId() {

  var formattedDate = new Date();

  // Get the individual date components
  const year = formattedDate.getFullYear();
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const day = String(formattedDate.getDate()).padStart(2, '0');

  // Combine the components into the desired format
  formattedDate = parseInt(`${year}${month}${day}`);

  return formattedDate;
}


// ===================================
// import process functions

exports.importTechCatlogData = async (data, response) => {

  // -----------------------------------------------
  // import variables and functions

    const refreshToken = data.refreshtoken;                   // retrieved from the requests body, stores the refresh token for the flexera api to get a new access token
    const datasetName = data.dataset;                         // dataset name to be pulled // ie. "Taxonomy";
    const takeAmt = data.takeamount;                          // amount of records to pull per page
    const importId = getImportId();                           // import id identifies a group of import requests to be used for logging
    const isDryRun = data.dryrun;                             // flag to determine if the import insert/update statement or not
    const importType = data.importtype;                       // import type identifies the type of import to be used for logging
    const lastSyncDateOverride = null;                        // last synchronized date to override the last sync date in the database
    const lastIdOverride = null;                              // last id to override the last id in the database

    let accessToken = '';                                 // stores the flerera api access token
    let graphqlQuery = '';                                // stores the graphql query to be sent to the flexera api
    //let columnList = '';                                  // select column list based on dataset name

    const tableName = `tech_catalog.tp_${datasetName}`;   // table name based on dataset name// insert table name based on dataset name
    let insertStatement = `insert into ${tableName} (`;   // insert statement for table records
    //let updateStatement = `update ${tableName} set `;     
    let isStatementBuilt = false;                         // flag to determine if the update statement has been built

    // (only used for SoftwareLifecycle dataset ONLY)
    const insertStatementSftwSupportStage =
          `insert into tech_catalog.tp_SoftwareSupportStage (softwareLifecycleId, definition, endDate, manufacturerId, name, order_, policy, publishedEndDate) values ?`;
    let softwareSupportStageCounter = 0;
    
    let pageCounter = 0;                                  // total number of pages processed
    let pageRequestCounter = 0;                           // total number of page requests made
    let recordCounter = 0;                                // total number of records received
    //let recordRequestCounter = 0;                         // total number of record requests made
    let recordsFailedCounter = 0;                         // total number of records that failed to insert into db
    let isFatalError = 0;

    let recordsInsertedCounter = 0;                       // total number of records inserted into db

    let recordToUpdateCounter = 0;                        // total number of records to update
    //let recordsUpdatedCounter = 0;                        // total number of records updated
    //let recordsUpdateFailedCounter = 0;                   // total number of records that failed to update
    
    let pageSummaryArray = [];                            // array of page summary objects, page added after completed
    //let recordsFailedList = [];                           // list of records that failed to insert into db

    let beginTableRecordCount = 0;                        // number of records in the table before the import process begins
    let endTableRecordCount = 0;                          // number of records in the table after the import process ends
    
    let isLastPage = false;                               // flag to determine if this is the last page
    let lastRecordId = null;                              // id of last record processed
    let lastRecordIdUsed = null;                          // the inital last id value used to start the import process

    let lastSynchronizedDate = null;                      // the last synchronized date for the dataset
    const uploadStartTime = new Date();                   // upload start time //TIMESTAMP();
    let uploadEndTime = null;                             // upload end time //TIMESTAMP();
    let recordCountDisplay = 0;
    //let affectRowsCounter = 0;                            // number of rows affected by the insert/update statement
    let affectRowsCounter1 = 0;                           // number of rows affected by the insert/update statement
    let affectRowsCounter2 = 0;                           // number of rows affected by the insert/update statement
    let affectRowsCounter3 = 0;                           // number of rows affected by the insert/update statement
    let recordsToBeDeletedArray = [];

    const importLogFileName         = `${logFolderPath}/import_${importType}_${datasetName}_import_log_${formatFileDateTime(uploadStartTime)}.log`;
    const syncListLogFileName       = `${logFolderPath}/import_${importType}_${datasetName}_records_to_sync_list_${formatFileDateTime(uploadStartTime)}.log`;
    const deleteListLogFileName     = `${logFolderPath}/import_${importType}_${datasetName}_records_to_delete_list_${formatFileDateTime(uploadStartTime)}.log`;
    const errorLogFileName          = `${logFolderPath}/import_${importType}_${datasetName}_ERRORs_${formatFileDateTime(uploadStartTime)}.log`;
    const importSummaryLogFileName  = `${logFolderPath}/import_${importType}_${datasetName}_import_summary_${formatFileDateTime(uploadStartTime)}.log`;

    
    // ... prepares a header without the time to be put in front of each logger message
    function getLogHeaderNoTime () {
      return `/${importId}/${datasetName}/` 
              + (pageCounter > 0 ? `p${pageCounter}/` 
              + (recordCountDisplay > 0 ? `r${recordCountDisplay}/` : '') : '');
    }
    // ... prepares a header to be put in front of each logger message
    function getLogHeader () {
      return `${formatDateTime(new Date())}${getLogHeaderNoTime()}`;
    }
    // ... returns the import summary at any point in the import process
    function getImportSummary () {
      const summary = {
        message : `Technopedia Data Import`,
        importId : importId,
        importType : importType,
        dataset : datasetName,
        takeAmount : takeAmt,
        dryRun : (isDryRun === 'true' ? 'true' : 'false'),
        lastSyncDateOverride : lastSyncDateOverride,
        lastIdOverride : lastIdOverride,
        lastRecordId : lastRecordId,
        firstAfterIdUsed : lastRecordIdUsed,
        lastSynchronizedDateUsed : lastSynchronizedDate,
        startTime : formatDateTime(uploadStartTime),
        endTime : formatDateTime(uploadEndTime),
        duration : formatDuration(uploadStartTime, uploadEndTime),
        totalPageRequestsMade : pageRequestCounter,
        totalPages : pageCounter,
        totalRecords : recordCounter,
        totalRecordsToBeInsertedUpdated : recordToUpdateCounter,
        totalRecordsInsertedUpdated : recordsInsertedCounter,
        totalRecordsFailed : recordsFailedCounter,
        totalSoftwareSupportStageRecords : softwareSupportStageCounter,
        beginTableRecordCount : beginTableRecordCount,
        endTableRecordCount : endTableRecordCount,
        affectRowsCounter1 : affectRowsCounter1,
        affectRowsCounter2 : affectRowsCounter2,
        affectRowsCounter3 : affectRowsCounter3,
        fatalError : isFatalError,
        logDateTime : formatDateTime(new Date()),
        pageSummaries : "see logs",
        recordsToBeDeleted : "see logs"
      };
      return summary;
    }
    // ... performs the required tasks before ending the import process
    async function endImport() {

      uploadEndTime = new Date();

      // wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      // ... get the ending table record count
      endTableRecordCount = await getTableRecordCount(tableName, getLogHeaderNoTime());

      // ... get the import summary
      let summary = getImportSummary();

      writeToLogFile(JSON.stringify(summary), importSummaryLogFileName);

      let logMessage = null;

      if (isFatalError === 1) {
        logMessage = `${datasetName} import FAILED`;
      } else if (recordsFailedCounter > 0) {
        logMessage = `${datasetName} import completed with errors`;
      } else {
        logMessage = `${datasetName} import completed successful`;
      }

      sql.query(`insert into log.event (Event, User, DTG) values ('${logStatement}', 'GearCronJ', now());`);

      let importLogStatement = 
      `update tech_catalog.dataset_import_log
      SET
      import_status = '${logMessage}',
      takeAmount = ${takeAmt},
      dryRun = ${(isDryRun === 'true' ? 'true' : 'false')},
      lastSyncDateOverride = '${lastSyncDateOverride}',
      lastIdOverride = '${lastIdOverride}',
      lastRecordId = '${lastRecordId}',
      firstAfterIdUsed = '${lastRecordIdUsed}',
      lastSynchronizedDateUsed = '${lastSynchronizedDate}',
      startTime = '${formatDateTime(uploadStartTime)}',
      endTime = '${formatDateTime(uploadEndTime)}',
      duration = '${formatDuration(uploadStartTime, uploadEndTime)}',
      totalPageRequestsMade = ${pageRequestCounter},
      totalPages = ${pageCounter},
      totalRecords = ${pageCounter},
      totalRecordsToBeInsertedUpdated = ${recordToUpdateCounter},
      totalRecordsInsertedUpdated = ${recordsInsertedCounter},
      totalRecordsFailed = ${recordsFailedCounter},
      totalSoftwareSupportStageRecords = ${softwareSupportStageCounter},
      beginTableRecordCount = ${beginTableRecordCount},
      endTableRecordCount = ${endTableRecordCount},
      fatalError = ${isFatalError},
      fatalErrorMessage =  = 'see error log file'
      WHERE import_id = '${importId}' AND datasetName = '${datasetName}'; `;

      sql.query(importLogStatement);

      // ... log import summary and complete import request.
      //logger(`${getLogHeader()}`, `IMPORT SUMMARY: \n${JSON.stringify(summary)}`);
      logger(`${getLogHeader()}`, `... import summary logged`);

      logger(`${getLogHeader()}`, `********** ENDING ${importType} IMPORT PROCESS **********\n\n`);

      return summary;

    }

  // -----------------------------------------------

  // -----------------------------------------------
  // import process
  try {

    try {
      // log start to db
      await sql_promise.query(`insert into tech_catalog.dataset_import_log (import_id, datasetName, import_status) values ('${importId}', '${datasetName}', 'in progress'); `);
    } catch (er) {
      console.log(`${datasetName} import is already in progress\n`, er);
      return { message : `${datasetName} import is already in progress` };
    }

    logger(`${getLogHeader()}`, `********** STARTING ${importType} IMPORT PROCESS **********`, null, importLogFileName);

    // -----------------------------------------------
    // pre-import steps
    try {

      logger(`${getLogHeader()}`, `*** STARTING PRE-IMPORT STEPS ***`, null, importLogFileName);


      // -----------------------------------------------
      // 1. validate parameters
      try {

        // ... run validation
        await validateRequest(data, getLogHeaderNoTime());

      } catch (error) {
        // ... log failure, end import.
        logger(`${getLogHeader()}`, `failed validating request parameters`, error, errorLogFileName);
        isFatalError=1;
        return endImport();
      }


      // -----------------------------------------------
      // 2. get the last id and the last synchronizedDate
      try {

        // handle overrides
        try {
          if (data.lastidoverride) {
            lastRecordId = lastRecordIdUsed = data.lastidoverride;
            logger(`${getLogHeader()}`, `... OVERRIDING last id = ${lastRecordId}`, null, importLogFileName);
          }
        } catch (error) {
          lastRecordId = lastRecordIdUsed = null;
        }

        try {
          if (data.lastsyncdateoverride) {
            lastSynchronizedDate = new Date(stringToDate(data.lastsyncdateoverride));
            logger(`${getLogHeader()}`, `... OVERRIDING last sync date = ${formatDateTime(lastSynchronizedDate)}`, null, importLogFileName);
          }
        } catch (error) {
          lastSynchronizedDate = null;
        }

        // get last id
        if (importType === 'insert' && !lastRecordId) {

          // ... get the last record id from the database
          lastRecordId = lastRecordIdUsed = await getLastRecordId(tableName, getLogHeaderNoTime());
          
        }

        // get last synchronizedDate
        if (!lastSynchronizedDate) {
          
          // ... get the last synchronizedDate from the database
          lastSynchronizedDate = await getLastSyncDate(tableName,  getLogHeaderNoTime());

        }

        logger(`${getLogHeader()}`, `... last record id: ${lastRecordId}`, null, importLogFileName);
        logger(`${getLogHeader()}`, `... last synchronizedDate: ${lastSynchronizedDate}`, null, importLogFileName);

      } catch (error) {
        // ... log failure, end import.
        logger(`${getLogHeader()}`, `failed getting the last id and synchronizedDate`, error, errorLogFileName);
        isFatalError=1;
        return endImport();
      }

      // ... get the beginning table record count
      beginTableRecordCount = await getTableRecordCount(tableName, getLogHeaderNoTime());

    } catch (error) {
      // ... log error, end import.
      logger(`${getLogHeader()}`, `an unexpected error occurred during pre-import steps`, error, errorLogFileName);
      isFatalError=1;
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
        //let pageDuration = null;
        let pageRecordCounter = 0;
        let pageRecordsInsertedCounter = 0;
        let pageRecordsToUpdateCounter = 0;
        //let pageRecordsUpdatedCounter = 0;
        //let pageRecordsUpdateFailedCounter = 0;
        let pageRecordsFailedCounter = 0;
        let consecutiveFailedRecordCounter = 0;
        let notificationCounter = 0;

        let pageJson = null;
        let datasetArray = [];

        // ... returns the page summary at any point in the import process
        function getPageSummary () {
          pageEndTime = new Date();
          const summary = {
              importId : importId,
              page : pageCounter,
              startTime : formatDateTime(pageStartTime),
              endTime : formatDateTime(pageEndTime),
              duration : formatDuration(pageStartTime, pageEndTime),
              arraySize : datasetArray.length,
              pageRecordsProcessed : pageRecordCounter,
              pageRecordsInserted : pageRecordsInsertedCounter,
              pageRecordsToUpdate : pageRecordsToUpdateCounter,
              //pageRecordsUpdated : pageRecordsUpdatedCounter,
              pageRecordsFailed : pageRecordsFailedCounter,
              consecutiveFailedRecords : consecutiveFailedRecordCounter,
              isLastPage : isLastPage,
              logDateTime : formatDateTime(new Date())
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
              //if (accessToken === '') {
                // ... get the access token from the flexera api
                accessToken = await getAccessToken(refreshToken, getLogHeaderNoTime());
              //}
            } catch (error) {
              // wait 10 sec and try again
              await new Promise(resolve => setTimeout(resolve, 10000));
              accessToken = await getAccessToken(refreshToken, getLogHeaderNoTime());
            }

          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed getting the access token`, error, errorLogFileName);
            isFatalError=1;
            return endImport();
          }


          // -----------------------------------------------
          // 2. build graphql query
          try {

            // ... build graphql query
            graphqlQuery = await buildAPIQuery(datasetName, takeAmt, lastRecordId, 'all', getLogHeaderNoTime());

            // ... log graphql query
            writeToLogFile(`page ${pageCounter} graphqlQuery: ` + graphqlQuery + `,\n`, importLogFileName);

          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed building the graphql query`, error, errorLogFileName);
            isFatalError=1;
            return endImport();
          }

        
          // -----------------------------------------------
          // 3. execute page request
          try {

            try {
              
              // ... sending api request for page data to flexera
              pageJson = await sendAPIQuery(graphqlQuery, accessToken, getLogHeaderNoTime());

              // (TESTING ONLY)
              //writeToLogFile(`page ${pageCounter} graphqlQuery: ` + JSON.stringify(pageJson) + `,\n`, importLogFileName);

            } catch (error) {
              // wait 10 sec and try again
              await new Promise(resolve => setTimeout(resolve, 10000));
              pageJson = await sendAPIQuery(graphqlQuery, accessToken, getLogHeaderNoTime());
            }

            pageRequestCounter++;
          } catch (error) {
            // ... log failure, end import.
            logger(`${getLogHeader()}`, `failed executing page request`, error, errorLogFileName);
            isFatalError=1;
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
            isFatalError=1;

            return endImport();
          }

        } catch (error) {
          // ... log error, end import.
          logger(`${getLogHeader()}`, `unexpected error occurred during page request`, error, errorLogFileName);
          isFatalError=1;
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
              let recordsToInsertSftwSupportStage = [];
              let insertValuesMapSftwSupportStage = new Map();

              //let recordGraphqlQuery = null;
              //let updateDatasetArray = [];
              //let pageRecordJson = null;
              let insertUpdateRequired = false;

              // ... if the 
              if (importType === 'insert') {

                insertUpdateRequired = true;

              } else if (importType === 'update') {


                // -----------------------------------------------
                // 1. compare synchronizedDate values
                try {

                  // ... get the record's synchronizedDate
                  let recordSynchronizedDate = new Date(stringToDate(datasetObject.synchronizedDate));

                  // ... compare the record's synchronizedDate to the lastSynchronizedDate from the db
                  if (recordSynchronizedDate > lastSynchronizedDate){

                    logger(`${getLogHeader()}`, `...... updating id:"${lastRecordId}"`);

                    // 
                    try {

                      // ... create record object
                      let insertTxt = 
                      {
                        id : lastRecordId,
                        synchronizedDate : datasetObject.synchronizedDate
                      };

                      // ... write record to sync list log
                      fs.appendFileSync(syncListLogFileName, JSON.stringify(insertTxt) + ',\n');

                    } catch (error) {
                      logger(`${getLogHeader()}`, `failed writing record to sync list log`, error, errorLogFileName);
                    }
                    // *************************************************************
                      
                    // ... increment the counters when a record to update is found
                    recordToUpdateCounter++;
                    insertUpdateRequired = true;

                  } else {

                    insertUpdateRequired = false;

                  }

                } catch (error) {
                  // ... raise error
                  throw error;
                }

                
                // -----------------------------------------------
                // 1.5 check if the record should be deleted
                try {

                  // ... check isToBeDeleted value
                  if (datasetObject.isToBeDeleted === true) {

                    logger(`${getLogHeader()}`, `...... id:"${lastRecordId}" will be deleted on "${datasetObject.toBeDeletedOn}"`);

                    let deleteTxt = 
                    {
                      id : lastRecordId,
                      synchronizedDate : datasetObject.synchronizedDate,
                      isToBeDeleted : datasetObject.isToBeDeleted,
                      toBeDeletedOn : datasetObject.toBeDeletedOn
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

                        sql.query(updateObjTechStatement, (error, data) => {
                          if (error) {
                            logger(`${getLogHeader()}`, `...... failed updating obj_technology table ToBeDelete columns for id:"${lastRecordId}"`, error, errorLogFileName);
                          } else {
                            logger(`${getLogHeader()}`, `...... updated obj_technology table ToBeDelete columns for id:"${lastRecordId}"`);
                          }
                        });
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
                // ... raise error
                throw `importType value is invalid`;
              }


              // -----------------------------------------------
              // insert/update statement
              if (insertUpdateRequired) {

                // -----------------------------------------------
                // 1. build insert/update statement
                try{
                  
                  //logger(`${getLogHeader()}`, `building insert statement`);


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
                        for (let supportStageObject of datasetObject.softwareSupportStage) {
                          recordsToInsertSftwSupportStage.push(supportStageObject);

                          insertValuesMapSftwSupportStage = recordsToInsertSftwSupportStage.map(recordsToInsertSftwSupportStage => 
                            [lastRecordId,
                            supportStageObject.definition,	
                            stringToDate(supportStageObject.endDate),	
                            supportStageObject.manufacturerId,	
                            supportStageObject.name,	
                            supportStageObject.order,	
                            supportStageObject.policy,	
                            supportStageObject.publishedEndDate,	
                            ]);
                        }
                        //.log(' - SoftwareSupportStage data found:' + datasetObject.softwareSupportStage.length + ' records.'); // Debug
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
                      if (datasetObject.softwareFamily === null){
                        datasetObject.softwareFamily = null;
                      } else {
                        datasetObject.softwareFamily = datasetObject.softwareFamily.id;
                      }

                      if (datasetObject.taxonomy === null){
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

                    logger(`${getLogHeader()}`, `... completed building ${importType} statement`); //: \n` + insertStatement);

                  }

                  // ... log SUCCESS building update statement
                  //logger(`${getLogHeader()}`, `completed building insert statement`);

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
                    /*
                    // ... insert the record
                    // ... send request to insert record into db table and wait for response
                    let responseDB = await sql_promise.query(insertStatement, [insertValuesMap]);

                    affectRowsCounter = affectRowsCounter + responseDB[0].affectedRows;

                    // ... verify in response that correct number of records inserted
                    if (responseDB[0].affectedRows == 1) {
                      affectRowsCounter1++;
                    } else if (responseDB[0].affectedRows == 2) {
                      affectRowsCounter2++;
                    } else if (responseDB[0].affectedRows == 3) {
                      affectRowsCounter3++;
                    } else {
                      throw `ERROR: failed to ${importType} ${insertValuesMap.length} ${datasetName} records (affectedRows: ${responseDB[0].affectedRows})`;
                    }

                    // ... (for SoftwareLifecycle ONLY) handling SoftwareLifecycle.SoftwareSupportStage[] data
                    try {

                      if (datasetName === 'SoftwareLifecycle' && insertValuesMapSftwSupportStage.length > 0) {

                        // DELETE OLD SoftwareSupportStage

                        // ... delete all existing SoftwareLifecycle.softwareSupportStage records for this softwareLifecycleId
                        let deleteStatementSftwSupportStage = `DELETE FROM tech_catalog.tp_SoftwareSupportStage WHERE softwareLifecycleId = '${lastRecordId}'; `;

                        // ... send request to delete softwareSupportStage records from db table and wait for response
                        let responseDB = await sql_promise.query(deleteStatementSftwSupportStage);

                        // ... verify in response that correct number of records deleted
                        if (responseDB[0].affectedRows <= 0) {
                          throw `ERROR: failed to delete old tp_SoftwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
                        }

                        // INSERT NEW SoftwareSupportStage

                        // ... send request to insert softwareSupportStage record into db table and wait for response
                        const responseDBSftwSupportStage = await sql_promise.query(insertStatementSftwSupportStage, [insertValuesMapSftwSupportStage]);

                        softwareSupportStageCounter = softwareSupportStageCounter + insertValuesMapSftwSupportStage.length;

                        // ... verify in response that correct number of records inserted
                        if (responseDBSftwSupportStage[0].affectedRows <= 0) {
                          throw `failed to ${importType} tp_SoftwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
                        }

                      } // end if SoftwareLifecycle 

                    } catch (error) {
                      // ... raise error
                      logger(`${getLogHeader()}`, `failed to insert SoftwareLifecycle.softwareSupportStage records`, error, errorLogFileName);
                      throw error;
                    }
                    */
                    
                    sql.query(insertStatement, [insertValuesMap], (error, data) => {

                      if (error) {
                        // get the id value from the insertValuesMap
                        let idValue = insertValuesMap[0][0];

                        logger(`${getLogHeader()}`, `ERROR: failed executing the insert/update ${insertValuesMap.length} ${datasetName} records for id: ${idValue}`, error, errorLogFileName);
                        recordsFailedCounter++;
                        pageRecordsFailedCounter++;
                      } else {
                        // ... verify in response that correct number of records inserted
                        if (data.affectedRows == 1) {
                          affectRowsCounter1++;
                        } else if (data.affectedRows == 2) {
                          affectRowsCounter2++;
                        } else if (data.affectedRows == 3) {
                          affectRowsCounter3++;
                        } else {
                          throw `ERROR: record was not inserted/updated id: ${idValue}(affectedRows: ${data.affectedRows})`;
                        }

                        recordsInsertedCounter++;
                        pageRecordsInsertedCounter++;

                        // ... (for SoftwareLifecycle ONLY) handling SoftwareLifecycle.SoftwareSupportStage[] data
                        try {

                          if (datasetName === 'SoftwareLifecycle' && insertValuesMapSftwSupportStage.length > 0) {

                            // DELETE OLD SoftwareSupportStage

                            // ... delete all existing SoftwareLifecycle.softwareSupportStage records for this softwareLifecycleId
                            //let deleteStatementSftwSupportStage = `DELETE FROM tech_catalog.tp_SoftwareSupportStage WHERE softwareLifecycleId = '${lastRecordId}'; `;

                            // ... send request to delete softwareSupportStage records from db table and wait for response
                            //let responseDB = await 
                            //sql.query(deleteStatementSftwSupportStage, (error, data) => {
                            //  if (error) {
                            //    logger(`${getLogHeader()}`, `ERROR: failed executing the delete ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`, error, errorLogFileName);
                            //  } else {
                            sql.query(insertStatementSftwSupportStage, [insertValuesMapSftwSupportStage]);
                            softwareSupportStageCounter = softwareSupportStageCounter + insertValuesMapSftwSupportStage.length;
                            //  }
                            //});

                            // ... verify in response that correct number of records deleted
                            //if (responseDB[0].affectedRows <= 0) {
                            //  throw `ERROR: failed to delete old tp_SoftwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
                            //}

                            // INSERT NEW SoftwareSupportStage

                            // ... send request to insert softwareSupportStage record into db table and wait for response
                            //const responseDBSftwSupportStage = 


                            // ... verify in response that correct number of records inserted
                            //if (responseDBSftwSupportStage[0].affectedRows <= 0) {
                            //  throw `failed to ${importType} tp_SoftwareSupportStage ${insertValuesMapSftwSupportStage.length} SoftwareLifecycle.softwareSupportStage records`;
                            //}

                          } // end if SoftwareLifecycle 

                        } catch (error) {
                          // ... raise error
                          logger(`${getLogHeader()}`, `failed to insert SoftwareLifecycle.softwareSupportStage records for id: ${idValue}`, error, errorLogFileName);
                          throw error;
                        }
                      }

                    });
                    

                  } // end if
                  /*
                  // ... increment counters when insert is successful
                  recordsInsertedCounter++;
                  pageRecordsInsertedCounter++;
                  consecutiveFailedRecordCounter = 0;
                  */
                } catch (error) {
                  // ... increment counters when fails
                  recordsFailedCounter++;
                  pageRecordsFailedCounter++;
                  consecutiveFailedRecordCounter++;
                  // ... log failure and continue to next record
                  logger(`${getLogHeader()}`, `failed ${importType} record`, error, errorLogFileName);
                }

              } // END IF (insertUpdateRequired)

              // ... notification log after every 1000 records have been processed from a page
              /*if (notificationCounter === 1000) {
                // ... log 1,000 records processed notification
                logger(`${getLogHeader()}`, `... ${pageRecordCounter} of ${datasetArray.length} records processed, ${pageRecordsInsertedCounter} inserted/updated, ${pageRecordsFailedCounter} failed in ${formatDuration(pageStartTime, new Date())}`);
                // ... reset notification counter
                notificationCounter = 0;
              }*/

              // ... stop the upload and return the error message
              if (consecutiveFailedRecordCounter === 25) {
                // ... log error message and end the import request
                logger(`${getLogHeader()}`, `ERROR: previous 25 records failed to ${importType}, ending import.`, error, errorLogFileName);
                isFatalError=1;
                return endImport();
              }          

            } // end of records loop
            // -----------------------------------------------

            recordCountDisplay = 0;

            logger(`${getLogHeader()}`, `... completed page ${pageCounter} record import`);

          } catch (error) {
            // ... log error, end import.
            logger(`${getLogHeader()}`, `an unexpected error occurred while processing the page records`, error, errorLogFileName);
            isFatalError=1;
            return endImport();
          }


          // -----------------------------------------------
          // part 3: summarize page imported
          try {

             if (!isLastPage) {

              logger(`${getLogHeader()}`, `... summarizing page ${pageCounter} data imported`);

              // ... get the page summary object
              const pageSummary = getPageSummary();

              // ... log page summary
              //logger(`${getLogHeader()}`, `PAGE ${pageCounter} SUMMARY: \n${JSON.stringify(pageSummary)}`);
              logger(`${getLogHeader()}`, `... page summary logged`);
          
            } // end of !isLastPage

          } catch (error) {
            // ... log failure
            logger(`${getLogHeader()}`, `an unexpected error occurred while calculating and logging page summary`, error, errorLogFileName);
            isFatalError=1;
            return endImport();
          }

        } // end of !isLastPage
        // -----------------------------------------------


        // ... if the data returned is less than the takeAmt, then this is the last page
        if (datasetArray.length != takeAmt) {
          isLastPage = true;

          logger(`${getLogHeader()}`, `... last page reached`);
        }

      } while (!isLastPage);  // end of page loop
      // -----------------------------------------------

    } catch (error) {
      // ... log error, end import.
      logger(`${getLogHeader()}`, `an unexpected error occurred during the import steps`, error, errorLogFileName);
      isFatalError=1;
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
      isFatalError=1;
      return endImport();
    }
    // end post-import -------------------------------


  } catch (error) {
    // ... log error, end import.
   logger(`${getLogHeader()}`, `an unexpected error occurred during the import process`, error, errorLogFileName);
   isFatalError=1;
   return endImport();
  }
  // end import process -----------------------------

}