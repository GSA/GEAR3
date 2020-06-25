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
    ` AND invest.Id = ${req.params.id};`;  // Notice that there's already a WHERE clause in query

  res = ctrl.sendQuery(query, 'individual investment', res);
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND app.obj_investment_Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'application relations for investment', res);
};

module.exports = {
  findAll,
  findOne,
  findApplications
};