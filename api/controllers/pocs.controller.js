import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';

const queryPath = '../queries/';

export function findAll(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " ORDER BY poc.LastName;";

  res = sendQuery(query, 'Points of Contact', res); //removed sendQuery_cowboy reference
}

export function findOne(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ` WHERE poc.SamAccountName = '${req.params.samName}';`;

  res = sendQuery(query, 'individual POC', res); //removed sendQuery_cowboy reference
}