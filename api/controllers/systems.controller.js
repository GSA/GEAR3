const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    " GROUP BY systems.\`ex:System_Name\`;";

  res = ctrl.sendQuery(query, 'Systems and subsystems', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:GEAR_ID\` = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'individual System/Subsystem', res);
};


exports.findCapabilities = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_capabilities AS cap_mapping    ON cap.capability_Id = cap_mapping.obj_capability_Id
      LEFT JOIN obj_fisma_archer                   AS systems        ON cap_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
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


exports.findInvestments = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_investments AS invest_mapping   ON invest.Investment_Id = invest_mapping.obj_investment_Id
      LEFT JOIN obj_fisma_archer                  AS systems          ON invest_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related investments for system', res);
};

exports.updateInvest = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update system-investments relationship
    var investString = '';
    if (data.relatedInvest) {
      // Delete any references first
      investString += `DELETE FROM zk_systems_subsystems_investments WHERE obj_systems_subsystems_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedInvest.forEach(investID => {
        investString += `INSERT INTO zk_systems_subsystems_investments (obj_systems_subsystems_Id, obj_investment_Id) VALUES (${req.params.id}, ${investID}); `;
      });
    };

    var query = `${investString}`;
    
    res = ctrl.sendQuery(query, 'updating investments for system', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-investments mapping."
    });
  }
};


exports.findRecords = (req, res) => {
  var query = `SELECT * FROM gear_ods.zk_systems_subsystems_records   AS records_mapping
      LEFT JOIN obj_fisma_archer                                      AS systems       ON records_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY records_mapping.obj_records_Id;`;

  res = ctrl.sendQuery(query, 'related records for system', res);
};


exports.findTechnologies = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` LEFT JOIN gear_ods.zk_systems_subsystems_technology   AS tech_mapping  ON tech.Id = tech_mapping.obj_technology_Id
      LEFT JOIN gear_ods.obj_fisma_archer                   AS systems       ON tech_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE obj_standard_type.Keyname LIKE '%Software%'
        AND systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY tech.Id
    ORDER BY tech.Keyname;`;

  res = ctrl.sendQuery_cowboy(query, 'related technologies for system', res);
};

exports.updateTech = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update system-IT Standards relationship
    var techString = '';
    if (data.relatedTech) {
      // Delete any references first
      techString += `DELETE FROM zk_systems_subsystems_technology WHERE obj_systems_subsystems_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedTech.forEach(techID => {
        techString += `INSERT INTO zk_systems_subsystems_technology (obj_systems_subsystems_Id, obj_technology_Id) VALUES (${req.params.id}, ${techID}); `;
      });
    };

    var query = `${techString}`;
    
    res = ctrl.sendQuery(query, 'updating IT Standards for system', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
    });
  }
};


exports.findTIME = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_sysTIME.sql')).toString() +
    ` WHERE \`System Id\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related TIME designations for system', res);
};