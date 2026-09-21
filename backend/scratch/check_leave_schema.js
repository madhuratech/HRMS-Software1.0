const db = require('../config/database');

async function run() {
  const tables = ['leave_types', 'leave_balances', 'leave_applications', 'comp_off_requests'];
  for (const t of tables) {
    await new Promise(res => {
      db.query(`DESCRIBE ${t}`, (err, rows) => {
        console.log(`=== ${t} ===`);
        if (err) console.log('Err:', err.message);
        else console.log(rows.map(r => `${r.Field} (${r.Type}, ${r.Null === 'YES' ? 'NULL' : 'NOT NULL'}, default=${r.Default})`).join('\n'));
        res();
      });
    });
  }

  await new Promise(res => {
    db.query("SHOW TABLES LIKE '%leave%'", (err, rows) => {
      console.log('=== ALL LEAVE TABLES ===', rows);
      res();
    });
  });

  await new Promise(res => {
    db.query("SHOW TABLES LIKE '%comp%'", (err, rows) => {
      console.log('=== ALL COMP TABLES ===', rows);
      res();
    });
  });

  // Query leave_types content
  await new Promise(res => {
    db.query("SELECT * FROM leave_types", (err, rows) => {
      console.log('=== LEAVE TYPES CONTENT ===', rows);
      res();
    });
  });

  // Query sample leave_balances content
  await new Promise(res => {
    db.query("SELECT * FROM leave_balances LIMIT 10", (err, rows) => {
      console.log('=== LEAVE BALANCES SAMPLE ===', rows);
      res();
    });
  });

  // Query sample leave_applications content
  await new Promise(res => {
    db.query("SELECT * FROM leave_applications LIMIT 10", (err, rows) => {
      console.log('=== LEAVE APPLICATIONS SAMPLE ===', rows);
      res();
    });
  });

  // Query comp_off_requests content
  await new Promise(res => {
    db.query("SELECT * FROM comp_off_requests LIMIT 10", (err, rows) => {
      console.log('=== COMP OFF REQUESTS SAMPLE ===', rows);
      res();
    });
  });

  process.exit(0);
}

run();
