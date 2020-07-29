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
    ` WHERE cap.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual business capability', res);
};

exports.findApplications = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND cap.Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'supporting applications for capability', res);
};

exports.findSSO = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities_by_org.sql')).toString() +
    ` WHERE org.Display_name LIKE '%${req.params.name}%' AND cap.ReferenceNumber IS NOT NULL AND appStatus.Keyname <> 'Retired'
    GROUP BY cap.Id;`;

  res = ctrl.sendQuery(query, 'capabilities for specified SSO', res);
};