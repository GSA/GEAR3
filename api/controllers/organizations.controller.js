const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY Name;";

  res = ctrl.sendQuery(query, 'organizations', res);
};

function findOne(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual organization', res);
};

function findApplications(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND owner.Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'applications for organization', res);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};