const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("[db] Connected to Postgres");
});

pool.on("error", (err) => {
  console.error("[db] Unexpected Postgres error", err);
});

module.exports = pool;
