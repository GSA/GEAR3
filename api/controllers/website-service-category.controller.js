import { readFileSync } from "fs";
import { join } from "path";

import { sendQuery } from "./base.controller";
import { __dirname } from '../util/path-util';

const queryPath = "../queries/";

export function findAll(req, res) {
  var query =
    readFileSync(
        join(__dirname, queryPath, "GET/get_website_service_category.sql")
      )
      .toString() + ` ORDER BY name ASC;`;

  res = sendQuery(query, "all service categories", res);
}

export function findOne(req, res) {
  var query =
    readFileSync(
        join(__dirname, queryPath, "GET/get_website_service_category.sql")
      )
      .toString() +
    ` WHERE id = ${req.params.id} 
  ORDER BY name ASC;`;

  res = sendQuery(query, "individual service category", res);
}

export function findRelatedWebsites(req, res) {
  var query =
    readFileSync(
        join(
          __dirname,
          queryPath,
          "GET/get_website_service_category_related_websites.sql"
        )
      )
      .toString() +
    ` WHERE zk.obj_service_category_id = ${req.params.id} 
    AND w.production_status = "production"
  ORDER BY w.domain ASC;`;

  res = sendQuery(
    query,
    "individual service category and related websites",
    res
  );
}
