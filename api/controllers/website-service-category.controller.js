const ctrl = require("./base.controller"),
  fs = require("fs"),
  path = require("path"),
  queryPath = "../queries/";

exports.findAll = (req, res) => {
  var query =
    fs
      .readFileSync(
        path.join(__dirname, queryPath, "GET/get_website_service_category.sql")
      )
      .toString() + ` ORDER BY name ASC;`;

  res = ctrl.sendQuery(query, "all service categories", res);
};

exports.findOne = (req, res) => {
  var query =
    fs
      .readFileSync(
        path.join(__dirname, queryPath, "GET/get_website_service_category.sql")
      )
      .toString() +
    ` WHERE id = ${req.params.id} 
  ORDER BY name ASC;`;

  res = ctrl.sendQuery(query, "individual service category", res);
};

exports.findRelatedWebsites = (req, res) => {
  var query =
    fs
      .readFileSync(
        path.join(
          __dirname,
          queryPath,
          "GET/get_website_service_category_related_websites.sql"
        )
      )
      .toString() +
    ` WHERE zk.obj_service_category_id = ${req.params.id} 
    AND w.production_status = "production"
  ORDER BY w.domain ASC;`;

  res = ctrl.sendQuery(
    query,
    "individual service category and related websites",
    res
  );
};
