const { promises: fs } = require('fs');
const path = require('path');

const { connection_promise: conn } = require("../db.js");

const getFilePath = async (fileTypePath, filePath) => {
  return await parseFile(path.join(__dirname, fileTypePath, filePath));
};

/**
 * Reads and returns the content of a file as a string.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} A promise that resolves to the file content as a string.
 */
const parseFile = async (filePath) => {
  return await fs.readFile(filePath, 'utf8');
};


module.exports = {
  getFilePath,
  parseFile,
}
