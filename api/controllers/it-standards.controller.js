const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_technologies.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE 'Software'
      AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
      GROUP BY tech.Id;`;

  res = ctrl.sendQuery(query, 'IT Standards', res);
};

function findOne(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_technologies.sql')).toString() +
    ` WHERE tech.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual IT Standard', res);
};

function findApplications(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND tech.Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'applications using IT Standard', res);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};