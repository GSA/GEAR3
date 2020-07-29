const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  let filter = '';
  if (req.query.owner) {
    filter = ` 'WHERE ( owner1.Keyname LIKE '%${req.query.owner}%' or owner2.Keyname LIKE '%${req.query.owner}%') AND appstat1.Keyname <> 'Retired'  AND appstat2.Keyname <> 'Retired'  ORDER BY owner1.Keyname, owner2.Keyname;'`;
  }
  if (req.query.sys) {
    filter = ` 'WHERE ( sys1.Keyname LIKE '%${req.query.sys}%' or sys2.Keyname LIKE '%${req.query.sys}%') AND appstat1.Keyname <> 'Retired'  AND appstat2.Keyname <> 'Retired'  ORDER BY sys1.Keyname, sys2.Keyname;'`;
  }
  if (req.params.id) {
    filter = ` inter.obj_application_Id = ${req.params.id} OR inter.obj_application_Id1 = ${req.params.id} OR inter.obj_application_Id2 = ${req.params.id};`
  }

  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_interfaces.sql')).toString() + filter;

  res = ctrl.sendQuery(query, 'interfaces', res);
};