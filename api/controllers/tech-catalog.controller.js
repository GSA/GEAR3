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

exports.saveCustomManufacturer = (req, res) => {
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  var query = `INSERT INTO obj_manufacturer
                (name, createdDate)
                VALUES ('${req.params.name}', '${date}');`;

                console.log(query);

  res = ctrl.sendQuery(query, 'CustomManufacturer'. res);
}

exports.saveCustomSoftwareProduct = (req, res) => {
  var query = `INSERT INTO obj_software_product
                (name, createdDate)
                VALUES (${req.params.name}, ${new Date()})`;

  res = ctrl.sendQuery(query, 'CustomSoftwareProduct'. res);
}

exports.saveCustomSoftwareVersion = (req, res) => {
  var query = `INSERT INTO obj_software_version
                (name, createdDate)
                VALUES (${req.params.name}, ${new Date()})`;

  res = ctrl.sendQuery(query, 'CustomSoftwareVersion'. res);
}