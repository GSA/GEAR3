const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE org.Keyname <> 'External' AND obj_application_status.Keyname <> 'Retired' GROUP BY app.Id;";

  res = ctrl.sendQuery(query, 'business applications', res);
};

function findOne (req, res, next) {
  // Move to next function for retired applications
  if (req.params.id === 'applications_retired') {
    next();
  } else {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
      " WHERE app.Id = ?;";
    var params = [req.params.id];

    res = ctrl.sendQuery(query, 'individual business application', res, params);
  }
};

function findAllRetired (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE app.Application_or_Website LIKE 'Application' AND app.Retired_Year IS NOT NULL GROUP BY app.Id;";

  res = ctrl.sendQuery(query, 'retired business applications', res);
};

function findCapabilities (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_app_capabilities           ON cap.Id = zk_app_capabilities.obj_capability_Id
    LEFT JOIN obj_application       AS app    ON zk_app_capabilities.obj_application_Id = app.Id
    WHERE app.Id = ?;`;

  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'related capabilities for application', res, params);
};

function findTechnologies (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_technologies.sql')).toString();
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'related technologies for application', res, params);
};

module.exports = {
  findAll,
  findOne,
  findAllRetired,
  findCapabilities,
  findTechnologies
};