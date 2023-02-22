const ctrl      = require('./base.controller'),
      fs = require('fs'),
      path = require('path'),

      queryPath = '../queries/',
      SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A',
      RANGE = 'Master List';

// @see https://docs.google.com/spreadsheets/d/1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A

exports.findAll = (req, res) => {
  // ctrl.googleMain(res, 'all', SHEET_ID, RANGE);

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
  ` ORDER BY Record_Item_Title;`;

  res = ctrl.sendQuery(query, 'records', res);
};

exports.findOne = (req, res) => {
  // ctrl.googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
  ` WHERE Records_Id = ${req.params.id} ORDER BY Record_Item_Title;`;

  res = ctrl.sendQuery(query, 'individual record', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
  ` LEFT JOIN gear_schema.zk_systems_subsystems_records AS records_mapping ON systems.\`ex:GEAR_ID\` = records_mapping.obj_systems_subsystems_Id
    WHERE records_mapping.obj_records_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'related systems for record', res);
};

exports.updateSystems = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update record-system relationship
    var systemString = '';
    if (data.relatedSystems) {
      // Delete any references first
      systemString += `DELETE FROM zk_systems_subsystems_records WHERE obj_records_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedSystems.forEach(systemID => {
        systemString += `INSERT INTO zk_systems_subsystems_records (obj_records_Id, obj_systems_subsystems_Id) VALUES (${req.params.id}, ${systemID}); `;
      });
    };

    var query = `${systemString}`;
    
    res = ctrl.sendQuery(query, 'updating systems for record', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
    });
  }
};