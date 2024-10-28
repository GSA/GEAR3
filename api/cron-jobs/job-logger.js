/**
 * JobLogger class for managing log messages.
 */
class JobLogger {
    /**
     * Creates a new JobLogger instance.
     */
    constructor() {
      this.logs = ''; // Initialize an empty string to store logs
    }
  
    /**
     * Appends a new log message to the logs.
     *
     * @param {string} message - The log message to be added.
     */
    log(message) {
      this.logs += `${message}\n`; // Append log to the string with a newline
    }
  
    /**
     * Retrieves all the log messages.
     *
     * @returns {string} All the log messages concatenated into a single string.
     */
    getLogs() {
      return this.logs; // Return the concatenated log messages
    }
  }
  
  module.exports = {
    JobLogger,
  };
  