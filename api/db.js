var dotenv = require('dotenv').config();  // .env Credentials
const fs = require('fs');
const mysql = require('mysql2');

// Connection Credentials
dbCredentials = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB,
  port: 3306,
  ssl: {
    ca: fs.readFileSync('./certs/ca.pem'),
    key: fs.readFileSync('./certs/client-key.pem'),
    cert: fs.readFileSync('./certs/client-cert.pem')
  },
  multipleStatements: true
};

// Credentials for old database
dbCredentials_cowboy = {
  host: dbCredentials.host,
  user: dbCredentials.user,
  password: dbCredentials.password,
  database: process.env.DB2 || process.env.DB,
  port: dbCredentials.port,
  ssl: dbCredentials.ssl,
  multipleStatements: dbCredentials.multipleStatements
};

// Create DB Connection
const connection = mysql.createConnection(dbCredentials)
connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to MySQL gear_ods database.");
});

const connection_cowboy = mysql.createConnection(dbCredentials_cowboy)
connection_cowboy.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to MySQL cowboy_ods database.");
});

module.exports = {
  dbCredentials: dbCredentials,
  connection: connection,
  connection_cowboy: connection_cowboy
};