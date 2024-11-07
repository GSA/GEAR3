import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery, getApiToken, googleMain, sendLogQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';
const SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A';
const RANGE = 'Master Junction with Business Systems!A2:B'; // FOR PRODUCTION

// @see https://docs.google.com/spreadsheets/d/1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A
  

// Create and Save a new Record
// This can be called in the browser using the following URL: http://localhost:3000/api/records
export function findAll(req, res) {

  //googleMain(res, 'all', SHEET_ID, RANGE);

  // Get all records from database and return them to the client (res)
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ` ORDER BY Record_Item_Title;`;

  // Return the results of the query
  res = sendQuery(query, 'records', res);
}


// Create and Save a new Record (from Google Sheet) - NOT USED
// This can be called in the browser using the following URL: http://localhost:3000/api/records with a given ID (e.g. 1)
// An example of the request url is: http://localhost:3000/api/records/1
export function findOne(req, res) {
  //googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);

  var query = readFileSync(join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ` WHERE Records_Id = ${req.params.id} ORDER BY Record_Item_Title;`;

  res = sendQuery(query, 'individual record', res);
}


// Get all systems related to a record ID and return them to the client (res)
export function findSystems(req, res) {

  // Generate query to get all systems related to a record ID and return them to the client (res)
  // The join is necessary to get the system ID from the mapping table
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_records AS records_mapping ON systems.\`ex:GEAR_ID\` = records_mapping.obj_systems_subsystems_Id
    WHERE records_mapping.obj_records_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  // Get all systems related to a record ID and return them to the client (res)
  res = sendQuery(query, 'related systems for record', res);
}

export function updateSystems(req, res) {
  getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING
    var data = req.body;

    // Create string to update record-system relationship
    var systemString = '';
    if (data.relatedSystems) {
      // Delete any references first
      systemString += `DELETE FROM zk_systems_subsystems_records WHERE obj_records_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedSystems.forEach(systemID => {
        systemID = systemID
        systemString += `INSERT INTO zk_systems_subsystems_records (obj_records_Id, obj_systems_subsystems_Id) VALUES (${req.params.id}, ${systemID}); `;
      });
    };

    var query = `${systemString}`;

    //res = sendQuery(query, 'updating systems for record', res);

  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
      });
    }
  });
}

// This function is called by the api to update all the records using a Google Sheet
export async function refreshAllSystems (req, res) {
  try {
    const response = await getApiToken(req, res);
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING
    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING

      console.log("refreshAllSystems")
      // 'refresh' is used to set the callback_method = "refresh"
      await googleMain(res, 'refresh', SHEET_ID, RANGE, req.headers.requester);
    } else {
      console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING
      res.status(502).json({
        message: "No authorization token present."
      });
    }
  } catch (error) {
    msgLog('*** API Security Testing - API Auth Validation: FAILED', null); //DEBUGGING
    msgLog(error.stack, null); //DEBUGGING
    res.status(502).json({
      message: "No authorization token present."
    });
  }
}

// this function is called by the api to log an event to the database
export function logEvent(req, res) {
  //console.log("logEvent")
  var data = req.body;

  res = sendLogQuery(data.message, data.user, data.message, res);
}
