require("dotenv").config();
const db = require('./config/database');

async function alterTable() {
    try {
        console.log("Altering daily_attendance table...");
        await db.promise().query(`
            ALTER TABLE daily_attendance
            ADD COLUMN work_done TEXT NULL;
        `);
        console.log("Successfully added work_done column.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("work_done column already exists.");
        } else {
            console.error("Error altering table:", e);
        }
    } finally {
        process.exit();
    }
}

alterTable();
