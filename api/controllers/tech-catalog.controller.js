import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';

export function getManufacturers(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_tc_manufacturers.sql')).toString() +
  ` order by name asc;`;

  res = sendQuery(query, 'Manufacturers', res);
}

export function getSoftwareProducts(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_tc_softwareproducts.sql')).toString() + 
  ` where manufacturer = '${req.params.id}'
   order by 2 asc;`;

  res = sendQuery(query, 'SoftwareProducts', res);
}

export function getSoftwareVersions(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_tc_softwareversions.sql')).toString() + 
  ` where softwareProduct = '${req.params.id}'
   order by order_ desc;`;

  res = sendQuery(query, 'SoftwareVersions', res);
}

export function getSoftwareReleases(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_tc_softwarereleases.sql')).toString() + 
  ` where softwareVersion = '${req.params.id}'
   order by 2 desc;`;

  res = sendQuery(query, 'SoftwareReleases', res);
}