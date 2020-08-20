const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_dataflow.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'interfaces', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_dataflow.sql')).toString() +
    ` WHERE inter.obj_application_Id = ${req.params.id} OR inter.obj_application_Id1 = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'interface', res);
};