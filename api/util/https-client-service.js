const https = require('https');

const doRequest = (options) => {
  return new Promise((resolve, reject) => {
    let req = https.request(options);

    req.on('response', res => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.end();
  });
}

const getJsonData = async (host, path) => {
  const options = {
    host: host,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return await doRequest(options);
}

module.exports = {
  getJsonData,
}
