const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_systems.sql')).toString() +
    ";";

    res = ctrl.sendQuery(query, 'parent systems', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_systems.sql')).toString() +
    ` AND parentSys.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual parent system', res);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND app.obj_parent_system_Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'child applications for parent system', res);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};