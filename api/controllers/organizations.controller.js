const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY Name;";

  res = ctrl.sendQuery_cowboy(query, 'organizations', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Id = ${req.params.id};`;

  res = ctrl.sendQuery_cowboy(query, 'individual organization', res);
};

exports.findApplications = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND owner.Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery_cowboy(query, 'applications for organization', res);
};