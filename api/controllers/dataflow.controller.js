import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';

export function findAll(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_dataflow.sql')).toString() +
    ";";

  res = sendQuery(query, 'interfaces', res);
}

export function findOne(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_dataflow.sql')).toString() +
    ` WHERE inter.obj_application_Id = ${req.params.id};`;

  res = sendQuery(query, 'interface', res);
}