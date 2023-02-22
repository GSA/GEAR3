const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " ORDER BY poc.LastName;";

  res = ctrl.sendQuery(query, 'Points of Contact', res); //removed sendQuery_cowboy reference
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ` WHERE poc.SamAccountName = '${req.params.samName}';`;

  res = ctrl.sendQuery(query, 'individual POC', res); //removed sendQuery_cowboy reference
};