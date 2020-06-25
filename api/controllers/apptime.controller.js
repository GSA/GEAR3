const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE app.Application_or_Website LIKE 'Application' AND app.Retired_Year IS NULL GROUP BY app.Id;";

  res = ctrl.sendQuery(query, 'business applications for TIME report', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    ` WHERE app.Application_or_Website LIKE 'Application' AND app.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual business application for TIME report', res);
};

module.exports = {
  findAll,
  findOne
};