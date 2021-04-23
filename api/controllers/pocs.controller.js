const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " ORDER BY poc.LastName;";

  res = ctrl.sendQuery_cowboy(query, 'Points of Contact', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ` WHERE poc.SamAccountName = '${req.params.samName}';`;

  res = ctrl.sendQuery_cowboy(query, 'individual POC', res);
};

// exports.findRissos = (req, res) => {
//   var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
//     " WHERE poc.RISSO <> 24;";

//   res = ctrl.sendQuery_cowboy(query, 'RISSO POCs', res);
// };