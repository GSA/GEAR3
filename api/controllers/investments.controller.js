const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    ";";
  
  res = ctrl.sendQuery(query, 'investments', res);
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    " AND invest.Id = ?;";  // Notice that there's already a WHERE clause in query
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'individual investment', res, params);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND app.obj_investment_Id = ? GROUP BY app.Id;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'application relations for investment', res, params);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};