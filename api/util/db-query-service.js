
const { getFilePath, parseFile, } = require("./io-service.js");
const { connection_promise: conn } = require("../db.js");

const queryPath = '../queries/';


const prepareQuery = async (queryFilePath) => {
  return await parseFile(getFilePath(queryPath, queryFilePath));
};

/**
 * Executes a query on the database with the given values.
 *
 * @param {string} query - The SQL query to be executed.
 * @param {Array} values - The values to be used in the query.
 * @returns {Promise<Array>} A promise that resolves to the rows returned by the query.
 */
const runQuery = async (query, values) => {
  [rows, fields] = await conn.query(query, values);
  return rows;
};

module.exports = {
  prepareQuery,
  runQuery,
}
