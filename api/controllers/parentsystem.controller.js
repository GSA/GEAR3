const sql = require("../db.js");

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_parent_system.sql')).toString() +
    ";";

  sql.query(query, (error, data) => {
    if (error) {
      console.log("Error: ", error);
      res.status(501).json({
        message:
          error.message || "DB Query Error while retrieving parent systems"
      });
    } else {
      // console.log("Parent Systems: ", res);  // Debug
      res.status(200).json(data);
    }
  });
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_parent_system.sql')).toString() +
    " AND parentSys.Id = ?;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving individual parent system"
        });
      } else {
        // console.log("Parent System: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'get_applications.sql')).toString() +
    " AND app.obj_parent_system_Id = ? GROUP BY app.Id;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving child applications for parent system"
        });
      } else {
        // console.log("Child Apps for Parent System: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

module.exports = {
  findAll,
  findOne,
  findApplications
};