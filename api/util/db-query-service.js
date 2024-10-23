const { getFilePath, parseFile } = require("./io-service.js");
const { connection_promise: conn } = require("../db.js");
const queryPath = '../queries/';

/**
 * Prepares an SQL query by reading its content from a file.
 *
 * @param {string} queryFilePath - The path to the query file.
 * @returns {Promise<string>} A promise that resolves to the query string.
 */
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
  const [rows] = await conn.query(query, values);
  return rows;
};

module.exports = {
  prepareQuery,
  runQuery,
};