const ctrl = require('./base.controller'),
  fs = require('fs'),
  path = require('path'),

  queryPath = '../queries/',
  //SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A', // FOR PRODUCTION
  SHEET_ID = '1ytXm7qf96aP7XS6zA8nu7wLQpRGshc4IOPp8orv7bSI', // FOR TESTING
  RANGE = 'Master Junction with Business Systems!A2:B';

// @see https://docs.google.com/spreadsheets/d/1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A

const cron = require('node-cron');

// CRON JOB: Google Sheets API - Update All Related Records (runs every weekday at 2:00 AM)
cron.schedule('0 5 * * 1-5', () => { //PRODUCTION
  //cron.schedule('*/2 * * * 1-5', () => { //DEBUGGING
  const jobName = `CRON JOB: Update All Related Records`;
  const jobUser = `GearCronJ`;
  let status = 'executed';

  try {
    let res = {};
    
    // log start of job
    console.log(jobName + ' - ' + status);

    // log start of job to db
    exports.logEvent({ body : { message: jobName + ' - ' + status, user: jobUser, } }, res);
    
    // run refreshAllSystems
    ctrl.googleMain(res, 'refresh', SHEET_ID, RANGE, jobUser);
  } catch (error) {
    // log any errors
    status = `error occurred while running:  \n` + error;
    console.log(jobName + ' - ' + status);
  }
});
  

// Create and Save a new Record
// This can be called in the browser using the following URL: http://localhost:3000/api/records
exports.findAll = (req, res) => {

  //ctrl.googleMain(res, 'all', SHEET_ID, RANGE);

  // Get all records from database and return them to the client (res)
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ` ORDER BY Record_Item_Title;`;

  // Return the results of the query
  res = ctrl.sendQuery(query, 'records', res);
};


// Create and Save a new Record (from Google Sheet) - NOT USED
// This can be called in the browser using the following URL: http://localhost:3000/api/records with a given ID (e.g. 1)
// An example of the request url is: http://localhost:3000/api/records/1
exports.findOne = (req, res) => {
  //ctrl.googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ` WHERE Records_Id = ${req.params.id} ORDER BY Record_Item_Title;`;

  res = ctrl.sendQuery(query, 'individual record', res);
};


// Get all systems related to a record ID and return them to the client (res)
exports.findSystems = (req, res) => {

  // Generate query to get all systems related to a record ID and return them to the client (res)
  // The join is necessary to get the system ID from the mapping table
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_records AS records_mapping ON systems.\`ex:GEAR_ID\` = records_mapping.obj_systems_subsystems_Id
    WHERE records_mapping.obj_records_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  // Get all systems related to a record ID and return them to the client (res)
  res = ctrl.sendQuery(query, 'related systems for record', res);
};

exports.updateSystems = (req, res) => {
  ctrl.getApiToken (req, res)
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

    //res = ctrl.sendQuery(query, 'updating systems for record', res);

  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
      });
    }
  });
};

// This function is called by the api to update all the records using a Google Sheet
exports.refreshAllSystems = (req, res) => {
  ctrl.getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING
    var data = req.body;
  
    console.log("refreshAllSystems")
  
  // if (req.headers.authorization) {
    // 'refresh' is used to set the callback_method = "refresh"
    ctrl.googleMain(res, 'refresh', SHEET_ID, RANGE, req.headers.requester);
  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING
    res.status(502).json({
      message: "No authorization token present."
      });
    }
  });
};

// this function is called by the api to log an event to the database
exports.logEvent = (req, res) => {
  //console.log("logEvent")
  var data = req.body;

  res = ctrl.sendLogQuery(data.message, data.user, data.message, res);
};
