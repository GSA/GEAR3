const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'record schedules', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_records.sql')).toString() +
    ` WHERE items.Id = ${req.params.id};`;
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'record schedule', res);
};