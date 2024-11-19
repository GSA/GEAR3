import { createReadStream } from 'fs';
import { parse } from 'fast-csv';

/**
 * Parses a CSV file and returns the data as an array of data.
 *
 * @param {string} filePath - The path to the CSV file.
 * @param {boolean|Array<string>} [headers=false] - The headers option for parsing the CSV. If true, the first row of the CSV is treated as headers.
 * @param {number} [skipLines=0] - The number of lines to skip before starting to parse.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects representing the parsed CSV data.
 */
export const parseCSV = async (filePath, headers = false, skipLines = 0) => {
  const results = [];

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    .on('error', error => reject(error));

  stream.pipe(parse({ headers, skipLines }))
    .on('data', row => results.push(row))
    .on('end', () => resolve(results))
    .on('error', error => reject(error));
  });
}
