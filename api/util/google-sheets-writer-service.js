const path = require('path');
const { promises: fs } = require('fs');
const { google } = require('googleapis');

// Write scope is required to clear/update sheet values.
// If this scope changes, the stored token must be re-authorized.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, '../../certs/gear_google_credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

/**
 * Builds an authorized OAuth2 client using the stored credentials and token.
 *
 * @returns {Promise<import('google-auth-library').OAuth2Client>} Authorized client.
 */
const getAuthClient = async () => {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const { client_id, client_secret } = JSON.parse(content).installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, process.env.GOOGLE_AUTH_REDIRECT);

  const token = await fs.readFile(TOKEN_PATH, 'utf8');
  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
};

/**
 * Clears the given range on a tab, then writes the provided rows starting at the top of that tab.
 *
 * @param {string} spreadsheetId - The target spreadsheet ID.
 * @param {string} tabName - The name of the tab/sheet to write to (e.g. "TEST").
 * @param {Array<Array<*>>} values - A 2D array of rows (first row is treated as headers).
 * @returns {Promise<Object>} The Google Sheets update response data.
 */
const clearAndWriteTab = async (spreadsheetId, tabName, values) => {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Clear the entire tab first so stale rows are removed.
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}`,
  });

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });

  return response.data;
};

module.exports = {
  clearAndWriteTab,
};
