const db = require('../config/database');

async function inspect() {
  db.query("SHOW TABLES LIKE '%salary%'", (err, tables) => {
    console.log('SALARY TABLES:', tables);
    db.query('DESCRIBE salary_structures', (err1, structCols) => {
      console.log('salary_structures COLS:', structCols, 'ERR:', err1 ? err1.message : null);
      db.query('DESCRIBE salary_structure_components', (err2, compCols) => {
        console.log('salary_structure_components COLS:', compCols, 'ERR:', err2 ? err2.message : null);
        db.query('DESCRIBE salary_components', (err3, sCompCols) => {
          console.log('salary_components COLS:', sCompCols, 'ERR:', err3 ? err3.message : null);
          process.exit(0);
        });
      });
    });
  });
}

inspect();
