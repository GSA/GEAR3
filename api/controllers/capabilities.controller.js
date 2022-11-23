const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'business capabilities', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` WHERE cap.capability_Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual business capability by ID', res);
};

exports.findOneName = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` WHERE cap.Capability_Name = '${req.params.name}';`;

  res = ctrl.sendQuery(query, 'individual business capability by name', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_capabilities AS cap_mappings ON systems.\`ex:GEAR_ID\` = cap_mappings.obj_systems_subsystems_Id
      LEFT JOIN gear_schema.obj_capability AS cap ON cap_mappings.obj_capability_Id = cap.capability_Id
    
      WHERE cap.capability_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'supporting systems for capability', res);
};

exports.findOrgs = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` LEFT JOIN zk_capabilities_org	  AS caps_mapping ON org.Organization_Id = caps_mapping.obj_organization_Id
      LEFT JOIN obj_capability	  	  AS cap          ON caps_mapping.obj_capability_Id = cap.capability_Id
    
      WHERE cap.capability_Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related orgs for capability', res);
};

exports.updateOrgs = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update business capability-organization relationship
    var orgString = '';
    if (data.relatedOrgs) {
      // Delete any references first
      orgString += `DELETE FROM zk_capabilities_org WHERE obj_capability_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedOrgs.forEach(orgID => {
        orgString += `INSERT INTO zk_capabilities_org (obj_capability_Id, obj_organization_Id) VALUES (${req.params.id}, ${orgID}); `;
      });
    };

    var query = `${orgString}`;
    
    res = ctrl.sendQuery(query, 'updating organizations for capability', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update business capabilities-organization mapping."
    });
  }
};