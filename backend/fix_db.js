const db = require('./config/database');

async function fixDB() {
  const util = require('util');
  const query = util.promisify(db.query).bind(db);

  try {
    await query(`ALTER TABLE client_visits MODIFY COLUMN check_in_time datetime NULL`);
    await query(`ALTER TABLE client_visits MODIFY COLUMN check_in_lat decimal(10,8) NULL`);
    await query(`ALTER TABLE client_visits MODIFY COLUMN check_in_lng decimal(11,8) NULL`);
    await query(`ALTER TABLE client_visits MODIFY COLUMN photo_in_url varchar(500) NULL`);
    
    console.log('Successfully altered columns to allow NULLs.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
fixDB();
