const sql = require("../db.js").connection,
  // sql_cowboy  = require("../db.js").connection_cowboy,
  sql_promise = require("../db.js").connection_promise,
  path = require("path"),
  fs = require("fs"),
  readline = require("readline"),
  { google } = require("googleapis");

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
      console.log("DB Log Event Query Response: ");  // Debug
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
      response = response
        .status(504)
        .json({ error: "Error loading client secret file: " + err });
      return;
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
        sendResponse(response, { error: "The API returned an error: " + err });
        return;
      }

      // Get the rows from the spreadsheet
      const rows = res.data.values;

      // If rows is not empty
      if (rows.length <= 0 || rows == undefined) {
        sendResponse(response, { error: "No data found." });
        return;
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

          response.status(501).json({message: error.message || `DB Query Error while executing ${msg}`,});
        } else {
          //console.log("Query Response: ", response);  // Debug

          // log the success to the database
          buildLogQuery(sql, `Update All Related Records - ${insertCounter} rows inserted`, requester, `log_update_zk_systems_subsystems_records`, response);

          response.status(200)
            .json({
              "tot_executions": dmlStatementCounter,
              "tot_inserts": insertCounter,
              "tot_rows": rowCounter,
              "ran_by": requester,
              "last_ran": (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),              
            });
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













// ###########################################################################
// ########################## FLEXERA TECHNOPEDIA ############################
// ###########################################################################

// upload technopedia api data to database by dataset
exports.uploadTechCatalogDataset = async (data, response) => {

  // TO DO: remove variables below and add them as parameters to this function
  // refresh token for flexera api
  const refreshToken = data.refreshToken;
  // dataset name to be pulled
  const datasetName = data.dataset; // ie. "Taxonomy";

  console.log('############################################################################################################');
  console.log('#### START - UPLOAD TECH CATALOG DATASET: #### ' + datasetName);
  console.log('############################################################################################################'); 
  
  // GLOBAL VARIABLES
    // number of records to retrieve per api call
    const takeAmt = "10000";
    // stores the flerera api access token
    let accessToken = "";
    // select column list based on dataset name
    let columnList = '';

    // insert query
    let tableName = `tech_catalog.tp_${datasetName}_tmp`;
    let insertQuery = `insert into ${tableName} (`;

    let insertQuerySftwSupportStage = `insert into tech_catalog.tp_SoftwareSupportStage_tmp (softwareLifecycleId, definition, endDate, manufacturerId, name, order_, policy, publishedEndDate) values ?`;

    // total number of pages received (aka API calls made)
    var pageCounter = 0;
    // total number of records received
    var recordCounter = 0;
    // total number of records that failed to insert into db
    var failedRecordCounter = 0;
    // flag to determine if this is the last page
    var isLastPage = false;
    // id of last record processed
    var lastRecordId = null;
    // upload start time
    var uploadStartTime = new Date(); //TIMESTAMP();
    // stores the error log path
    let errorLogPath = 'tech_catalog_data/logs/errors_' + datasetName + '_' + String(uploadStartTime).replace(/:/g, '_').replace(/ /g, '_') + '.log';

    function logger(msg, error) {
      if (error === undefined || error === null || error === '') {
        //console.log(`(${formatDateTime(Date.now())}): ${datasetName} - ${msg}`);
        console.log(`${msg}`);

      } else {
        //console.log(`(${formatDateTime(Date.now())}): ${datasetName} - ${msg}... \n`, error);
        console.log(`${msg}\n`, error);

        // log the error to file
        fs.appendFileSync(errorLogPath, msg + '\n' + error + '\r\n');
      }
    }

    // verify if refreskToken was provided
    if (refreshToken === undefined || refreshToken === null || refreshToken === '') {
      let errorMsg = `#### ${datasetName} #### *************** ERROR no refresh token provided... ending upload. *************** \n`;

      logger(errorMsg, '');

      return errorMsg;
    }

    // verify if datasetName was provided and is supported
    if (datasetName === undefined || datasetName === null || datasetName === '') {
      let errorMsg = `#### ${datasetName} #### *************** ERROR no dataset name provided... ending upload. *************** \n`;
      
      logger(errorMsg, '');

      return errorMsg;
    } else if (datasetName !== 'Manufacturer' && 
               datasetName !== 'Platform' && 
               datasetName !== 'SoftwareEdition' && 
               datasetName !== 'SoftwareFamily' && 
               datasetName !== 'SoftwareLifecycle' && 
               datasetName !== 'SoftwareMarketVersion' && 
               datasetName !== 'SoftwareProduct' && 
               datasetName !== 'SoftwareProductLink' && 
               datasetName !== 'SoftwareRelease' && 
               datasetName !== 'SoftwareReleaseLink' && 
               datasetName !== 'SoftwareReleasePlatform' && 
               //datasetName !== 'SoftwareSupportStage' && 
               datasetName !== 'SoftwareVersion' && 
               datasetName !== 'Taxonomy') {
      let errorMsg = `#### ${datasetName} #### *************** ERROR dataset name provided is not supported... ending upload. *************** \n`;

      logger(errorMsg, '');

      return errorMsg;
    }

    // display the upload start time
    console.log(`#### ${datasetName} #### Upload Start Time: ${uploadStartTime}`);

    // calcs the duration between two date times and returns a string
    function formatDuration(start_date, end_date) {
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
      
      //console.log(result);
      return result;
    }

  
  // ############################################################################################################
  console.log(`#### ${datasetName} #### Pre-cleaning: Getting last ${datasetName} record id from database.`);
  // ############################################################################################################
  
  try {
    // get the max id from the database
    let [rows, fields] = await sql_promise.query(`select max(id) as lastId from ${tableName};`);

    // set the lastRecordId
    lastRecordId = rows[0].lastId;

    if (lastRecordId === null) {
      console.log(`#### ${datasetName} #### ...... No ${datasetName} records found in database.`);
    } else {
      console.log(`#### ${datasetName} #### ...... Last ${datasetName} record id successfully retrieved from database: ${lastRecordId}`);
    }
  } catch (error) {
    let errorMsg = `#### ${datasetName} #### *************** ERROR getting last ${datasetName} record id from database... ending upload. *************** \n`;

    logger(errorMsg, error);

    return errorMsg;
  }

  // loop through each page for the entire dataset (or calls to api)
  do {    
    // increment page counter
    pageCounter++;

    // page proceessing start time
    var pageStartTime = new Date();
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Page Start Time: ${pageStartTime}`);
    
    // ############################################################################################################
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Step #1: Get Access Token `);
    // ############################################################################################################

    // stores the page data from the flexera api
    let pageJson = null;

    // check if start time is greater than 45 minutes
    //if ((uploadStartTime.getMinutes() + 45) < pageStartTime || accessToken === "") {
      try {
        let response = null;

        try {
          // get access token from flexera api
          response = await fetch('https://login.flexera.com/oidc/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          });
        } catch (error) {
          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting access token (1st attempt). *************** \n`;

          logger(errorMsg, error);

          try {            
            // get access token from flexera api
            response = await fetch('https://login.flexera.com/oidc/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
              }),
            });
          } catch (error) {
            let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting access token (2nd attempt). *************** \n`;

            logger(errorMsg, error);

            // return the error message
            return errorMsg;
          }
        }

        // check if response is ok
        if (response.ok) {
          // get json from response
          const data = await response.json();

          // set the access token
          accessToken = String(data.access_token);

          console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Access Token Received.`);
        } else {
          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR access token api call returned bad response ... ending upload. *************** \n ${response.status} ${response.statusText} \n`;

          logger(errorMsg, '');

          return errorMsg;
        }
      } catch (error) {
        let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting access token. *************** \n`;

        logger(errorMsg, error);

        // return the error message
        return errorMsg;
      }
    //} else {
    //  console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Access Token is still good, duration: ${(uploadStartTime + 3300000 - pageStartTime) / 60000} minutes`);
    //  console.log(uploadStartTime + 3300000);
    //}


    // ############################################################################################################
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Step #2: Build ${datasetName} graphQL query `);
    // ############################################################################################################

    // stores the additional graphql query parameters
    let additionalQueryParameters = '';
    
    // add afterId parameter if this is not the first page
    if (lastRecordId !== null) {
      additionalQueryParameters = ` afterId: "${lastRecordId}"`;
    }

    // ############################################################################################################
    // #1 select the dataset and build column list for graphql query
    if (columnList === '') {
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
        case 'SoftwareSupportStage':
          columnList = `
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
      }
    }
    // ############################################################################################################


    //console.log(`...... (DEBUGGING) columnList: ${columnList}`); // Debugging
    
    // build graphql query
    let graphqlQuery = JSON.stringify({
      query: `{
        ${datasetName}(take: ${takeAmt}${additionalQueryParameters} ) {
            ${columnList}
        }
    }`,});

    //console.log(`...... (DEBUGGING) graphqlQuery: ${graphqlQuery}`); // Debugging

    // ############################################################################################################
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Step #3: Send ${datasetName} graphql query to api  `);
    // ############################################################################################################
    try {
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

        //console.log(`...... (DEBUGGING) pageJson: ${JSON.stringify(pageJson)}`); // Debugging
        
        console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Page ${pageCounter} Data Received.`);
      } else {
        let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting ${datasetName} data from api, bad response... ending upload. *************** \n`;

        logger(errorMsg, '');

        // return the error message
        return errorMsg;
      }

      // write pageJson to file
      fs.appendFileSync('tech_catalog_data/json/' + datasetName + '_page_' + pageCounter + '_' + String(uploadStartTime).replace(/:/g, '_').replace(/ /g, '_') + '.json', JSON.stringify(pageJson));
    } catch (error) {
      let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting ${datasetName} data from api... ending upload. *************** \n `;

      logger(errorMsg, error);

      // return the error message
      return errorMsg;
    }

    // ############################################################################################################
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Step #4: Insert ${datasetName} data into database `);
    // ############################################################################################################

    // loop iteration counter
    let pageRecordCounter = 0;
    let pageFailedRecordCounter = 0;

    // stores the dataset array
    let datasetArray = pageJson.data[datasetName];

    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... ${datasetArray.length} ${datasetName} records received.`);

    // check if dataset array is empty
    if (datasetArray.length === 0) {
      console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... page contains ${datasetArray.length} records, finishing up the upload...`);
      isLastPage = true;
      pageCounter--;
    } else {
      // store consecutive failed record counter
      let consecutiveFailedRecordCounter = 0;
      let notificationCounter = 0;

      console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... starting the inserts for ${datasetArray.length} records...`);

      // #############################################################################
      // ############### loop through each object in the dataset array ###############
      for (let datasetObject of datasetArray) {
        pageRecordCounter++;
        notificationCounter++;

        // set the lastRecordId
        lastRecordId = datasetObject.id;

        if (pageCounter === 1 && pageRecordCounter === 1) {
          // ############################################################################################################
          // #3 select and add columns to insert statement
          switch (datasetName) {
            case 'Manufacturer':
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
            case 'SoftwareSupportStage':
              insertQuery = insertQuery

              break;
            case 'SoftwareVersion':
              insertQuery = insertQuery
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
              insertQuery = insertQuery
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
          }
          // ############################################################################################################

          // remove , from the end of insert query if it exists
          if (insertQuery.endsWith(',')) {
            insertQuery = insertQuery.substring(0, insertQuery.length - 1);
          }

          // add values syntax to insert query
          insertQuery = insertQuery + ') values ?';
        }
        
        // #################################################################################
        // data cleaning functions
        
        // perform data cleaning
        function stringToDate (dateString) {
          //console.log(' - Converting stringToDate: ', dateString); // Debug
          if (dateString === null || dateString === '') {
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

        // remove special characters from string
        function removeSpecialChar (string) {
          //console.log(' - Removing special characters: ', string); // Debug
          if (string === null) {
            return null;
          } else {
            return string = string.replace(/'/g, "").replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\"/g, ' ').replace(/\\/g, ' ');
          }
        }

        // convert boolean to tinyint
        function booleanToTinyint (boolean) {
          //console.log(' - Converting booleanToTinyint: ', boolean); // Debug
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

        // handling null/no id field objects in json
        function handleNullId (record) {
          //console.log(' - Handling null id: ', id); // Debug
          try {
            if (record.id === null) {
              return null;
            } else {
              return record.id;
            }
          } catch (error) {
            return null;
          }
        }

        // data cleaning functions
        // #################################################################################

        let recordsToInsert = [];
        let insertValuesMap = new Map();

        // to store SoftwareLifecycle.softwareSupportStage Object data
        let recordsToInsertSftwSupportStage = [];
        let insertValuesMapSftwSupportStage = new Map();

        recordsToInsert.push(datasetObject);

        try {
          // ############################################################################################################
          // #4 add the column values to query
          switch (datasetName) {
            case 'Manufacturer':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                datasetObject.acquiredDate,	// dt:DATETIME
                datasetObject.city,	// dt:VARCHAR
                datasetObject.country,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:DATETIME
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.description,	// dt:VARCHAR
                datasetObject.email,	// dt:VARCHAR
                datasetObject.employees,	// dt:VARCHAR
                stringToDate(datasetObject.employeesDate),	// dt:DATETIME
                datasetObject.fax,	// dt:VARCHAR
                stringToDate(datasetObject.fiscalEndDate),	// dt:DATETIME
                //datasetObject.idLegacy,	// dt:INT
                datasetObject.isPubliclyTraded,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.knownAs,	// dt:VARCHAR
                datasetObject.legal,	// dt:VARCHAR
                datasetObject.name,	// dt:VARCHAR
                datasetObject.ownerId,	// dt:VARCHAR
                //datasetObject.ownerIdLegacy,	// dt:INT
                datasetObject.phone,	// dt:VARCHAR
                stringToDate(datasetObject.profitsDate),	// dt:DATETIME
                datasetObject.profitsPerYear,	// dt:INT
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
                datasetObject.revenue,	// dt:INT
                stringToDate(datasetObject.revenueDate),	// dt:DATETIME
                datasetObject.state,	// dt:VARCHAR
                datasetObject.street,	// dt:VARCHAR
                datasetObject.symbol,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                datasetObject.tier,	// dt:INT
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                datasetObject.website,	// dt:VARCHAR
                datasetObject.zip,	// dt:VARCHAR
              ]);
              break;
            case 'Platform':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
              ]);
              break;
            case 'SoftwareEdition':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.order,	// dt:INT
                datasetObject.replacementId,	// dt:INT
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareProduct.id,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareFamily':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:INT
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.manufacturer.id,	// dt:VARCHAR
                  datasetObject.taxonomy.id,	// dt:VARCHAR
                ]);
              } catch (error) {
                try {
                  insertValuesMap = recordsToInsert.map(recordsToInsert => 
                    [datasetObject.id,	// dt:VARCHAR
                    stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                    datasetObject.deleteReason,	// dt:VARCHAR
                    booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                    booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                    booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                    datasetObject.name,	// dt:VARCHAR
                    datasetObject.replacementId,	// dt:INT
                    //datasetObject.replacementIdLegacy,	// dt:INT
                    stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                    stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                    stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                    datasetObject.manufacturer.id,	// dt:VARCHAR
                    datasetObject.taxonomy,	// dt:VARCHAR
                  ]);
                  } catch (error) {
                    insertValuesMap = recordsToInsert.map(recordsToInsert => 
                      [datasetObject.id,	// dt:VARCHAR
                      stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                      datasetObject.deleteReason,	// dt:VARCHAR
                      booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                      booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                      booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                      datasetObject.name,	// dt:VARCHAR
                      datasetObject.replacementId,	// dt:INT
                      //datasetObject.replacementIdLegacy,	// dt:INT
                      stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                      stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                      stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                      datasetObject.manufacturer,	// dt:VARCHAR
                      datasetObject.taxonomy,	// dt:VARCHAR
                    ]);
                  }
              }
              break;
            case 'SoftwareLifecycle':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.endOfLife,	// dt:VARCHAR
                datasetObject.endOfLifeCalculatedCase,	// dt:VARCHAR
                stringToDate(datasetObject.endOfLifeDate),	// dt:DATE
                stringToDate(datasetObject.endOfLifeDateCalculated),	// dt:TIMESTAMP
                datasetObject.endOfLifeException,	// dt:VARCHAR
                datasetObject.endOfLifeSupportLevel,	// dt:VARCHAR
                datasetObject.generalAvailability,	// dt:VARCHAR
                stringToDate(datasetObject.generalAvailabilityDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.generalAvailabilityDateCalculated),	// dt:TIMESTAMP
                datasetObject.generalAvailabilityException,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.obsolete,	// dt:VARCHAR
                datasetObject.obsoleteCalculatedCase,	// dt:VARCHAR
                stringToDate(datasetObject.obsoleteDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.obsoleteDateCalculated),	// dt:TIMESTAMP
                datasetObject.obsoleteException,	// dt:VARCHAR
                datasetObject.obsoleteSupportLevel,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareRelease.id,	// dt:VARCHAR
              ]);

              // check if softwareSupportStage has data
              if (datasetObject.softwareSupportStage !== null && datasetObject.softwareSupportStage !== undefined) {
                for (let supportStageObject of datasetObject.softwareSupportStage) {
                  recordsToInsertSftwSupportStage.push(supportStageObject);

                  insertValuesMapSftwSupportStage = recordsToInsertSftwSupportStage.map(recordsToInsertSftwSupportStage => 
                    [lastRecordId,	// dt:VARCHAR)
                    supportStageObject.definition,	// dt:VARCHAR
                    stringToDate(supportStageObject.endDate),	// dt:DATETIME
                    supportStageObject.manufacturerId,	// dt:VARCHAR
                    supportStageObject.name,	// dt:VARCHAR
                    supportStageObject.order,	// dt:INT
                    supportStageObject.policy,	// dt:VARCHAR
                    supportStageObject.publishedEndDate,	// dt:VARCHAR
                    ]);
                }
                //.log(' - SoftwareSupportStage data found:' + datasetObject.softwareSupportStage.length + ' records.'); // Debug
              } 
              break;
            case 'SoftwareMarketVersion':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.order,	// dt:INT
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareProduct.id,	// dt:VARCHAR
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
                [datasetObject.id,	// dt:VARCHAR
                datasetObject.alias,	// dt:VARCHAR
                datasetObject.application,	// dt:VARCHAR
                datasetObject.cloud,	// dt:VARCHAR
                datasetObject.component,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:DATETIME
                datasetObject.deleteReason,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isFamilyInFullName),	// dt:TINYINT
                booleanToTinyint(datasetObject.isSuite),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.productLicensable,	// dt:INT
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                datasetObject.manufacturer.id,	// dt:VARCHAR
                datasetObject.softwareFamily,	// dt:VARCHAR
                datasetObject.taxonomy,	// dt:VARCHAR
                ]);
              break;
            case 'SoftwareProductLink':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  datasetObject.formerSoftwareProductId,	// dt:VARCHAR
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.laterSoftwareProductId,	// dt:VARCHAR
                  datasetObject.latestSoftwareProductId,	// dt:VARCHAR
                  datasetObject.oldestSoftwareProductId,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  datasetObject.softwareCloudId,	// dt:VARCHAR
                  datasetObject.softwareOnPremId,	// dt:VARCHAR
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.softwareProduct.id,	// dt:VARCHAR
                ]);
              } catch (error) {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  datasetObject.formerSoftwareProductId,	// dt:VARCHAR
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.laterSoftwareProductId,	// dt:VARCHAR
                  datasetObject.latestSoftwareProductId,	// dt:VARCHAR
                  datasetObject.oldestSoftwareProductId,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  datasetObject.softwareCloudId,	// dt:VARCHAR
                  datasetObject.softwareOnPremId,	// dt:VARCHAR
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.softwareProduct,	// dt:VARCHAR
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
                [datasetObject.id,	// dt:VARCHAR
                datasetObject.application,	// dt:VARCHAR
                datasetObject.cloud,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isLicensable),	// dt:TINYINT
                booleanToTinyint(datasetObject.isMajor),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.majorSoftwareReleaseId,	// dt:VARCHAR
                datasetObject.name,	// dt:VARCHAR
                datasetObject.patchLevel,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.scaOpenSource,	// dt:VARCHAR
                datasetObject.softwareEdition,	// dt:VARCHAR
                datasetObject.softwareProduct.id,	// dt:VARCHAR
                datasetObject.softwareVersion,	// dt:VARCHAR
              ]);
              
              break;
            case 'SoftwareReleaseLink':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.formerSoftwareReleaseId,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.laterSoftwareReleaseId,	// dt:VARCHAR
                datasetObject.latestSoftwareReleaseId,	// dt:VARCHAR
                datasetObject.oldestSoftwareReleaseId,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareRelease.id,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareReleasePlatform':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.platformLabel,	// dt:VARCHAR
                datasetObject.platformType,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.platform.id,	// dt:VARCHAR
                datasetObject.softwareRelease.id,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareSupportStage':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.softwareLifecycle.id,	// dt:VARCHAR
                datasetObject.definition,	// dt:VARCHAR
                stringToDate(datasetObject.endDate),	// dt:DATE
                datasetObject.manufacturerId,	// dt:VARCHAR
                datasetObject.name,	// dt:VARCHAR
                datasetObject.order,	// dt:INT
                datasetObject.policy,	// dt:VARCHAR
                datasetObject.publishedEndDate,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareVersion':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:DATETIME
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isMajor),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.majorSoftwareVersionId,	// dt:VARCHAR
                  //datasetObject.majorVersionIdLegacy,	// dt:INT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.order,	// dt:INT
                  datasetObject.patchLevel,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                  stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                  datasetObject.versionStage,	// dt:VARCHAR
                  datasetObject.softwareMarketVersion.id,	// dt:VARCHAR
                  datasetObject.softwareProduct.id,	// dt:VARCHAR
                ]);
              } catch (error) {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:DATETIME
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isMajor),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.majorSoftwareVersionId,	// dt:VARCHAR
                  //datasetObject.majorVersionIdLegacy,	// dt:INT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.order,	// dt:INT
                  datasetObject.patchLevel,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                  stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                  datasetObject.versionStage,	// dt:VARCHAR
                  datasetObject.softwareMarketVersion,	// dt:VARCHAR
                  datasetObject.softwareProduct.id,	// dt:VARCHAR
                ]);
              }
              break;
            case 'Taxonomy':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                datasetObject.category,	// dt:VARCHAR
                datasetObject.categoryGroup,	// dt:VARCHAR
                datasetObject.categoryId,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:DATETIME
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.description,	// dt:VARCHAR
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.replacementId,	// dt:VARCHAR
                datasetObject.softwareOrHardware,	// dt:VARCHAR
                datasetObject.subcategory,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                stringToDate(datasetObject.updatedDate),	// dt:DATETIME
              ]);
              break;
          }
        } catch (error) {
          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### *************** ERROR: Column Values id: ${lastRecordId} ***************  \n${error} \n`;

          logger(errorMsg, error);

          //console.log(JSON.stringify(datasetObject)); // Debug

          // stop the upload and return the error message
          return errorMsg;
        }
        // ############################################################################################################

        try {
          // execute the insert statement in db
          let responseDB = await sql_promise.query(insertQuery, [insertValuesMap]);

          // reset failed record counter
          consecutiveFailedRecordCounter = 0;

          // handling SoftwareLifecycle.SoftwareSupportStage[] data
          try {
            if (datasetName === 'SoftwareLifecycle' && insertValuesMapSftwSupportStage.length > 0) {
              //console.log('... inserting SoftwareSupportStage data'); // Debug
              let responseDB = await sql_promise.query(insertQuerySftwSupportStage, [insertValuesMapSftwSupportStage]);
            }
          } catch (error) {
            let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### *************** ERROR inserting SoftwareSupportStage data for SoftwareLifecycle id: ${lastRecordId} ***************  \n ${error} \n`;

            logger(errorMsg, error);

            // log the error to file
            //fs.appendFileSync(errorLogPath, errorMsg + error + '\r\n');
          }
        } catch (error) {
          // increment failed record counter
          pageFailedRecordCounter++;
          consecutiveFailedRecordCounter++;

          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### *************** ERROR inserting ${datasetName} data id: ${lastRecordId} ***************  \n ${error} \n`;

          logger(errorMsg, error);

          // log the error to file
          fs.appendFileSync(errorLogPath, errorMsg + error + '\n\n');

          // stop the upload and return the error message
          if (consecutiveFailedRecordCounter === 25) {
            errorMsg = errorMsg + `\n#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR: 25 consecutive failed records, stopping upload. *************** \n`;

            logger(errorMsg, '');

            return errorMsg;
          }
        }

        // 1000 records notification
        if (notificationCounter === 1000) {
          let pageCurrentTime = new Date();
          let pageCurrentDuration = formatDuration(pageStartTime, pageCurrentTime);
          console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... ${pageRecordCounter} of ${datasetArray.length} records process with ${pageFailedRecordCounter} error(s) at ${pageCurrentTime}.(.... ${pageCurrentDuration})`); // Debug
          notificationCounter = 0;
        }
      } // ####################### end page records FOR LOOP #######################
      // #############################################################################
    }

    // #################### PAGE SUMMARY ####################
    // page processing end time
    var pageEndTime = new Date();
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Page End Time: ${pageEndTime}`);

    // calculate page duration in seconds
    let pageDuration = formatDuration(pageStartTime, pageEndTime);
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Page Duration: ${pageDuration}`);

    // display summary of page
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Summary of Page Processing: completed inserting ` + (pageRecordCounter-failedRecordCounter) + ' of ' + datasetArray.length + ' records.'); // Debug

    // #################### END PAGE SUMMARY ####################


    // #################### UPLOAD SUMMARY ####################

    // update global variables
    recordCounter = recordCounter + pageRecordCounter;

    // update global variables
    failedRecordCounter = failedRecordCounter + pageFailedRecordCounter;

    // determine if this is the last page
    if (datasetArray.length < takeAmt /*|| pageCounter === 2*/ || pageFailedRecordCounter >= 10) {
      console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ....... Last Page Reached! `);
      isLastPage = true;
    }

    try {
      // success response to client
      if (isLastPage) {
        console.log(`#### ${datasetName} ####  UPLOAD ${datasetName} DATA COMPLETED!`);
        console.log(`#### ${datasetName} #### ...... uploadStartTime: ${uploadStartTime}`);

        // display end time
        let uploadEndTime = new Date();
        console.log(`#### ${datasetName} #### ...... uploadEndTime: ${uploadEndTime}`);

        // calculate upload duration in hours, minutes, seconds
        let uploadDuration = formatDuration(uploadStartTime, uploadEndTime);

        console.log(`#### ${datasetName} #### ...... uploadDuration: ${uploadDuration}`);

        console.log(`#### ${datasetName} #### ...... totalPages: ${pageCounter}`);
        console.log(`#### ${datasetName} #### ...... totalRecords: ${recordCounter}`);
        console.log(`#### ${datasetName} #### ...... failedRecords: ${failedRecordCounter}`);
        console.log(`## END OF ${datasetName} #####################################################################################################`);

        let returnMsg = datasetName + ' data upload completed with ' + (recordCounter-failedRecordCounter) + ' records successfully inserted and ' + failedRecordCounter + ' records failed to insert from ' + pageCounter + ' pages.';

        // return the success message
        return returnMsg;
      } else {
        console.log(`#### ${datasetName} #### ...... Next Page.`);
      }
    } catch (error) {
      let errorMsg = `#### ${datasetName} #### *************** ERROR returning response (${datasetName}) *************** \n `;

      logger(errorMsg, error);

      // stop the upload and return the error message
      return errorMsg;
    }
  } while (!isLastPage);
}



// exports a list of ids from a dataset that need to be re-synced
exports.getSyncList = async (data, response) => {

  // VARIABLES

  const refreshToken = data.refreshToken;
  const datasetName = data.dataset;
  
  const takeAmt = "10000";
  let accessToken = '';
  let additionalQueryParameters = null;
  let graphqlQuery = '';
  let columnList = `id
  createdDate
  deleteReason
  isToBeDeleted
  replacementId
  synchronizedDate
  toBeDeletedOn
  updatedDate
  `;
  
  const tableName = `tech_catalog.tp_${datasetName}_tmp`;

  var pageCounter = 0;
  var recordCounter = 0;
  var failedRecordCounter = 0;
  var syncCounter = 0;

  var isLastPage = false;
  var lastRecordId = null;
  let lastSynchronizedDate = null;
  const uploadStartTime = new Date().getTime();
  var uploadEndTime = null;

  // FUNCTIONS FOR UPLOAD

  function formatDateTime(dateObj) {
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
      const milliseconds = String(formattedDate.getMilliseconds()).padStart(3, '0');

      // Combine the components into the desired format
      formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

      return formattedDate;
    }
  }

  function formatFileDateTime(dateObj) {
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

  function logger(msg, error) {
    if (error === undefined) {
      console.log(`(${formatDateTime(Date.now())}): ${datasetName} - ${msg}`);
    } else {
      console.log(`(${formatDateTime(Date.now())}): ${datasetName} - ${msg}... \n`, error);
    }
  }

  try {
    
    logger(`Starting Get Sync List...`);

    // DEFINE FILE PATHS

    const syncPath = `tech_catalog_data/sync/sync_${datasetName}_${formatFileDateTime(uploadStartTime)}.log`
    const errorLogPath = `tech_catalog_data/logs/errors_${datasetName}_${formatFileDateTime(uploadStartTime)}.log`;

    // PRE-UPLOAD CHECKS
    logger(`...... Verifying Parameters`);
    try {
      if (refreshToken === undefined || refreshToken === null || refreshToken === '') {
        let errorMsg = `No Token Provided`;
        logger(errorMsg);
        return errorMsg;
      }

      if (datasetName === undefined || datasetName === null || datasetName === '') {
        let errorMsg = `No Dataset Provided`;
        logger(errorMsg);
        return errorMsg;
      } else if (datasetName !== 'Manufacturer' && 
                  datasetName !== 'Platform' && 
                  datasetName !== 'SoftwareEdition' && 
                  datasetName !== 'SoftwareFamily' && 
                  datasetName !== 'SoftwareLifecycle' && 
                  datasetName !== 'SoftwareMarketVersion' && 
                  datasetName !== 'SoftwareProduct' && 
                  datasetName !== 'SoftwareProductLink' && 
                  datasetName !== 'SoftwareRelease' && 
                  datasetName !== 'SoftwareReleaseLink' && 
                  datasetName !== 'SoftwareReleasePlatform' && 
                  datasetName !== 'SoftwareVersion' && 
                  datasetName !== 'Taxonomy') {
        let errorMsg = `Dataset Provided is not valid`;
        logger(errorMsg);
        return errorMsg;
      }
    } catch (error) {
      let errorMsg = `An error occured while checking the parameters`;
      logger(errorMsg);
      return errorMsg;
    }
    logger(`...... Parameters Verified`);

    // GET THE MAX SYNCRONIZED DATE FROM THE DATASETS TABLE

    logger(`...... Getting Last Synchronized Date`);
    try {
      let [rows, fields] = await sql_promise.query(`select max(synchronizedDate) as lastSynchronizedDate from ${tableName};`);

      lastSynchronizedDate = new Date(rows[0].lastSynchronizedDate);

      if (lastSynchronizedDate === null) {
        let errorMsg = 'No Synchronized Date Found';
        logger(errorMsg);
        return errorMsg;
      } 

      // write lastRecordId to file
      fs.appendFileSync(syncPath, `"Max Synchronized Date:", "${formatDateTime(lastSynchronizedDate)}"\r\n`);
    } catch (error) {
      let errorMsg = `An error occured while getting the last synchronized date`;
      logger(errorMsg, error);
      return errorMsg;
    }
    logger(`...... Last Synchronized Date Found: ${formatDateTime(lastSynchronizedDate)}`);

    // LOOP THROUGH EACH PAGE...

    do {

      // SETUP PAGE VARIABLES

      pageCounter++;
      let pageStartTime = new Date();
      let pageJson = null;

      logger(`PAGE ${pageCounter}`);

      // FETCH ACCESS TOKEN FROM API

      if (accessToken === ''){
        logger(`...... Fetching Access Token`);
        try {
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

          if (response.ok) {
            const data = await response.json();
            accessToken = String(data.access_token);
          } else {
            let errorMsg = `Fetching the access token returned a ${response.status} error`;
            logger(errorMsg, response);
            return errorMsg;
          }
        } catch (error) {
          let errorMsg = `An error occured while fetching the access token`;
          logger(errorMsg, error);
          return errorMsg;
        }
        logger(`...... Access Token Fetched`);
      } else {
        logger(`...... Access Token already exists`);
      }

      // BUILD GRAPHQL QUERY

      logger(`...... Building GraphQL Query`);
      try {
        if (lastRecordId !== null) {
          additionalQueryParameters = ` afterId: "${lastRecordId}"`;
        } else {
          additionalQueryParameters = '';
        }

        graphqlQuery = JSON.stringify({
          query: `{
            ${datasetName}(take: ${takeAmt}${additionalQueryParameters} ) {
                ${columnList}
          }
        }`,});
      } catch (error) {
        let errorMsg = `An error occurred while building the GraphQL query.`;
        logger(errorMsg, error);
        return errorMsg;
      }
      logger(`...... GraphQL query built`);
      //console.log(graphqlQuery) // DEBUGGING

      // FETCH DATA FROM API

      logger(`...... Fetching data from API`);
      let durationStartTime = new Date().getTime();

      const apiResponse = await fetch("https://beta.api.flexera.com/content/v2/orgs/35253/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + accessToken,
        },
        body: graphqlQuery,
      });

      if (apiResponse.ok) {
        pageJson = await apiResponse.json();
        
        let durationEndTime = new Date().getTime();
        logger(`...... Data fetched from API... ${formatDuration(durationStartTime, durationEndTime)}`);
      } else {
        let errorMsg = `Fetching the data from the API returned a ${apiResponse.status} error`;
        logger(errorMsg, apiResponse);
        //console.log('Error GraphQL Query: ' + graphqlQuery) // DEBUGGING
        return errorMsg;
      }

      // SETUP PAGE RECORD VARIABLES

      let pageRecordCounter = 0;
      let pageFailedRecordCounter = 0;
      let pageSyncCounter = 0;
      let consecutiveFailedRecordCounter = 0;
      let notificationCounter = 0;

      let datasetArray = pageJson.data[datasetName];


      // PROCESS ALL RECORDS ON A PAGE DATA

      logger(`...... Processing Page ${pageCounter} data`);
      try {

        if (datasetArray.length === 0) {
          logger(`...... No records found on Page ${pageCounter}`);
          isLastPage = true;
          pageCounter--;
        } else {
          logger(`...... Processing ${datasetArray.length} records on Page ${pageCounter}`);

          // LOOP THROUGH EACH RECORD IN THE PAGE...

          for (let datasetObject of datasetArray) {
            recordCounter++;
            pageRecordCounter++;
            notificationCounter++;

            lastRecordId = datasetObject.id;

            // COMPARE SYNCRONIZEDDATE (synchronizedDate)

            try {
              let recordSynchronizedDate = new Date(stringToDate(datasetObject.synchronizedDate));

              if (recordSynchronizedDate > lastSynchronizedDate){
                syncCounter++;
                pageSyncCounter++;

                let insertTxt = `"${lastRecordId}", "${datasetObject.synchronizedDate}"\r\n`;

                // write lastRecordId to file
                fs.appendFileSync(syncPath, insertTxt);
              }
            } catch (error) {
              pageFailedRecordCounter++;
              let errorMsg = `...... An error occurred while comparing the synchronizedDate (id:${lastRecordId})`;
              logger(errorMsg, error);

              // write errored lastRecordId to file
              fs.appendFileSync(errorLogPath, `"${lastRecordId}"\r\n`);
              //return errorMsg;
            }

          } // ... END LOOP THROUGH EACH RECORD IN THE PAGE
        } 
      
        logger(`...... Page ${pageCounter} data processed`);
        
        // PAGE SUMMARY

        failedRecordCounter = failedRecordCounter + pageFailedRecordCounter;

        let pageEndTime = new Date();

        let pageDuration = formatDuration(pageStartTime, pageEndTime);

        logger(`Page ${pageCounter}... Summary: ${pageSyncCounter}/${pageRecordCounter} records require re-syncing w/ ${pageFailedRecordCounter} failed verification... ${pageDuration}`);

        if (datasetArray.length < takeAmt || pageFailedRecordCounter >= 10) {
          uploadEndTime = new Date();
          logger(`...... ending Get Sync List`);
          isLastPage = true;
        }
      } catch (error) {
        let returnMsg = `An error occurred while processing the page data.`;
        logger(returnMsg, error);
        return returnMsg;
      }

      // UPLOAD SUMMARY

      try {
        if (isLastPage) {
          uploadDuration = formatDuration(uploadStartTime, uploadEndTime);

          let returnMsg = `Get ${datasetName} Sync List Summary: ${syncCounter}/${recordCounter} records (${pageCounter} pages) require re-syncing and ${failedRecordCounter} records failed to be verified... ${uploadDuration}`;
          logger(returnMsg);

          // write summary to file
          fs.appendFileSync(syncPath, returnMsg);

          return returnMsg;
        }
      } catch (error) {
        let errorMsg = `An error occurred while sending the response.`;
        logger(errorMsg, error);
        return errorMsg;
      }
    } while (!isLastPage);
    // ... END LOOP THROUGH EACH PAGE

  } catch (error) {
    let returnMsg = `An unexpected error occurred during the Get Sync List process.`;
        logger(returnMsg, error);
        return returnMsg;
  }
}