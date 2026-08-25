const path = require('path');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

// Write scope is required to clear/update sheet values.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// Service account key file. The service account email must be granted edit
// access to the target spreadsheet for writes to succeed.
const KEY_FILE = path.join(__dirname, '../../certs/gear-google-auth-client-credentials.json');

/**
 * Builds an authorized service-account client. No interactive consent required.
 *
 * @returns {Promise<import('google-auth-library').JSONClient>} Authorized client.
 */
const getAuthClient = async () => {
  console.log('[sheets-writer] Authorizing with service account key at', KEY_FILE);
  const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  console.log('[sheets-writer] Service account authorized:', client.email || '(unknown email)');
  return client;
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
  console.log(`[sheets-writer] Clearing tab '${tabName}'...`);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}`,
  });

  console.log(`[sheets-writer] Writing ${values.length} rows to '${tabName}!A1'...`);
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });

  console.log(`[sheets-writer] Update complete. Updated cells:`, response.data && response.data.updatedCells);
  return response.data;
};

/**
 * Writes data starting at row 2 of a tab while preserving row 1 (a header/metadata row).
 * Clears rows 2 and below, writes the provided data rows starting at A2, and sets B1 to the
 * supplied "last updated" timestamp. Row 1 (aside from B1) is left untouched.
 *
 * @param {string} spreadsheetId - The target spreadsheet ID.
 * @param {string} tabName - The name of the tab/sheet to write to.
 * @param {Array<Array<*>>} dataRows - A 2D array of data rows (no header row included).
 * @param {string} lastUpdated - The timestamp string to write into cell B1.
 * @returns {Promise<Object>} The Google Sheets batch update response data.
 */
const writeDataPreservingFirstRow = async (spreadsheetId, tabName, dataRows, lastUpdated) => {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Clear everything from row 2 down, leaving row 1 intact.
  console.log(`[sheets-writer] Clearing '${tabName}' from row 2 down...`);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}!A2:ZZZ`,
  });

  console.log(`[sheets-writer] Updating '${tabName}!B1' timestamp and writing ${dataRows.length} data rows from A2...`);
  const response = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: `${tabName}!B1`,
          values: [[lastUpdated]],
        },
        {
          range: `${tabName}!A2`,
          values: dataRows,
        },
      ],
    },
  });

  console.log(`[sheets-writer] Update complete. Total updated cells:`, response.data && response.data.totalUpdatedCells);
  return response.data;
};

module.exports = {
  clearAndWriteTab,
  writeDataPreservingFirstRow,
};
