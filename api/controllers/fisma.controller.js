const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
    " WHERE archer.`ex:Inactive_Date` IS NULL GROUP BY archer.`ex:GEAR_ID`;";
  
  res = ctrl.sendQuery(query, 'FISMA Systems', res);
};

function findOne (req, res, next) {
  // Move to next function for retired applications
  if (req.params.id === 'retired') {
    next();
  } else {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
      " WHERE obj_fisma_archer.`ex:GEAR_ID` = ? GROUP BY archer.`ex:GEAR_ID`;"; 
    var params = [req.params.id];

    res = ctrl.sendQuery(query, 'individual FISMA System', res, params);
  }
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND app.obj_fisma_Id = ? GROUP BY app.Id;";
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'certified applications for FISMA System', res, params);
};

function findRetired (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
    " WHERE archer.`ex:Inactive_Date` IS NOT NULL GROUP BY archer.`ex:GEAR_ID`;";

  res = ctrl.sendQuery(query, 'retired FISMA Systems', res);
};

module.exports = {
  findAll,
  findOne,
  findApplications,
  findRetired
};