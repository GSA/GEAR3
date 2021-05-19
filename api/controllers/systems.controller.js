const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    " GROUP BY systems.\`ex:GEAR_ID\`;";

  res = ctrl.sendQuery_cowboy(query, 'Systems and subsystems', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:GEAR_ID\` = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery_cowboy(query, 'individual System/Subsystem', res);
};

exports.findCapabilities = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_capabilities AS cap_mapping    ON cap.capability_Id = cap_mapping.obj_capability_Id
      LEFT JOIN cowboy_ods.obj_fisma_archer        AS systems        ON cap_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related capabilities for system', res);
};

exports.updateCaps = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update system-business capability relationship
    var capString = '';
    if (data.relatedCaps) {
      // Delete any references first
      capString += `DELETE FROM zk_systems_subsystems_capabilities WHERE obj_systems_subsystems_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedCaps.forEach(capID => {
        capString += `INSERT INTO zk_systems_subsystems_capabilities (obj_capability_Id, obj_systems_subsystems_Id) VALUES (${capID}, ${req.params.id}); `;
      });
    };

    var query = `${capString}`;
    
    res = ctrl.sendQuery(query, 'updating capabilities for system', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
    });
  }
};

exports.findTechnologies = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE '%Software%'
        AND systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY tech.Id;`;

  res = ctrl.sendQuery_cowboy(query, 'related technologies for system', res);
};