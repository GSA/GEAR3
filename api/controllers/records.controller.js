const ctrl      = require('./base.controller'),

      SHEET_ID = '1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A',
      RANGE = 'Master List';

// @see https://docs.google.com/spreadsheets/d/1eSoyn7-2EZMqbohzTMNDcFmNBbkl-CzXtpwNXHNHD1A

exports.findAll = (req, res) => {
  ctrl.googleMain(res, 'all', SHEET_ID, RANGE);
};

exports.findOne = (req, res) => {
  ctrl.googleMain(res, 'single', SHEET_ID, RANGE, req.params.id);
};
