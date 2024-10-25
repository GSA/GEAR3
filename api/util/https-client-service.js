const https = require('https');

/**
 * Performs an HTTPS request and returns the response data as JSON.
 *
 * @param {Object} options - The options for the HTTPS request.
 * @returns {Promise<Object>} A promise that resolves to the response data as JSON.
 */
const doRequest = (options) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.end();
  });
};

/**
 * Fetches JSON data from the specified host and path.
 *
 * @param {string} host - The host name.
 * @param {string} path - The path on the host.
 * @returns {Promise<Object>} A promise that resolves to the JSON data.
 */
const getJsonData = async (host, path) => {
  const options = {
    host,
    path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return await doRequest(options);
};

module.exports = {
  getJsonData,
}
