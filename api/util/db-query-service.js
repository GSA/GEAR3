const { getFilePath, parseFile } = require("./io-service.js");
const { promisePool: connPromisePool } = require("../db.js");
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
 * Retries the provided asynchronous function in case of a deadlock error.
 *
 * @param {Function} func - The asynchronous function to be retried.
 * @param {number} [count=0] - The current retry count.
 * @param {number} [limit=5] - The maximum number of retry attempts.
 * @param {number} [wait=3000] - The initial wait time in milliseconds before retrying.
 * @returns {Promise<any>} A promise that resolves to the result of the function if successful.
 * @throws {Error} Throws an error if the retry limit is reached or a non-deadlock error occurs.
 */
const retry = async (func, count = 0, limit = 5, wait = 3000) => {
  try {
    return await func();
  } catch (err) {
    if (err.code === 'ER_LOCK_DEADLOCK' && count < limit) {
      await new Promise(resolve => setTimeout(resolve, wait));
      return retry(func, count + 1, limit, wait * 2);
    } else {
      throw err;
    }
  }
};

/**
 * Executes a query on the database with the given values.
 *
 * @param {string} query - The SQL query to be executed.
 * @param {Array} values - The values to be used in the query.
 * @returns {Promise<Array>} A promise that resolves to the rows returned by the query.
 */
const runQuery = async (query, values) => {
  const [rows] = await retry(async() => await connPromisePool.query(query, values));
  return rows;
};

module.exports = {
  prepareQuery,
  runQuery,
};