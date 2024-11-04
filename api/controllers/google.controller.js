import { google } from 'googleapis';
import { readFile, writeFile } from 'fs';


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

google.options({
  // All requests made with this object will use these settings unless overridden.
  timeout: 30_000
});

export function auth(req, res, next) {
  var credentials = {}
  // Load client secrets from a local file.
  readFile('certs/gear_google_credentials.json', (err, content) => {
    if (err) {
      res = res.status(504).json({ error: 'Error loading client secret file: ' + err });
      return
    };

    credentials = JSON.parse(content).installed;

    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, process.env.GOOGLE_AUTH_REDIRECT);


    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES
    });

    res.redirect(authUrl);
  });
}

export function saveToken(req, res, next) {
  console.log("saveToken called!!")
  let code = req.query.code;
  var credentials = {};

  // Load client secrets from a local file.
  readFile('certs/gear_google_credentials.json', (err, content) => {
    if (err) {
      res = res.status(504).json({ error: 'Error loading client secret file: ' + err });
      return
    };

    credentials = JSON.parse(content).installed;

    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, process.env.GOOGLE_AUTH_REDIRECT);

    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error while trying to retrieve access token: ", err );
        return res = res.status(200).json({ error: 'Error while trying to retrieve access token: ' + err });
      };
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return res = res.status(505).json({ error: 'Error while saving access token: ' + err });
        console.log('Token stored to', TOKEN_PATH);
        res = res.status(200).json({ msg: "Token successfully retrieved and stored to " + TOKEN_PATH});
      });
    });
  });

}
