const sql = require("../db.js").connection;

exports.sendQuery = (query, msg, response) => {
  sql.query(query, (error, data) => {
    if (error) {
      console.log(`DB Query Error while executing ${msg}: `, error);
      response.status(501).json({
        message:
          error.message || `DB Query Error while executing ${msg}`
      });
    } else {
      // console.log("Query Response: ", response);  // Debug
      response.status(200).json(data);
    }
  });

  return response;
}

exports.emptyTextFieldHandler = (content) => {
  if (!content) return 'NULL';
  else return `'${content}'`;
};