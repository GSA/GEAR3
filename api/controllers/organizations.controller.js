const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'organizations', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " WHERE org.Id = ?;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'individual organization', res, params);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND owner.Id = ? GROUP BY app.Id;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'applications for organization', res, params);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};