const fs = require('fs');
const path = require('path');
const db = require('./config/database');

const sqlFile = path.join(__dirname, 'schema_attendance_leave.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// The mysql2 pool doesn't natively support multiple statements well unless configured.
// We'll split the queries and run them sequentially.
const statements = sql.split(';').filter(s => s.trim().length > 0);

async function runPatch() {
  console.log('Running patch...');
  for (let statement of statements) {
    try {
      await new Promise((resolve, reject) => {
        db.query(statement, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      console.log('Executed statement successfully.');
    } catch (e) {
      console.error('Error executing statement:', e);
    }
  }
  console.log('Patch complete.');
  process.exit(0);
}

runPatch();
