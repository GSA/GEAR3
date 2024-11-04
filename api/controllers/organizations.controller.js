import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';

export function findAll(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    " ORDER BY org.Organization_Name;";

  res = sendQuery(query, 'organizations', res);
}

export function findOne(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_organizations.sql')).toString() +
    ` WHERE org.Organization_Id = '${req.params.id}';`;

  res = sendQuery(query, 'individual organization', res);
}

export function findCapabilites(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_capabilities_org	  AS orgs_mapping ON cap.capability_Id = orgs_mapping.obj_capability_Id
      LEFT JOIN obj_organization	  	AS org          ON orgs_mapping.obj_organization_Id = org.Organization_Id
      
      WHERE org.Organization_Id = '${req.params.id}';`;

  res = sendQuery(query, 'business capabilities for organization', res);
}

export function findSystems(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:Responsible_Org\` LIKE "%${ req.params.name}%" GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = sendQuery(query, 'systems for organization', res);
}