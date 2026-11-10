const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_cloud_adoption_rate.sql')).toString() +
    " ORDER BY DTG desc;";

  res = ctrl.sendQuery(query, 'Cloud Adoption Rate', res); 
};
