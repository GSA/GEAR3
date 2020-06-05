const sql = require("../db.js");

function sendQuery (query, msg, response, params) {
  // If no parameters to pass
  if (params == undefined) {
    sql.query(query, (error, data) => {
      if (error) {
        console.log("Error: ", error);
        response.status(501).json({
          message:
            error.message || `DB Query Error while retrieving ${msg}`
        });
      } else {
        // console.log("Query Response: ", res);  // Debug
        response.status(200).json(data);
      }
    });
  } else {
    sql.query(query,
      params,
      (error, data) => {
      if (error) {
        console.log("Error: ", error);
        response.status(501).json({
          message:
            error.message || `DB Query Error while retrieving ${msg}`
        });
      } else {
        // console.log("Query Response: ", res);  // Debug
        response.status(200).json(data);
      }
    });
  }

  return response;
}

module.exports = {
  sendQuery
}