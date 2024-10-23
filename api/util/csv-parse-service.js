const fs = require('fs');
const { parse } = require('fast-csv');

/**
 * Parses a CSV file and returns the data as an array of objects.
 *
 * @param {string} filePath - The path to the CSV file.
 * @param {boolean|Array<string>} [headers=false] - The headers option for parsing the CSV. If true, the first row of the CSV is treated as headers.
 * @param {number} [skipRows=0] - The number of rows to skip before starting to parse.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects representing the parsed CSV data.
 */
const parseCSV = async (filePath, headers = false, skipRows = 0) => {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      // handle read stream creation errors
      .on('error', (error) => {
        reject(error);
      })
      // parse data
      .pipe(parse({ headers: headers, skipRows: skipRows }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
  parseCSV,
}
