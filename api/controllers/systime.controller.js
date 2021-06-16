const ctrl      = require('./base.controller'),
      fs = require('fs'),
      path = require('path'),

      queryPath = '../queries/',
      SHEET_ID = '1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE',
      RANGE = 'MASTER!A:M';

// @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE

exports.findAll = (req, res) => {
  // ctrl.googleMain(res, 'all', SHEET_ID, RANGE);

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_sysTIME.sql')).toString() +
  `;`;

  res = ctrl.sendQuery(query, 'TIME designations', res);
};