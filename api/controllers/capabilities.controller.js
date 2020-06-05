const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'business capabilities', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    " WHERE cap.Id = ?;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'individual business capability', res, params);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND cap.Id = ? GROUP BY app.Id;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'supporting applications for capability', res, params);
};

function findSSO (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities_by_org.sql')).toString();
  var params = ['%' + req.params.name + '%'];

  res = ctrl.sendQuery(query, 'capabilities for specified SSO', res, params);
};

module.exports = {
  findAll,
  findOne,
  findApplications,
  findSSO
};