var dotenv = require('dotenv').config();  // .env Credentials
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const investments = require('./api/investments')

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
  .use(investments(connection));

app.listen(port, () => {
  console.log("DB connected successfully!")
  console.log('Express server listening to port ' + port);
})