import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';
const SHEET_ID = '1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE';
const RANGE = 'MASTER!A:M';

// @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE

export function findAll(req, res) {
  // ctrl.googleMain(res, 'all', SHEET_ID, RANGE);

  var query = readFileSync(join(__dirname, queryPath, 'GET/get_sysTIME.sql')).toString() +
  `;`;

  res = sendQuery(query, 'TIME designations', res);
}