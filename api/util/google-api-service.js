const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const {google} = require('googleapis');

const sheets = google.sheets('v4');

const TOKEN_PATH = "./token.json"


const getClient = async () => {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, '../../certs/gear-google-auth-client-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const projectId = await auth.getProjectId();
  console.log('Project ID:', projectId);

  const client = await auth.getClient();
  console.log('Authenticated client:', client);
  return client;
}

const authenticate = async () => {
  const client = await getClient()
  await client.authorize();
  return client.credentials;
}

exports.getToken = async () => {
  const credentials = await authenticate();
  return client.credentials.access_token;
}

exports.saveToken = async () => {
  const credentials = await authenticate();
  fs.writeFile(TOKEN_PATH, JSON.stringify(credentials), (err) => {
    if (err) {
      console.log(err);
      throw err;
    }
    console.log('Token stored to', TOKEN_PATH);
  });
}

exports.getSheetInfo = async (spreadsheetId) => {
  const authClient = await getClient();
  const request = {
    spreadsheetId: spreadsheetId,
    ranges: ["Master Junction with Business Systems!A2:B"],
    auth: authClient,
  };

  try {
    const response = await sheets.spreadsheets.get(request);
    console.log('Spreadsheet Info:', response.data);
    return data;
  } catch (err) {
    console.error('Error retrieving spreadsheet info:', err);
  }
}
