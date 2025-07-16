const ctrl = require("./base.controller"),
  fs = require("fs"),
  path = require("path"),
  queryPath = "../queries/";

exports.findAll = (req, res) => {
  var query =
    fs
      .readFileSync(path.join(__dirname, queryPath, "GET/get_websites.sql"))
      .toString() + ` ORDER BY domain;`;

  res = ctrl.sendQuery(query, "websites", res);
};

exports.findOne = (req, res) => {
  var query =
    fs
      .readFileSync(path.join(__dirname, queryPath, "GET/get_websites.sql"))
      .toString() + ` WHERE id = ${req.params.id} ORDER BY domain;`;

  res = ctrl.sendQuery(query, "individual website", res);
};

exports.findScans = (req, res) => {
  var query =
    fs
      .readFileSync(
        path.join(__dirname, queryPath, "GET/get_website_scans.sql")
      )
      .toString() +
    ` WHERE obj_website_id = ${req.params.id} ORDER BY scan_date DESC;`;

  res = ctrl.sendQuery(query, "individual website scans", res);
};

exports.findOneScan = (req, res) => {
  var query =
    fs
      .readFileSync(
        path.join(__dirname, queryPath, "GET/get_website_scans.sql")
      )
      .toString() +
    ` WHERE obj_website_id = ${req.params.id} AND id = ${req.params.scanId} ORDER BY scan_date DESC;`;

  res = ctrl.sendQuery(query, "individual website one scan", res);
};

exports.findServiceCategories = (req, res) => {
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query =
    fs
      .readFileSync(
        path.join(
          __dirname,
          queryPath,
          "GET/get_website_service_categories.sql"
        )
      )
      .toString() +
    ` WHERE obj_websites_id = ${id} ORDER BY name ASC`;

    res = ctrl.sendQuery(query, "service categories for a website", res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
}

exports.findSystems = (req, res) => {
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query =
    fs
      .readFileSync(path.join(__dirname, queryPath, "GET/get_systems.sql"))
      .toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_websites AS websites_mapping ON systems.\`ex:GEAR_ID\` = websites_mapping.obj_systems_subsystems_Id
    WHERE websites_mapping.obj_websites_Id = ${id} GROUP BY systems.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, "related systems for website", res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
};

exports.updateSystems = (req, res) => {
  ctrl.getApiToken (req, res)
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

    res = ctrl.sendQuery(query, "updating systems for website", res);
  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

    res.status(502).json({
      message:
        "No authorization token present. Not allowed to update systems-business website mapping.",
      });
    }
  });
};
exports.getFilterTotals = (req, res) => {  
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_websites_filter_totals.sql`)).toString();

  res = ctrl.sendQuery(query, `Websites filter totals`, res);
};