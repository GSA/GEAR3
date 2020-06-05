const sql = require("../db.js");

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_organizations.sql')).toString() +
    ";";

  sql.query(query, (error, data) => {
    if (error) {
      console.log("Error: ", error);
      res.status(501).json({
        message:
          error.message || "DB Query Error while retrieving organizations"
      });
    } else {
      // console.log("Organizations: ", res);  // Debug
      res.status(200).json(data);
    }
  });
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_organizations.sql')).toString() +
    " AND org.Id = ?;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving individual organization"
        });
      } else {
        // console.log("Organization: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_applications.sql')).toString() +
    " AND owner.Id = ? GROUP BY app.Id;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving applications for organization"
        });
      } else {
        // console.log("Apps for Organization: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

module.exports = {
  findAll,
  findOne,
  findApplications
};