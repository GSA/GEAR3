const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY org.Organization_Name;";

  res = ctrl.sendQuery(query, 'organizations', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Organization_Id = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'individual organization', res);
};

exports.findCapabilites = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_capabilities_org	  AS orgs_mapping ON cap.capability_Id = orgs_mapping.obj_capability_Id
      LEFT JOIN obj_organization	  	AS org          ON orgs_mapping.obj_organization_Id = org.Organization_Id
      
      WHERE org.Organization_Id = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'business capabilities for organization', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:Responsible_Org\` LIKE "%${ req.params.name}%" GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'systems for organization', res);
};

exports.findChildOrgs = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Parent_Id = '${req.params.id}' ORDER BY org.Organization_Name;`;

  res = ctrl.sendQuery(query, 'child organizations for organization', res);
};

exports.findBusinessSystems = (req, res) => {
  // Match systems where this org (or any child org) is the business org
  // Uses obj_org_SSO_Id FK which maps Organization_Id -> obj_systems_subsystems
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems_ext.obj_org_SSO_Id IN (
        SELECT Organization_Id FROM gear_schema.obj_organization
        WHERE Organization_Id = '${req.params.id}'
           OR Parent_Id = '${req.params.id}'
      )
      AND systems.\`ex:Status\` = 'Active'
      AND systems.\`ex:BusinessApplication\` = 'Yes'
      GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'business systems for organization', res);
};