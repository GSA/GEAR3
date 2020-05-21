var dotenv = require('dotenv').config();  // .env Credentials
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const path = require('path');
http = require('http');

const api = require('./api/index');

const port = process.env.PORT || 8000;

const app = express()
  .use(cors())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static(path.join(__dirname, 'src')))
  .use(express.static(path.join(__dirname, 'src')));

/********************************************************************
API Platform
********************************************************************/
app.use('/api', api);

/********************************************************************
REDIRECT ROOT TO GEAR "read only" (aka "angular") app
********************************************************************/
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'src','index.html'));
});

const server = http.createServer(app);

server.listen(process.env.PORT, function() {
  console.log('Express server listening on port ' + server.address().port);
})
server.on('error', onError);
server.on('listening', onListening);

/*
 * Event listener for HTTP server "error" event.
*/

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/*
 * Event listener for HTTP server "listening" event.
*/

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}