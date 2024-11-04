import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';

export function getAttributeDefinitions(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_technology_attribute_definitions.sql')).toString();

  res = sendQuery(query, 'Attribute Definitions', res);
}