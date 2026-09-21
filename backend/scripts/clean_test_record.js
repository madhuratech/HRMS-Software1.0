const db = require('../config/database');

db.query("DELETE FROM salary_structures WHERE code = 'TEST-COMP-ID-1'", (err, res) => {
  console.log('Deleted TEST-COMP-ID-1:', res?.affectedRows);
  process.exit(0);
});
