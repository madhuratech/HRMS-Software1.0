const db = require('../config/database');

db.query('SHOW CREATE TABLE salary_structures', (err1, r1) => {
  console.log('salary_structures CREATE:', r1 ? r1[0]['Create Table'] : err1);
  db.query('SHOW CREATE TABLE salary_structure_components', (err2, r2) => {
    console.log('salary_structure_components CREATE:', r2 ? r2[0]['Create Table'] : err2);
    db.query('SHOW CREATE TABLE salary_components', (err3, r3) => {
      console.log('salary_components CREATE:', r3 ? r3[0]['Create Table'] : err3);
      process.exit(0);
    });
  });
});
