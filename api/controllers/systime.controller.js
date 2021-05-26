const ctrl      = require('./base.controller'),

      path      = require('path'),
      fs        = require('fs'),
      readline  = require('readline'),
      {google} = require('googleapis');

exports.findAll = (req, res) => {
  googleMain(res, 'all');
};

exports.findOne = (req, res) => {
  googleMain(res, 'single', req.params.id);
};

// TODO: This should be refactored to be less redundant

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const SHEET_ID = '1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE';

function googleMain(response, method, key = null) {
  // Load client secrets from a local file.
  fs.readFile('certs/gear_google_credentials.json', (err, content) => {
    if (err) {
      response = response.status(504).json({ error: 'Error loading client secret file: ' + err });
      return
    };

    // Set callback based on method
    var callback_method = null;
    if (method === 'all') callback_method = retrieveAll;
    else if (method === 'single') callback_method = single;

    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), callback_method, response, key);
  });
};


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {response} response Response Object
 */
function authorize(credentials, callback, response, key = null) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback, response);
    oAuth2Client.setCredentials(JSON.parse(token));

    if (!key) callback(oAuth2Client, response);
    else callback(oAuth2Client, response, key);
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback, response) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return response = response.status(505).json({ error: 'Error while trying to retrieve access token: ' + err });
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return response = response.status(505).json({ error: 'Error while saving access token: ' + err });
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, response);
    });
  });
}


/**
 * Retrieves all data within the specified spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function retrieveAll(auth, response) {
  const sheets = google.sheets({ version: 'v4', auth });

  sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'MASTER!A:M'
  }, (err, res) => {
    if (err) {
      sendResponse(response, { error: 'The API returned an error: ' + err });
      return;
    };

    const rows = res.data.values;
    if (rows.length) {
      const headers = rows[0];
      var data = [];

      // Structure rows into an object
      for (i = 1; i < rows.length; i++) {
        row = {};
        for (j = 0; j < headers.length; j++) {
          row[headers[j]] = rows[i][j];
        };
        data.push(row);
      };

      sendResponse(response, data);
    }
  });
}


/**
 * Retrieve only one record by ID from the following spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function single(auth, response, key) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Grab all data first
  sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'MASTER!A:M'
  }, (err, res) => {
    if (err) {
      sendResponse(response, { error: 'The API returned an error: ' + err });
      return;
    };

    const rows = res.data.values;
    if (rows.length) {
      const headers = rows[0];
      var data = [];

      // Structure rows into an object
      for (i = 1; i < rows.length; i++) {
        row = {};
        for (j = 0; j < headers.length; j++) {
          row[headers[j]] = rows[i][j];
        };
        data.push(row);
      };

      // Send error if no data
      if (!data) {
        sendResponse(response, null);
        return;
      }

      // Filter down to desired ID
      var singleID = data.filter(function (d) {
        return d.Id === key;
      });

      sendResponse(response, singleID);
    }
  });
}

function sendResponse(response, data) {
  if (data) response = response.status(200).json(data);
  else if (data === null) response = response.status(506).json({ error: 'No data found.' });
  else if (data.error) response = response.status(507).json({ error: 'The API returned an error: ' + err });
}