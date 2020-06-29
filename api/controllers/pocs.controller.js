const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'Points of Contact', res);
};

function findOne(req, res, next) {
  // Move to next function for retired applications
  if (req.params.id === 'risso') {
    next();
  } else {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
      ` WHERE poc.Id = ${req.params.id};`;

    res = ctrl.sendQuery(query, 'individual POC', res);
  }
};

function findRissos(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " WHERE poc.RISSO <> 24;";

  res = ctrl.sendQuery(query, 'RISSO POCs', res);
};

module.exports = {
  findAll,
  findOne,
  findRissos
};