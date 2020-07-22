const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_systems.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'parent systems', res);
};

function findOne(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_systems.sql')).toString() +
    ` WHERE parentSys.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'individual parent system', res);
};

function findLatest(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_parent_systems.sql')).toString() +
    ` ORDER BY parentSys.CreateDTG DESC LIMIT 1;`;

  res = ctrl.sendQuery(query, 'latest individual parent system', res);
};

function findApplications(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND app.obj_parent_system_Id = ${req.params.id} GROUP BY app.Id;`;

  res = ctrl.sendQuery(query, 'child applications for parent system', res);
};

function update(req, res) {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update apps with parent system or null when deselected
    var appString = '';
    if (data.sysChildApps) {
      data.sysChildApps.forEach(appID => {
        appString += `UPDATE obj_application SET obj_parent_system_Id=${req.params.id} WHERE Id=${appID}; `
      });
    }

    if (data.deselectedApps) {
      data.deselectedApps.forEach(appID => {
        appString += `UPDATE obj_application SET obj_parent_system_Id=NULL WHERE Id=${appID}; `
      });
    }

    // Null any empty text fields
    if (!data.sysDesc) { data.sysDesc = 'NULL' }
    else { data.sysDesc = `'${data.sysDesc}'` }

    if (!data.sysLink) { data.sysLink = 'NULL' }
    else { data.sysLink = `'${data.sysLink}'` }

    var query = `SET FOREIGN_KEY_CHECKS=0;
      UPDATE obj_parent_system
      SET ps_status             = '${data.sysStatus}',
        Keyname                 = '${data.sysName}',
        Description             = ${data.sysDesc},
        URL                     = ${data.sysLink},
        obj_organization_Id     = ${data.sysSSO},
        ChangeAudit             = '${data.auditUser}'
      WHERE Id = ${req.params.id};
      SET FOREIGN_KEY_CHECKS=1;
      ${appString}`

    res = ctrl.sendQuery(query, 'update parent system', res);
  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update parent systems"
    });
  }
};

function create(req, res) {
  if (req.headers.authorization) {
    var data = req.body;

    // Null any empty text fields
    if (!data.sysDesc) { data.sysDesc = 'NULL' }
    else { data.sysDesc = `'${data.sysDesc}'` }

    if (!data.sysLink) { data.sysLink = 'NULL' }
    else { data.sysLink = `'${data.sysLink}'` }

    var query = `INSERT INTO obj_parent_system(
      Keyname,
      Description,
      URL,
      ps_status,
      obj_organization_Id,
      CreateAudit,
      ChangeAudit) VALUES (
        '${data.sysName}',
        ${data.sysDesc},
        ${data.sysLink},
        '${data.sysStatus}',
        ${data.sysSSO},
        '${data.auditUser}',
        '${data.auditUser}');`

    res = ctrl.sendQuery(query, 'create parent system', res);
  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to create investment"
    });
  }
};

module.exports = {
  findAll,
  findOne,
  findLatest,
  findApplications,

  update,
  create
};