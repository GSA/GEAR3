import { GoogleAuth } from 'google-auth-library';
import { join } from 'path';
import { writeFile } from 'fs';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

const TOKEN_PATH = "./token.json"


const getClient = async () => {
  const auth = new GoogleAuth({
    keyFile: join(__dirname, '../../certs/gear-google-auth-client-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const projectId = await auth.getProjectId();
  //console.log('Project ID:', projectId);

  const client = await auth.getClient();
  //console.log('Authenticated client:', client);
  return client;
}

const authenticate = async () => {
  const client = await getClient()
  await client.authorize();
  return client.credentials;
}

export async function getToken() {
  const credentials = await authenticate();
  return client.credentials.access_token;
}

export async function saveToken() {
  const credentials = await authenticate();
  writeFile(TOKEN_PATH, JSON.stringify(credentials), (err) => {
    if (err) {
      console.log(err);
      throw err;
    }
    console.log('Token stored to', TOKEN_PATH);
  });
}

export async function getSheetInfo(spreadsheetId, dataRange) {
  const authClient = await getClient();
  const request = {
    spreadsheetId: spreadsheetId,
    ranges: [dataRange],
    auth: authClient,
  };

  try {
    const response = await sheets.spreadsheets.get(request);
    //console.log('Spreadsheet Info:', response.data);
    return response.data;
  } catch (err) {
    console.error('Error retrieving spreadsheet info:', err);
  }
}
