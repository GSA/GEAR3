const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " ORDER BY poc.Keyname;";

  res = ctrl.sendQuery(query, 'Points of Contact', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ` WHERE poc.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual POC', res);
};

exports.findRissos = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " WHERE poc.RISSO <> 24;";

  res = ctrl.sendQuery(query, 'RISSO POCs', res);
};