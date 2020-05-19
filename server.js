var dotenv = require('dotenv').config();  // .env Credentials
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const path = require('path');
http = require('http');

const investments = require('./api/investments');

// Connection Credentials
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB
})
const port = process.env.PORT || 8000;

// Create DB Connection
connection.connect();

const app = express()
  .use(cors())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static(path.join(__dirname, 'src')))
  .use('/', express.static(path.join(__dirname, 'src')))
  .use('/api', investments(connection))

  app.listen(port, () => {
  console.log("DB connected successfully!")
  console.log('Express server listening to port ' + port);
})
app.on('error', onError);
app.on('listening', onListening);

/********************************************************************
REDIRECT ROOT TO GEAR "read only" (aka "legacy"; aka "angular") app
********************************************************************/
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'src','index.html'));
});

const server = http.createServer(app);

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