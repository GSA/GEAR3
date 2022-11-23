const ctrl      = require('./base.controller'),
      fs = require('fs'),
      path = require('path'),

      queryPath = '../queries/';


exports.findAll = (req, res) => {

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_websites.sql')).toString() +
  ` ORDER BY domain;`;

  res = ctrl.sendQuery(query, 'websites', res);
};

exports.findOne = (req, res) => {

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_websites.sql')).toString() +
  ` WHERE id = ${req.params.id} ORDER BY domain;`;

  res = ctrl.sendQuery(query, 'individual website', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
  ` LEFT JOIN gear_schema.zk_systems_subsystems_websites AS websites_mapping ON systems.\`ex:GEAR_ID\` = websites_mapping.obj_systems_subsystems_Id
    WHERE websites_mapping.obj_websites_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'related systems for website', res);
};

exports.updateSystems = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update website-system relationship
    var systemString = '';
    if (data.relatedSystems) {
      // Delete any references first
      systemString += `DELETE FROM zk_systems_subsystems_websites WHERE obj_websites_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedSystems.forEach(systemID => {
        systemString += `INSERT INTO zk_systems_subsystems_websites (obj_websites_Id, obj_systems_subsystems_Id) VALUES (${req.params.id}, ${systemID}); `;
      });
    };

    var query = `${systemString}`;
    
    res = ctrl.sendQuery(query, 'updating systems for website', res);

  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-business website mapping."
    });
  }
};