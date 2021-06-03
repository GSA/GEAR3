const ctrl      = require('./base.controller'),
      fs = require('fs'),
      path = require('path'),

      queryPath = '../queries/',
      SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A',
      RANGE = 'Master List';

// @see https://docs.google.com/spreadsheets/d/1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A

exports.findAll = (req, res) => {
  ctrl.googleMain(res, 'all', SHEET_ID, RANGE);
};

exports.findOne = (req, res) => {
  ctrl.googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
  ` LEFT JOIN gear_ods.zk_systems_subsystems_records AS records_mapping ON systems.\`ex:GEAR_ID\` = records_mapping.obj_systems_subsystems_Id
    WHERE records_mapping.obj_records_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery_cowboy(query, 'related systems for record', res);
};
