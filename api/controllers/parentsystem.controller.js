const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_system.sql')).toString() +
    ";";

    res = ctrl.sendQuery(query, 'parent systems', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_system.sql')).toString() +
    " WHERE parentSys.Id = ?;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'individual parent system', res, params);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND app.obj_parent_system_Id = ? GROUP BY app.Id;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'child applications for parent system', res, params);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};