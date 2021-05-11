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


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

function googleMain(response, method, id=null) {
  // Load client secrets from a local file.
  fs.readFile('certs/gear_google_credentials.json', (err, content) => {
    if (err) {
      response = response.status(504).json({error: 'Error loading client secret file: ' + err});
      return
    };

    // Set callback based on method
    var callback_method = null;
    if (method === 'all') callback_method = allData;
    else if (method === 'single') callback_method = singleData;

    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), callback_method, response, id);
  });
};


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {response} response Response Object
 */
function authorize(credentials, callback, response, id=null) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback, response);
    oAuth2Client.setCredentials(JSON.parse(token));

    if (!id) callback(oAuth2Client, response);
    else callback(oAuth2Client, response, id);
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
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
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
function allData(auth, response) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE',
    range: 'MASTER!A:M'
  }, (err, res) => {
    if (err) {
      response = response.status(505).json({error: 'The API returned an error: ' + err});
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

      response = response.status(200).json(data);
      return data;
    } else {
      response = response.status(506).json({error: 'No data found.'});
    }
  });
}


/**
 * Retrieve only one record by ID from the following spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 * @param response Response object
 */
function singleData(auth, response, id) {
  // Grab all data first
  data = allData(auth, response);

  // Filter down to desired ID
  var singleID = data.filter(function (d) {
    return data.Id === id;
  });

  if (singleID) response = response.status(200).json(singleID);
  else response = response.status(506).json({error: 'No data found.'});
}
