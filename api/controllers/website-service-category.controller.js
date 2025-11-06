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
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, "GET/get_website_service_category.sql")).toString() +
      ` WHERE id = ${id} 
        ORDER BY name ASC;`;

    res = ctrl.sendQuery(query, "individual service category", res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
};

exports.findRelatedWebsites = (req, res) => {
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, "GET/get_website_service_category_related_websites.sql")).toString() +
      ` WHERE zk.obj_service_category_id = ${id} 
        AND w.production_status = "production"
        ORDER BY w.domain ASC;`;

    res = ctrl.sendQuery(query, "individual service category and related websites", res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
};
