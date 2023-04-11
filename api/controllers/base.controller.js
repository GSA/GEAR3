const sql = require("../db.js").connection,
  // sql_cowboy  = require("../db.js").connection_cowboy,
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

// exports.sendQuery_cowboy = (query, msg, response) => {
//   return buildQuery(sql_cowboy, query, msg, response);
// };

/**
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
      console.log("Query Response: ", response);  // Debug
      response.status(200).json(data);
    }
  });

  return response;
}

exports.emptyTextFieldHandler = (content) => {
  if (!content) return "NULL";
  else return `'${content}'`;
};

/* **** Google API ****
All this needs to be refactored as to not be so redundant*/
exports.googleMain = (response, method, sheetID, dataRange, key = null) => {
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
  key = null
) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    oAuth2Client.setCredentials(JSON.parse(token));
    oAuth2Client.on("tokens", (tokens) => {
      if (tokens.refresh_token) {
        oAuth2Client.setCredentials({
          refresh_token: tokens.refresh_token,
        });
      }
    });

    if (!key) callback(oAuth2Client, response, sheetID, dataRange);
    else callback(oAuth2Client, response, sheetID, dataRange, key);
  });
}

/**
 * Retrieves all data within the specified spreadsheet:
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function retrieveAll(auth, response, sheetID, dataRange) {
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
function refresh(auth, response, sheetID, dataRange) {

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

      // Logs the records to the console.
      // for (let record of m.keys()) {
      //   console.log(`${record}:`, m.get(record))
      //}


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

      // Send the DML statements to the database
      console.log("Sending DML Statements: " + dmlStatementCounter)
      buildQuery(sql, `${systemString}`, "Sending refresh all query using Google Sheet", res)
      // Send the response
      response.status(200).json({
        "Total executions": dmlStatementCounter,
        "Total inserts": insertCounter,
        "Total rows": rowCounter,
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
function single(auth, response, sheetID, dataRange, key) {
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

function sendResponse(response, data) {
  if (data) response = response.status(200).json(data);
  else if (data === null)
    response = response.status(506).json({ error: "No data found." });
  else if (data.error)
    response = response
      .status(507)
      .json({ error: "The API returned an error: " + err });
}

