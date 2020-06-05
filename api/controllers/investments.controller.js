const sql = require("../db.js");

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    ";";

  sql.query(query, (error, data) => {
    if (error) {
      console.log("Error: ", error);
      res.status(501).json({
        message:
          error.message || "DB Query Error while retrieving investments"
      });
    } else {
      // console.log("Investments: ", res);  // Debug
      res.status(200).json(data);
    }
  });
};

function findOne (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    " AND invest.Id = ?;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving individual investment"
        });
      } else {
        // console.log("Investment: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

function findApplications (req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    " AND app.obj_investment_Id = ? GROUP BY app.Id;";

  sql.query(query,
    [req.params.id],
    (error, data) => {
      if (error) {
        console.log("Error: ", error);
        res.status(501).json({
          message:
            error.message || "DB Query Error while retrieving application relations for investment"
        });
      } else {
        // console.log("Apps for Investment: ", res);  // Debug
        res.status(200).json(data);
      }
  });
};

module.exports = {
  findAll,
  findOne,
  findApplications
};