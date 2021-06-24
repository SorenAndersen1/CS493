const mysql = require('mysql2/promise');

const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = process.env.MYSQL_PORT || 3306;
const mysqlDb = process.env.MYSQL_DB || 'timeout';
const mysqlUser = process.env.MYSQL_USER || 'timeout';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'hunter2';

const mysqlPool = mysql.createPool({
  connectionLimit: 10,
  host: mysqlHost,
  port: mysqlPort,
  database: mysqlDb,
  user: mysqlUser,
  password: mysqlPassword
});

module.exports = mysqlPool;