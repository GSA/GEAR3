const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.getManufacturers = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_manufacturers.sql')).toString() +
  ` order by name asc;`;

  res = ctrl.sendQuery(query, 'Manufacturers', res);
};

exports.getSoftwareProducts = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareproducts.sql')).toString() + 
  ` where manufacturer = '${req.params.id}'
   order by 2 asc;`;

  res = ctrl.sendQuery(query, 'SoftwareProducts', res);
};

exports.getSoftwareVersions = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareversions.sql')).toString() + 
  ` where softwareProduct = '${req.params.id}'
   order by order_ desc;`;

  res = ctrl.sendQuery(query, 'SoftwareVersions', res);
};

exports.getSoftwareReleases = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwarereleases.sql')).toString() + 
  ` where softwareVersion = '${req.params.id}'
   order by 2 desc;`;

  res = ctrl.sendQuery(query, 'SoftwareReleases', res);
};

exports.getTaxonomyChart = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_taxonomy_chart.sql')).toString() +
  ` order by child desc;`;

  res = ctrl.sendQuery(query, 'TaxonomyChart', res);
};