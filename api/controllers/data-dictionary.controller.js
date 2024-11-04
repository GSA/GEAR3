import { escape } from 'sqlstring';
import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';


export function getDataDictionary(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_data_dictionary.sql')).toString() + ';';

  res = sendQuery(query, 'Data Dictionary', res);
}

export function getDataDictionaryByReportName(req, res) {
  var cleanReportName = escape(req.params.reportName);
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_data_dictionary.sql')).toString() +
    ' WHERE report_name = ' + cleanReportName +';';

  res = sendQuery(query, 'Data Dictionary By Report Name', res);
}