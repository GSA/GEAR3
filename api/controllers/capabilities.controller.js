const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'business capabilities', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` WHERE cap.capability_Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual business capability', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN gear_ods.zk_systems_subsystems_capabilities AS cap_mappings ON systems.\`ex:GEAR_ID\` = cap_mappings.obj_systems_subsystems_Id
      LEFT JOIN gear_ods.obj_capability AS cap ON cap_mappings.obj_capability_Id = cap.capability_Id
    
      WHERE cap.capability_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'supporting systems for capability', res);
};

// exports.findSSO = (req, res) => {
//   var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities_by_org.sql')).toString() +
//     ` WHERE org.Display_name LIKE '%${req.params.name}%' AND cap.ReferenceNumber IS NOT NULL AND appStatus.Keyname <> 'Retired'
//     GROUP BY cap.capability_Id;`;

//   res = ctrl.sendQuery(query, 'capabilities for specified SSO', res);
// };