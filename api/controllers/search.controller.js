const ctrl = require('./base.controller');

function searchAll(req, res) {
  var query = `SELECT * FROM cowboy_ods.v_global_search where Keyname LIKE '%${req.params.kw}%' or Description like '%${req.params.kw}%'`;

  res = ctrl.sendQuery(query, `global search of ${req.params.kw}`, res);
};

module.exports = {
  searchAll
};