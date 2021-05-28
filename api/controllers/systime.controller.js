const ctrl      = require('./base.controller'),

      SHEET_ID = '1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE',
      RANGE = 'MASTER!A:M';

// @see https://docs.google.com/spreadsheets/d/1_9X39tQ6jbYARcEYF7KbO-lDGbpDPjIwtKx0qhFvohE

exports.findAll = (req, res) => {
  ctrl.googleMain(res, 'all', SHEET_ID, RANGE);
};

exports.findOne = (req, res) => {
  ctrl.googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);
};
