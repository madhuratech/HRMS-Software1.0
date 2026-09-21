const db = require('../config/database');

db.query('SELECT * FROM salary_structure_components', (err, rows) => {
  console.log('salary_structure_components rows:', rows);
  process.exit(0);
});
