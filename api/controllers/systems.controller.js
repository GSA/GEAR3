const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    " GROUP BY systems.\`ex:GEAR_ID\`;";

  res = ctrl.sendQuery_cowboy(query, 'Systems and subsystems', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:GEAR_ID\` = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery_cowboy(query, 'individual System/Subsystem', res);
};

// exports.findCapabilities = (req, res) => {
//   var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
//     ` LEFT JOIN zk_app_capabilities           ON cap.Id = zk_app_capabilities.obj_capability_Id
//     LEFT JOIN obj_application       AS app    ON zk_app_capabilities.obj_application_Id = app.Id
//     WHERE app.Id = ${req.params.id};`;

//   res = ctrl.sendQuery_cowboy(query, 'related capabilities for system', res);
// };

exports.findTechnologies = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE '%Software%'
        AND systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY tech.Id;`;

  res = ctrl.sendQuery_cowboy(query, 'related technologies for system', res);
};