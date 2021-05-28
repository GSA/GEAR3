const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY Name;";

  res = ctrl.sendQuery_cowboy(query, 'organizations', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Id = ${req.params.id};`;

  res = ctrl.sendQuery_cowboy(query, 'individual organization', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:Responsible_Org\` LIKE '%${req.params.name}%' GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery_cowboy(query, 'systems for organization', res);
};