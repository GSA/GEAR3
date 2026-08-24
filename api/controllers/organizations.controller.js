const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');
const SqlString = require('sqlstring');

const queryPath = '../queries/';

const ALLOWED_SORT_FIELDS = {
  OrgSymbol: 'org.Org_Symbol',
  Name: 'org.Organization_Name',
  SSOName: 'org.SSO_Name',
  TwoLetterOrgSymbol: 'org.Org_Symbol_Two_Letter',
  TwoLetterOrgName: 'org.Org_Symbol_Two_Letter_Name',
};

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY org.Organization_Name;";

  res = ctrl.sendQuery(query, 'organizations', res);
};

exports.findPaginated = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 50));
  const offset = (page - 1) * pageSize;

  const rawSortField = req.query.sortField || 'Name';
  const sortColumn = ALLOWED_SORT_FIELDS[rawSortField] || 'org.Organization_Name';
  const sortOrder = req.query.sortOrder === '-1' ? 'DESC' : 'ASC';

  const search = (req.query.search || '').trim();

  const baseQuery = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_organizations.sql')).toString();

  let whereClause = '';
  if (search) {
    const escaped = SqlString.escape('%' + search + '%');
    whereClause = ` WHERE (org.Organization_Name LIKE ${escaped}
      OR org.Org_Symbol LIKE ${escaped}
      OR org.SSO_Name LIKE ${escaped}
      OR org.Org_Symbol_Two_Letter LIKE ${escaped}
      OR org.Org_Symbol_Two_Letter_Name LIKE ${escaped})`;
  }

  const countQuery = `SELECT COUNT(*) AS total FROM obj_organization AS org` + whereClause + ';';
  const dataQuery = baseQuery + whereClause +
    ` ORDER BY ${sortColumn} ${sortOrder}` +
    ` LIMIT ${SqlString.escape(pageSize)} OFFSET ${SqlString.escape(offset)};`;

  const connPool = require('../db.js').promisePool;
  Promise.all([connPool.query(countQuery), connPool.query(dataQuery)])
    .then(([[countRows], [dataRows]]) => {
      res.status(200).json({
        total: countRows[0].total,
        data: dataRows,
      });
    })
    .catch(err => {
      console.error('DB Query Error while executing paginated organizations:', err);
      res.status(501).json({ message: err.message || 'DB Query Error' });
    });
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