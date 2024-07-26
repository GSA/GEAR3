const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.getDataDictionary = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_data_dictionary.sql')).toString() + ';';

  res = ctrl.sendQuery(query, 'Data Dictionary', res);
};

exports.getDataDictionaryByReportName = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_data_dictionary.sql')).toString() +
    ` WHERE report_name = '${req.params.reportName}';`;

  res = ctrl.sendQuery(query, 'Data Dictionary By Report Name', res);
};