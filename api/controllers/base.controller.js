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
  console.log('#### START - UPLOAD TECH CATALOG DATASET: ####' + datasetName);
  console.log('############################################################################################################'); 
  
  // GLOBAL VARIABLES
    // logging level.... see logger() for definitions
    const loggingLevel = 1;
    // number of records to retrieve per api call
    const takeAmt = "10000";
    // stores the flerera api access token
    let accessToken = "";
    // select column list based on dataset name
    let columnList = '';

    // insert query
    let tableName = `tech_catalog.tp_${datasetName}_tmp`;
    let insertQuery = `insert into ${tableName} (`;

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

    // display the upload start time
    console.log(`#### ${datasetName} #### Upload Start Time: ${uploadStartTime}`);

  
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
    console.log(errorMsg);

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
        // get access token from flexera api
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

          console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Access Token Received.`);
        } else {
          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR access token api call returned bad response ... ending upload. *************** \n`;
          console.log(errorMsg, response);

          return errorMsg;
        }
      } catch (error) {
        let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting access token. *************** \n`;
        console.log(errorMsg, error);

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
        console.log(errorMsg, apiResponse, `\ngraphqlQuery: ${graphqlQuery}`);

        // return the error message
        return errorMsg;
      }
    } catch (error) {
      let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR getting ${datasetName} data from api... ending upload. *************** \n `;
      console.log(errorMsg, error);

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
          // #3 select and build database insert statement
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
              //+ 'idLegacy,'	   // dt:INT
              + 'isPubliclyTraded,'	   // dt:VARCHAR
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'knownAs,'	   // dt:VARCHAR
              + 'legal,'	   // dt:VARCHAR
              + 'name,'	   // dt:VARCHAR
              + 'ownerId,'	   // dt:VARCHAR
              //+ 'ownerIdLegacy,'	   // dt:INT
              + 'phone,'	   // dt:VARCHAR
              + 'profitsDate,'	   // dt:DATETIME
              + 'profitsPerYear,'	   // dt:INT
              + 'replacementId,'	   // dt:VARCHAR
              //+ 'replacementIdLegacy,'	   // dt:INT
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
              //+ 'idLegacy,'	   // dt:INT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'name,'	   // dt:VARCHAR
              + 'replacementId,'	   // dt:VARCHAR
              //+ 'replacementIdLegacy,'	   // dt:INT
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
              + 'priorityOrder,'	   // dt:INT
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
             // + 'replacementIdLegacy,'	   // dt:INT
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
             // + 'idLegacy,'	   // dt:INT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'obsolete,'	   // dt:VARCHAR
              + 'obsoleteCalculatedCase,'	   // dt:VARCHAR
              + 'obsoleteDate,'	   // dt:TIMESTAMP
              + 'obsoleteDateCalculated,'	   // dt:TIMESTAMP
              + 'obsoleteException,'	   // dt:VARCHAR
              + 'obsoleteSupportLevel,'	   // dt:VARCHAR
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
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
             // + 'idLegacy,'	   // dt:INT
              + 'isDesupported,'	   // dt:TINYINT
              + 'isDiscontinued,'	   // dt:TINYINT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'name,'	   // dt:VARCHAR
              + 'ReleaseOrder,'	   // dt:INT
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
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
              //+ 'idLegacy,'	   // dt:INT
              + 'isDesupported,'	   // dt:TINYINT
              + 'isDiscontinued,'	   // dt:TINYINT
              + 'isFamilyInFullName,'	   // dt:TINYINT
              + 'isSuite,'	   // dt:TINYINT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'name,'	   // dt:VARCHAR
              + 'productLicensable,'	   // dt:INT
              + 'replacementId,'	   // dt:VARCHAR
              //+ 'replacementIdLegacy,'	   // dt:INT
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
             // + 'formerSoftwareProductIdLegacy,'	   // dt:INT
             // + 'idLegacy,'	   // dt:INT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'laterSoftwareProductId,'	   // dt:VARCHAR
             // + 'laterSoftwareProductIdLegacy,'	   // dt:INT
              + 'latestSoftwareProductId,'	   // dt:VARCHAR
             // + 'latestSoftwareProductIdLegacy,'	   // dt:INT
              + 'oldestSoftwareProductId,'	   // dt:VARCHAR
             // + 'oldestSoftwareProductIdLegacy,'	   // dt:INT
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
              + 'softwareCloudId,'	   // dt:VARCHAR
             // + 'softwareCloudIdLegacy,'	   // dt:INT
              + 'softwareOnPremId,'	   // dt:VARCHAR
             // + 'softwareOnPremIdLegacy,'	   // dt:INT
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
             // + 'idLegacy,'	   // dt:INT
              + 'isDesupported,'	   // dt:TINYINT
              + 'isDiscontinued,'	   // dt:TINYINT
              + 'isLicensable,'	   // dt:TINYINT
              + 'isMajor,'	   // dt:TINYINT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'majorSoftwareReleaseId,'	   // dt:VARCHAR
             // + 'majorSoftwareReleaseIdLegacy,'	   // dt:INT
              + 'name,'	   // dt:VARCHAR
              + 'patchLevel,'	   // dt:VARCHAR
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
              + 'synchronizedDate,'	   // dt:TIMESTAMP
              + 'toBeDeletedOn,'	   // dt:DATE
              + 'updatedDate,'	   // dt:TIMESTAMP
              + 'scaOpenSource,'	   // dt:VARCHAR
              + 'softwareEdition,'	   // dt:VARCHAR
              //+ 'softwareLifecycle,'	   // dt:VARCHAR
              + 'softwareProduct,'	   // dt:VARCHAR
              + 'softwareVersion,'	   // dt:VARCHAR
              break;
            case 'SoftwareReleaseLink':
              insertQuery = insertQuery
              + 'id,'	   // dt:VARCHAR
              + 'createdDate,'	   // dt:TIMESTAMP
              + 'deleteReason,'	   // dt:VARCHAR
              + 'formerSoftwareReleaseId,'	   // dt:VARCHAR
             // + 'formerSoftwareReleaseIdLegacy,'	   // dt:INT
             // + 'idLegacy,'	   // dt:INT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'laterSoftwareReleaseId,'	   // dt:VARCHAR
             // + 'laterSoftwareReleaseIdLegacy,'	   // dt:INT
              + 'latestSoftwareReleaseId,'	   // dt:VARCHAR
             // + 'latestSoftwareReleaseIdLegacy,'	   // dt:INT
              + 'oldestSoftwareReleaseId,'	   // dt:VARCHAR
             // + 'oldestSoftwareReleaseIdLegacy,'	   // dt:INT
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
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
             // + 'idLegacy,'	   // dt:INT
              + 'isDesupported,'	   // dt:TINYINT
              + 'isDiscontinued,'	   // dt:TINYINT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'platformLabel,'	   // dt:VARCHAR
              + 'platformType,'	   // dt:VARCHAR
              + 'replacementId,'	   // dt:VARCHAR
             // + 'replacementIdLegacy,'	   // dt:INT
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
              //+ 'idLegacy,'	   // dt:INT
              + 'isDesupported,'	   // dt:TINYINT
              + 'isDiscontinued,'	   // dt:TINYINT
              + 'isMajor,'	   // dt:TINYINT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'majorSoftwareVersionId,'	   // dt:VARCHAR
             // + 'majorVersionIdLegacy,'	   // dt:INT
              + 'name,'	   // dt:VARCHAR
              + 'releaseOrder,'	   // dt:INT
              + 'patchLevel,'	   // dt:VARCHAR
              + 'replacementId,'	   // dt:VARCHAR
              //+ 'replacementIdLegacy,'	   // dt:INT
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
             // + 'categoryIdLegacy,'	   // dt:INT
              + 'createdDate,'	   // dt:DATETIME
              + 'deleteReason,'	   // dt:VARCHAR
              + 'description,'	   // dt:VARCHAR
              //+ 'idLegacy,'	   // dt:INT
              + 'isToBeDeleted,'	   // dt:TINYINT
              + 'replacementId,'	   // dt:VARCHAR
              //+ 'replacementIdLegacy,'	   // dt:INT
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
          if (dateString === null) {
            return null;
          //} else if (dateString.includes("/")) {
          //  return null;
          } else {
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

        recordsToInsert.push(datasetObject);

        try {
          // ############################################################################################################
          // #4 add the column values to query
          switch (datasetName) {
            case 'Manufacturer':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.acquiredDate),	// dt:DATETIME
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
                datasetObject.priorityOrder,	// dt:INT
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
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.obsolete,	// dt:VARCHAR
                datasetObject.obsoleteCalculatedCase,	// dt:VARCHAR
                stringToDate(datasetObject.obsoleteDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.obsoleteDateCalculated),	// dt:TIMESTAMP
                datasetObject.obsoleteException,	// dt:VARCHAR
                datasetObject.obsoleteSupportLevel,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareRelease.id,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareMarketVersion':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.ReleaseOrder,	// dt:INT
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
                stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                datasetObject.softwareProduct.id,	// dt:VARCHAR
              ]);
              break;
            case 'SoftwareProduct':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.alias,	// dt:VARCHAR
                  datasetObject.application,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  datasetObject.component,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:DATETIME
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isFamilyInFullName),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isSuite),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.productLicensable,	// dt:INT
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                  stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                  datasetObject.manufacturer.id,	// dt:VARCHAR
                  datasetObject.softwareFamily.id,	// dt:VARCHAR
                  datasetObject.taxonomy.id,	// dt:VARCHAR
                ]);
              } catch (error) {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.alias,	// dt:VARCHAR
                  datasetObject.application,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  datasetObject.component,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:DATETIME
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isFamilyInFullName),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isSuite),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.productLicensable,	// dt:INT
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                  stringToDate(datasetObject.updatedDate),	// dt:DATETIME
                  datasetObject.manufacturer.id,	// dt:VARCHAR
                  datasetObject.softwareFamily,	// dt:VARCHAR
                  datasetObject.taxonomy.id,	// dt:VARCHAR
                ]);
              }
              break;
            case 'SoftwareProductLink':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  datasetObject.formerSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.formerSoftwareProductIdLegacy,	// dt:INT
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.laterSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.laterSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.latestSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.latestSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.oldestSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.oldestSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  datasetObject.softwareCloudId,	// dt:VARCHAR
                  //datasetObject.softwareCloudIdLegacy,	// dt:INT
                  datasetObject.softwareOnPremId,	// dt:VARCHAR
                  //datasetObject.softwareOnPremIdLegacy,	// dt:INT
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
                  //datasetObject.formerSoftwareProductIdLegacy,	// dt:INT
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.laterSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.laterSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.latestSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.latestSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.oldestSoftwareProductId,	// dt:VARCHAR
                  //datasetObject.oldestSoftwareProductIdLegacy,	// dt:INT
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  datasetObject.softwareCloudId,	// dt:VARCHAR
                  //datasetObject.softwareCloudIdLegacy,	// dt:INT
                  datasetObject.softwareOnPremId,	// dt:VARCHAR
                  //datasetObject.softwareOnPremIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.softwareProduct,	// dt:VARCHAR
                ]);
              }
              break;
            case 'SoftwareRelease':
              try {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.application,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isLicensable),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isMajor),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.majorSoftwareReleaseId,	// dt:VARCHAR
                  //datasetObject.majorSoftwareReleaseIdLegacy,	// dt:INT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.patchLevel,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.scaOpenSource,	// dt:VARCHAR
                  datasetObject.softwareEdition.id,	// dt:VARCHAR
                  //datasetObject.softwareLifecycle.id,	// dt:VARCHAR
                  datasetObject.softwareProduct.id,	// dt:VARCHAR
                  datasetObject.softwareVersion.id,	// dt:VARCHAR
                ]);
              } catch (error) {
                insertValuesMap = recordsToInsert.map(recordsToInsert => 
                  [datasetObject.id,	// dt:VARCHAR
                  datasetObject.application,	// dt:VARCHAR
                  datasetObject.cloud,	// dt:VARCHAR
                  stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                  datasetObject.deleteReason,	// dt:VARCHAR
                  //datasetObject.idLegacy,	// dt:INT
                  booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isLicensable),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isMajor),	// dt:TINYINT
                  booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                  datasetObject.majorSoftwareReleaseId,	// dt:VARCHAR
                  //datasetObject.majorSoftwareReleaseIdLegacy,	// dt:INT
                  datasetObject.name,	// dt:VARCHAR
                  datasetObject.patchLevel,	// dt:VARCHAR
                  datasetObject.replacementId,	// dt:VARCHAR
                  //datasetObject.replacementIdLegacy,	// dt:INT
                  stringToDate(datasetObject.synchronizedDate),	// dt:TIMESTAMP
                  stringToDate(datasetObject.toBeDeletedOn),	// dt:DATE
                  stringToDate(datasetObject.updatedDate),	// dt:TIMESTAMP
                  datasetObject.scaOpenSource,	// dt:VARCHAR
                  datasetObject.softwareEdition,	// dt:VARCHAR
                  //datasetObject.softwareLifecycle.id,	// dt:VARCHAR
                  datasetObject.softwareProduct.id,	// dt:VARCHAR
                  datasetObject.softwareVersion.id,	// dt:VARCHAR
                ]);
              }
              break;
            case 'SoftwareReleaseLink':
              insertValuesMap = recordsToInsert.map(recordsToInsert => 
                [datasetObject.id,	// dt:VARCHAR
                stringToDate(datasetObject.createdDate),	// dt:TIMESTAMP
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.formerSoftwareReleaseId,	// dt:VARCHAR
                //datasetObject.formerSoftwareReleaseIdLegacy,	// dt:INT
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.laterSoftwareReleaseId,	// dt:VARCHAR
                //datasetObject.laterSoftwareReleaseIdLegacy,	// dt:INT
                datasetObject.latestSoftwareReleaseId,	// dt:VARCHAR
                //datasetObject.latestSoftwareReleaseIdLegacy,	// dt:INT
                datasetObject.oldestSoftwareReleaseId,	// dt:VARCHAR
                //datasetObject.oldestSoftwareReleaseIdLegacy,	// dt:INT
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
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
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isDesupported),	// dt:TINYINT
                booleanToTinyint(datasetObject.isDiscontinued),	// dt:TINYINT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.platformLabel,	// dt:VARCHAR
                datasetObject.platformType,	// dt:VARCHAR
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
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
                //datasetObject.idLegacy,	// dt:INT
                datasetObject.manufacturerId,	// dt:VARCHAR
                //datasetObject.manufacturerIdLegacy,	// dt:INT
                datasetObject.name,	// dt:VARCHAR
                datasetObject.stageOrder,	// dt:INT
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
                  datasetObject.releaseOrder,	// dt:INT
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
                  datasetObject.releaseOrder,	// dt:INT
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
                //datasetObject.categoryIdLegacy,	// dt:INT
                stringToDate(datasetObject.createdDate),	// dt:DATETIME
                datasetObject.deleteReason,	// dt:VARCHAR
                datasetObject.description,	// dt:VARCHAR
                //datasetObject.idLegacy,	// dt:INT
                booleanToTinyint(datasetObject.isToBeDeleted),	// dt:TINYINT
                datasetObject.replacementId,	// dt:VARCHAR
                //datasetObject.replacementIdLegacy,	// dt:INT
                datasetObject.softwareOrHardware,	// dt:VARCHAR
                datasetObject.subcategory,	// dt:VARCHAR
                stringToDate(datasetObject.synchronizedDate),	// dt:DATETIME
                stringToDate(datasetObject.toBeDeletedOn),	// dt:DATETIME
                stringToDate(datasetObject.updatedDate),	// dt:DATETIME
              ]);
              break;
          }
        } catch (error) {
          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### *************** ERROR: Column Values Error ***************  \n${error} \n`;

          console.log(errorMsg);

          // stop the upload and return the error message
          return errorMsg;
        }
        // ############################################################################################################

        try {
          // execute the insert statement in db
          //let responseDB = await sql_promise.query(insertStatement);
          let responseDB = await sql_promise.query(insertQuery, [insertValuesMap]);

          // reset failed record counter
          consecutiveFailedRecordCounter = 0;

          // get value for affectedRows
          //let affectedRows = responseDB[0].affectedRows;
        } catch (error) {
          // increment failed record counter
          pageFailedRecordCounter++;
          consecutiveFailedRecordCounter++;

          let errorMsg = `#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### *************** ERROR executing insert into table ${tableName} ***************  \n`;

          console.log(`#### ${datasetName} #### Page: ${pageCounter} #### Record: ${pageRecordCounter} #### ...... ERROR inserting record of ${datasetArray.length} into ${tableName}.`); // Debug

          // log the error to file
          let path = 'tech_catalog_data/logs/errors_' + datasetName + '_' + String(uploadStartTime).replace(/:/g, '_').replace(/ /g, '_') + '.log';
          fs.appendFileSync(path, errorMsg + error + '\n\n');

          // stop the upload and return the error message
          if (consecutiveFailedRecordCounter === 25) {
            errorMsg = errorMsg + `\n#### ${datasetName} #### Page: ${pageCounter} #### *************** ERROR: 25 consecutive failed records, stopping upload. *************** \n`;
            console.log(errorMsg);

            return errorMsg;
          }
          //return errorMsg;
        }

        if (notificationCounter === 1000) {
          let pageCurrentTime = new Date();
          let pageCurrentDuration = (pageCurrentTime - pageStartTime) / 1000 / 60;
          console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... ${pageRecordCounter} of ${datasetArray.length} records process with ${pageFailedRecordCounter} error(s) at ${pageCurrentTime}.(Tot.Duration: ${pageCurrentDuration} minutes)`); // Debug
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
    let pageDuration = (pageEndTime - pageStartTime);
    //console.log(`...... Page ${pageCounter} Duration: ${pageDuration} seconds`);

    // calculate page duration in minutes
    let pageDurationMinutes = pageDuration / 1000 / 60;
    console.log(`#### ${datasetName} #### Page: ${pageCounter} #### ...... Page Duration: ${pageDurationMinutes} minutes`);

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
        let uploadDuration = (uploadEndTime - uploadStartTime) / 1000 / 60;

        console.log(`#### ${datasetName} #### ...... uploadDuration: ' ${uploadDuration} minutes`);

        console.log(`#### ${datasetName} #### ...... totalPages: ' ${pageCounter}`);
        console.log(`#### ${datasetName} #### ...... totalRecords: ' ${recordCounter}`);
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
      console.log(errorMsg, error);  // Debug

      // stop the upload and return the error message
      return errorMsg;
    }
  } while (!isLastPage);
}