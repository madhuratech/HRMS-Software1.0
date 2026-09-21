const db = require('../config/database');

async function migrateColumns() {
  console.log('Ensuring description, status, and requires_approval exist on leave_types...');

  const queries = [
    "ALTER TABLE leave_types ADD COLUMN description TEXT",
    "ALTER TABLE leave_types ADD COLUMN status VARCHAR(20) DEFAULT 'Active'",
    "ALTER TABLE leave_types ADD COLUMN requires_approval TINYINT(1) DEFAULT 1"
  ];

  for (const q of queries) {
    await new Promise((resolve) => {
      db.query(q, (err) => {
        if (err) {
          if (err.code === 'ER_DUP_FIELDNAME') {
            console.log(`Column already exists for query: ${q}`);
          } else {
            console.warn(`Notice on query [${q}]:`, err.message);
          }
        } else {
          console.log(`Successfully executed: ${q}`);
        }
        resolve();
      });
    });
  }

  db.query("DESCRIBE leave_types", (err, cols) => {
    console.log('Updated columns on leave_types:', cols.map(c => c.Field));
    process.exit(0);
  });
}

migrateColumns().catch(err => {
  console.error(err);
  process.exit(1);
});
