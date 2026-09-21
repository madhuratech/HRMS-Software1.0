const db = require('./config/database');

async function updateDB() {
  try {
    const util = require('util');
    const query = util.promisify(db.query).bind(db);

    await query(`ALTER TABLE client_visits ADD COLUMN start_journey_time datetime NULL AFTER date`);
  } catch(e) {}
  
  try {
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    await query(`ALTER TABLE client_visits ADD COLUMN end_journey_time datetime NULL AFTER photo_out_url`);
  } catch(e) {}

  try {
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    await query(`ALTER TABLE client_visits MODIFY COLUMN status ENUM('Active', 'Travelling', 'In Meeting', 'Returning', 'Completed') DEFAULT 'Travelling'`);
    await query(`UPDATE client_visits SET status = 'Travelling' WHERE status = 'Active'`);
    await query(`ALTER TABLE client_visits MODIFY COLUMN status ENUM('Travelling', 'In Meeting', 'Returning', 'Completed') DEFAULT 'Travelling'`);
    
    console.log('Successfully updated client_visits schema.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
updateDB();
