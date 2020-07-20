const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE org.Keyname <> 'External' AND obj_application_status.Keyname <> 'Retired' GROUP BY app.Id ORDER BY app.Keyname;";

  res = ctrl.sendQuery(query, 'business applications', res);
};

function findOne(req, res, next) {
  // Move to next function for retired applications
  if (req.params.id === 'applications_retired') {
    next();
  } else {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
      ` WHERE app.Id = ${req.params.id};`;
    var params = [req.params.id];

    res = ctrl.sendQuery(query, 'individual business application', res);
  }
};

function findAllRetired(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE app.Application_or_Website LIKE 'Application' AND app.Retired_Year IS NOT NULL GROUP BY app.Id;";

  res = ctrl.sendQuery(query, 'retired business applications', res);
};

function findCapabilities(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_app_capabilities           ON cap.Id = zk_app_capabilities.obj_capability_Id
    LEFT JOIN obj_application       AS app    ON zk_app_capabilities.obj_application_Id = app.Id
    WHERE app.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related capabilities for application', res);
};

function findTechnologies(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE '%Software%'
      AND obj_technology_status.Keyname NOT LIKE 'Sunsetting'
      AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
      AND app.Id = ${req.params.id}

    GROUP BY tech.Id;`;

  res = ctrl.sendQuery(query, 'related technologies for application', res);
};

function findInterfaces(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_interfaces.sql')).toString() +
    ` WHERE (inter.obj_application_Id = ${req.params.id} or inter.obj_application_Id1 = ${req.params.id}) AND appstat1.Keyname <> 'Retired'  AND appstat2.Keyname <> 'Retired';`;

  res = ctrl.sendQuery(query, 'related technologies for application', res);
};

module.exports = {
  findAll,
  findOne,
  findAllRetired,
  findCapabilities,
  findTechnologies,
  findInterfaces
};