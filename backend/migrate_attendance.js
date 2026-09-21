const db = require('./config/database');

async function migrate() {
  try {
    console.log("Running migrations...");
    await new Promise((resolve, reject) => {
      db.query("ALTER TABLE GPSAttendance ADD COLUMN checkout_reason VARCHAR(255)", (err) => {
        if (err && !err.message.includes('Duplicate column')) console.log(err.message);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.query("ALTER TABLE attendance ADD COLUMN checkout_reason VARCHAR(255)", (err) => {
        if (err && !err.message.includes('Duplicate column')) console.log(err.message);
        resolve();
      });
    });
    console.log("Migrations complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
