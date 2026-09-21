const db = require('../config/database');

db.query('SELECT * FROM salary_components', (err, comps) => {
  console.log('COMPONENTS in DB:', comps);
  db.query('SELECT * FROM salary_structures', (err2, structs) => {
    console.log('STRUCTURES in DB:', structs);
    process.exit(0);
  });
});
