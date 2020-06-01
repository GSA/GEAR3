const sql = require("../db.js");
const Capability = require("../models/capabilities.model");

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

module.exports = {
  findAll
};