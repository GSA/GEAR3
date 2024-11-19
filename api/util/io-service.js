import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Gets the full file path by combining base path, file type path, and file path.
 *
 * @param {string} fileTypePath - The type path of the file.
 * @param {string} filePath - The path to the file.
 * @returns {string} The combined file path.
 */
export const getFilePath = (fileTypePath, filePath) => join(__dirname, fileTypePath, filePath);

/**
 * Reads and returns the content of a file as a string.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} A promise that resolves to the file content as a string.
 */
export const parseFile = async (filePath) => await fs.readFile(filePath, 'utf8');
