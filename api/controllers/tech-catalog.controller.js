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
  if(req.params.id) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareproducts.sql')).toString() + 
    ` where manufacturer = '${req.params.id}'
     order by 2 asc;`;
  
    res = ctrl.sendQuery(query, 'SoftwareProducts', res);
  }
};

exports.getSoftwareVersions = (req, res) => {
  if(req.params.id) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwareversions.sql')).toString() + 
    ` where softwareProduct = '${req.params.id}'
     order by order_ desc;`;
  
    res = ctrl.sendQuery(query, 'SoftwareVersions', res);
  }
};

exports.getSoftwareReleases = (req, res) => {
  if(req.params.id) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_tc_softwarereleases.sql')).toString() + 
    ` where softwareVersion = '${req.params.id}'
     order by 2 desc;`;
  
    res = ctrl.sendQuery(query, 'SoftwareReleases', res);
  }
};

exports.getCustomManufacturers = (req, res) => {
  var query = `SELECT id, name FROM obj_manufacturer;`;
  res = ctrl.sendQuery(query, 'CustomManufacturers', res);
}

exports.getCustomSoftwareProducts = (req, res) => {
  console.log(req.params.id);
  if(req.params.id !== 'undefined') {
    var query = `SELECT id, name FROM obj_software_product WHERE manufacturer_id = '${req.params.id}';`;
    res = ctrl.sendQuery(query, 'CustomSoftwareProducts', res);
  }
}

exports.getCustomSoftwareVersions = (req, res) => {
  if(req.params.id) {
    var query = `SELECT id, name FROM obj_software_version WHERE software_product_id = '${req.params.id}';`;
    res = ctrl.sendQuery(query, 'CustomSoftwareVersions', res);
  }
}

exports.saveCustomManufacturer = (req, res) => {
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var data = req.body;

  var query = `INSERT INTO obj_manufacturer
                (name, createdDate)
                VALUES ('${data.manufacturerName}', '${date}');`;

  console.log(query);

  res = ctrl.sendQuery(query, 'CustomManufacturer'. res);
};

exports.saveCustomSoftwareProduct = (req, res) => {
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var data = req.body;

  var query = `INSERT INTO obj_software_product
                (name, createdDate)
                VALUES ('${data.productName}', '${date}');`;
  
  console.log(query);

  res = ctrl.sendQuery(query, 'CustomSoftwareProduct'. res);
};

exports.saveCustomSoftwareVersion = (req, res) => {
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var data = req.body;

  var query = `INSERT INTO obj_software_version
                (name, createdDate)
                VALUES ('${data.versionName}', '${date}');`;
                
  console.log(query);

  res = ctrl.sendQuery(query, 'CustomSoftwareVersion'. res);
};