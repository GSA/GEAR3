const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.getAttributeDefinitions = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_technology_attribute_definitions.sql')).toString();

  res = ctrl.sendQuery(query, 'Attribute Definitions', res);
};