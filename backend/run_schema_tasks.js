require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hrms_db',
            multipleStatements: true
        });

        const sql = fs.readFileSync('schema_tasks_sales.sql', 'utf8');
        await pool.query(sql);
        console.log('Schema executed successfully!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
