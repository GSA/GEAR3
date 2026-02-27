const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_TRM.sql')).toString() +
  ` ORDER BY Technology_Category_Id ASC;`;
  res = ctrl.sendQuery(query, 'TRM', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_TRM.sql')).toString() + 
  ` WHERE Technology_Category_Id = ${req.params.id};`;
  res = ctrl.sendQuery(query, 'TRM', res);
};

exports.relatedITStandards = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_TRM_related_it_standards.sql')).toString() + 
  ` WHERE ttrm.obj_TRM_Id = ${req.params.id}
  GROUP BY tech.Id;`;
  res = ctrl.sendQuery(query, 'TRM', res);
};