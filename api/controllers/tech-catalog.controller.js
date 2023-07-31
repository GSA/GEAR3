const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.getManufacturers = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_manufacturers.sql')).toString() + ";";

  res = ctrl.sendQuery(query, 'Manufacturers', res);
};

exports.getSoftwareProduct = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareproducts.sql')).toString() + 
  ` where manufacturer = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'SoftwareProducts', res);
};

exports.getSoftwareVersion = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareversions.sql')).toString() + 
  ` where softwareProduct = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'SoftwareVersions', res);
};