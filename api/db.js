var dotenv = require('dotenv').config();  // .env Credentials
const fs = require('fs');
const mysql = require('mysql2');

// Connection Credentials
const dbCredentials = {
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
// dbCredentials_cowboy = {
//   host: dbCredentials.host,
//   user: dbCredentials.user,
//   password: dbCredentials.password,
//   database: process.env.DB2 || process.env.DB,
//   port: dbCredentials.port,
//   ssl: dbCredentials.ssl,
//   multipleStatements: dbCredentials.multipleStatements
// };

// Create DB Connection
const pool = mysql.createPool(dbCredentials)

const promisePool = pool.promise();

// const pool_cowboy = mysql.createPool(dbCredentials_cowboy)

module.exports = {
  dbCredentials: dbCredentials,
  connection: pool,
  connection_promise: promisePool
  // connection_cowboy: pool_cowboy
};