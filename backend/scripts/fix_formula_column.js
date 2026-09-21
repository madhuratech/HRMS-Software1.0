const db = require('../config/database');

async function fixFormulaColumn() {
  db.query("ALTER TABLE salary_components MODIFY COLUMN formula VARCHAR(255) NULL DEFAULT ''", (err, res) => {
    if (err) {
      console.error('ALTER TABLE error:', err);
    } else {
      console.log('ALTER TABLE success:', res);
    }
    db.query('DESCRIBE salary_components', (err2, cols) => {
      console.log('COLS:', cols);
      process.exit(0);
    });
  });
}

fixFormulaColumn();
