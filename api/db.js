import { readFileSync } from 'fs';
import { createPool } from 'mysql2';

// Connection Credentials
export const dbCredentials = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB,
  port: 3306,
  ssl: {
    ca: readFileSync('./certs/ca.pem'),
    key: readFileSync('./certs/client-key.pem'),
    cert: readFileSync('./certs/client-cert.pem')
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
const pool = createPool(dbCredentials)

const promisePool = pool.promise();

// const pool_cowboy = mysql.createPool(dbCredentials_cowboy)

export const connection = pool;
export const connection_promise = promisePool;