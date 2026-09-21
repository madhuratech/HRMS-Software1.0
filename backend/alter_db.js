const db = require('./config/database');

const sql = `ALTER TABLE attendance ADD COLUMN location_address VARCHAR(255) DEFAULT NULL;`;

db.query(sql, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error altering table:', err);
    }
  } else {
    console.log('Table altered successfully:', result);
  }
  process.exit();
});
