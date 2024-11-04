import { readFileSync } from "fs";
import { join } from "path";

import { sendQuery, getApiToken } from "./base.controller";
import { __dirname } from '../util/path-util';

const queryPath = "../queries/";

export function findAll(req, res) {
  var query =
    readFileSync(join(__dirname, queryPath, "GET/get_websites.sql"))
      .toString() + ` ORDER BY domain;`;

  res = sendQuery(query, "websites", res);
}

export function findOne(req, res) {
  var query =
    readFileSync(join(__dirname, queryPath, "GET/get_websites.sql"))
      .toString() + ` WHERE id = ${req.params.id} ORDER BY domain;`;

  res = sendQuery(query, "individual website", res);
}

export function findScans(req, res) {
  var query =
    readFileSync(
        join(__dirname, queryPath, "GET/get_website_scans.sql")
      )
      .toString() +
    ` WHERE obj_website_id = ${req.params.id} ORDER BY scan_date DESC;`;

  res = sendQuery(query, "individual website scans", res);
}

export function findOneScan(req, res) {
  var query =
    readFileSync(
        join(__dirname, queryPath, "GET/get_website_scans.sql")
      )
      .toString() +
    ` WHERE obj_website_id = ${req.params.id} AND id = ${req.params.scanId} ORDER BY scan_date DESC;`;

  res = sendQuery(query, "individual website one scan", res);
}

export function findServiceCategories(req, res) {
  var query =
    readFileSync(
        join(
          __dirname,
          queryPath,
          "GET/get_website_service_categories.sql"
        )
      )
      .toString() +
    ` WHERE obj_websites_id = ${req.params.id} ORDER BY name ASC`;

  res = sendQuery(query, "service categories for a website", res);
}

export function findSystems(req, res) {
  var query =
    readFileSync(join(__dirname, queryPath, "GET/get_systems.sql"))
      .toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_websites AS websites_mapping ON systems.\`ex:GEAR_ID\` = websites_mapping.obj_systems_subsystems_Id
    WHERE websites_mapping.obj_websites_Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = sendQuery(query, "related systems for website", res);
}

export function updateSystems(req, res) {
  getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING
    var data = req.body;

    // Create string to update website-system relationship
    var systemString = "";
    if (data.relatedSystems) {
      // Delete any references first
      systemString += `DELETE FROM zk_systems_subsystems_websites WHERE obj_websites_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedSystems.forEach((systemID) => {
        systemString += `INSERT INTO zk_systems_subsystems_websites (obj_websites_Id, obj_systems_subsystems_Id) VALUES (${req.params.id}, ${systemID}); `;
      });
    }

    var query = `${systemString}`;

    res = sendQuery(query, "updating systems for website", res);
  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

    res.status(502).json({
      message:
        "No authorization token present. Not allowed to update systems-business website mapping.",
      });
    }
  });
}
