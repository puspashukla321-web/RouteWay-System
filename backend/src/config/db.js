const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const missingCredentialsError = new Error(
  "Missing MySQL credentials. Copy backend/.env.example to backend/.env and set DB_USER and DB_PASSWORD.",
);

const dbUser = process.env.DB_USER || process.env.MYSQL_USER;
const dbPassword = process.env.DB_PASSWORD ?? process.env.MYSQL_PWD;

if (!dbUser || dbPassword == null) {
  module.exports = {
    query: async () => {
      throw missingCredentialsError;
    },
    getConnection: async () => {
      throw missingCredentialsError;
    },
  };
  return;
}

module.exports = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: dbUser,
  password: dbPassword,
  database: process.env.DB_NAME || "routeway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
