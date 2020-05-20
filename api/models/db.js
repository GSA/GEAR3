var dotenv = require('dotenv').config();  // .env Credentials
const mysql = require('mysql2');

// Connection Credentials
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB
})

// Create DB Connection
connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to MySQL database.");
});

module.exports = connection;