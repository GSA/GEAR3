const sql = require("../db.js");

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_capabilities.sql')).toString() +
    ";";

  sql.query(query, (error, data) => {
    if (error) {
      console.log("Error: ", error);
      res.status(501).json({
        message:
          error.message || "DB Query Error while retrieving Capabilities"
      });
    } else {
      // console.log("Capabilities: ", res);  // Debug
      res.status(200).json(data);
    }
  });
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_capabilities.sql')).toString() +
    " AND cap.Id = ?;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving individual business capability"
        });
      } else {
        // console.log("Capability: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_applications.sql')).toString() +
    " AND cap.Id = ? GROUP BY app.Id;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving supporting applications for capability"
        });
      } else {
        // console.log("Capability: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

module.exports = {
  findAll,
  findOne,
  findApplications
};