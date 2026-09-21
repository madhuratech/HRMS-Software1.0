const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runPatch() {
  try {
    const patchPath = path.join(__dirname, 'schema_employee_lifecycle_patch.sql');
    const sql = fs.readFileSync(patchPath, 'utf8');
    
    // Split the SQL script into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const stmt of statements) {
      if (stmt) {
        await db.promise().query(stmt);
        console.log('Executed statement successfully.');
      }
    }
    
    console.log('Schema patch applied successfully!');
  } catch (error) {
    console.error('Error applying schema patch:', error);
  } finally {
    process.exit(0);
  }
}

runPatch();
