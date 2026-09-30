const db = require('../config/database');
const tables = ["attendance", "GPSAttendance", "leave_applications", "leave_balances", "tasks", "notifications", "goals", "payslips", "payroll_runs", "employee_documents"];

async function run() {
  for (const t of tables) {
    const count = await new Promise(r => db.query("SELECT count(*) as c FROM " + t, (e, res) => r(res ? res[0].c : e.message)));
    console.log(t, ":", count);
  }
  process.exit(0);
}
run();
