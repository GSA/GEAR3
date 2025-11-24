const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    " ORDER BY poc.LastName;";

  res = ctrl.sendQuery(query, 'Points of Contact', res); //removed sendQuery_cowboy reference
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_pocs.sql')).toString() +
    ` WHERE poc.SamAccountName = '${req.params.samName}';`;

  res = ctrl.sendQuery(query, 'individual POC', res); //removed sendQuery_cowboy reference
};

exports.getPOCOrgByEmail = (req, res) => {
  var email = req.params.email.trim();
  var query = `
    SELECT
      org.Organization_Id             AS ID,
      org.Organization_Name           AS Name,
      org.Display_Name                AS DisplayName,
      org.Org_Symbol                  AS OrgSymbol,
      org.SSO_Name                    AS SSOName,
      org.Org_Symbol_Two_Letter       AS TwoLetterOrgSymbol,
      org.Org_Symbol_Two_Letter_Name  AS TwoLetterOrgName,
      parent.Organization_Name        AS Parent,
      org.Parent_Id                   AS Parent_ID
    FROM obj_organization             AS org
    LEFT JOIN obj_organization        AS parent ON org.Parent_Id = parent.Organization_Id
    LEFT JOIN obj_ldap_poc            AS poc ON poc.OrgCode = org.Org_Symbol
    WHERE poc.Email = "${email}";
  `;

  res = ctrl.sendQuery(query, 'POC Org by Email', res);
};