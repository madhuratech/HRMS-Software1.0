const mysql = require('mysql2/promise');
require('dotenv').config();

async function showSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const tables = ['departments', 'designations', 'teams', 'holidays', 'shifts'];
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`DESCRIBE ${table}`);
      console.log(`\n--- ${table} ---`);
      console.table(rows);
    } catch (err) {
      console.log(`\n--- ${table} ---`);
      console.error(err.message);
    }
  }

  process.exit(0);
}

showSchema();
