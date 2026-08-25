const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY org.Organization_Name;";

  res = ctrl.sendQuery(query, 'organizations', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Organization_Id = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'individual organization', res);
};

exports.findCapabilites = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_capabilities_org	  AS orgs_mapping ON cap.capability_Id = orgs_mapping.obj_capability_Id
      LEFT JOIN obj_organization	  	AS org          ON orgs_mapping.obj_organization_Id = org.Organization_Id
      
      WHERE org.Organization_Id = '${req.params.id}';`;

  res = ctrl.sendQuery(query, 'business capabilities for organization', res);
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:Responsible_Org\` LIKE "%${ req.params.name}%" GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'systems for organization', res);
};

exports.findChildOrgs = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Parent_Id = '${req.params.id}' ORDER BY org.Organization_Name;`;

  res = ctrl.sendQuery(query, 'child organizations for organization', res);
};

exports.findBusinessSystems = (req, res) => {
  // Business_Org is a free-text field like "Ofc. of Supply Mgmt. (FDC)"
  // We need to match systems where Business_Org contains "(OrgSymbol)" for
  // this org OR any of its descendants (orgs whose Org_Symbol starts with this org's symbol).
  const sql = require('../db.js').connection;

  sql.query(
    'SELECT Org_Symbol FROM gear_schema.obj_organization WHERE Organization_Id = ?',
    [req.params.id],
    (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      const orgSymbol = rows[0].Org_Symbol;

      // Get all descendant org symbols (prefix match on Org_Symbol)
      sql.query(
        'SELECT Org_Symbol FROM gear_schema.obj_organization WHERE Org_Symbol LIKE ?',
        [`${orgSymbol}%`],
        (err2, orgRows) => {
          if (err2) {
            return res.status(501).json({ message: err2.message });
          }

          // Build a WHERE clause matching any "(Symbol)" in Business_Org
          const conditions = orgRows.map(o => `systems_ext.Business_Org LIKE '%(${o.Org_Symbol})%'`).join('\n          OR ');

          var sysQuery = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
            ` WHERE (${conditions})
              AND systems.\`ex:Status\` = 'Active'
              AND systems.\`ex:BusinessApplication\` = 'Yes'
              GROUP BY systems.\`ex:GEAR_ID\`;`;

          sql.query(sysQuery, (err3, results) => {
            if (err3) {
              return res.status(501).json({ message: err3.message });
            }
            res.status(200).json(results);
          });
        }
      );
    }
  );
};