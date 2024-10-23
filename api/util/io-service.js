const { promises: fs } = require('fs');
const path = require('path');

/**
 * Gets the full file path by combining base path, file type path, and file path.
 *
 * @param {string} fileTypePath - The type path of the file.
 * @param {string} filePath - The path to the file.
 * @returns {string} The combined file path.
 */
const getFilePath = (fileTypePath, filePath) => path.join(__dirname, fileTypePath, filePath);

/**
 * Reads and returns the content of a file as a string.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} A promise that resolves to the file content as a string.
 */
const parseFile = async (filePath) => await fs.readFile(filePath, 'utf8');

module.exports = {
  getFilePath,
  parseFile,
};
