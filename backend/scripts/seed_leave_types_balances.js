const db = require('../config/database');

async function initLeaveData() {
  console.log('--- Initializing Standard Leave Types and Employee Balances ---');

  const standardTypes = [
    { name: 'Casual Leave', code: 'CL', max_days: 12, forward: 'No', type_name: 'Casual Leave', days_allowed: 12, is_paid: 1 },
    { name: 'Sick Leave', code: 'SL', max_days: 10, forward: 'No', type_name: 'Sick Leave', days_allowed: 10, is_paid: 1 },
    { name: 'Earned Leave', code: 'EL', max_days: 15, forward: 'Yes', type_name: 'Earned Leave', days_allowed: 15, is_paid: 1 },
    { name: 'Paternity Leave', code: 'PL', max_days: 15, forward: 'No', type_name: 'Paternity Leave', days_allowed: 15, is_paid: 1 },
    { name: 'Maternity Leave', code: 'ML', max_days: 180, forward: 'No', type_name: 'Maternity Leave', days_allowed: 180, is_paid: 1 },
    { name: 'Bereavement Leave', code: 'BL', max_days: 5, forward: 'No', type_name: 'Bereavement Leave', days_allowed: 5, is_paid: 1 },
    { name: 'Compensatory Off', code: 'COMP', max_days: 10, forward: 'No', type_name: 'Compensatory Off', days_allowed: 10, is_paid: 1 }
  ];

  for (const t of standardTypes) {
    await new Promise((resolve) => {
      db.query(
        `INSERT INTO leave_types (name, code, max_days, forward, type_name, days_allowed, is_paid, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE max_days = VALUES(max_days), days_allowed = VALUES(days_allowed), status = 'Active'`,
        [t.name, t.code, t.max_days, t.forward, t.type_name, t.days_allowed, t.is_paid],
        (err) => {
          if (err) console.error(`Error inserting type ${t.code}:`, err.message);
          resolve();
        }
      );
    });
  }

  const leaveTypes = await new Promise((resolve) => {
    db.query('SELECT id, name, code, max_days FROM leave_types', (err, rows) => resolve(rows || []));
  });

  const employees = await new Promise((resolve) => {
    db.query('SELECT id, name FROM employees', (err, rows) => resolve(rows || []));
  });

  console.log(`Setting up leave balances for ${employees.length} employees across ${leaveTypes.length} leave types...`);

  for (const emp of employees) {
    for (const lt of leaveTypes) {
      await new Promise((resolve) => {
        db.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining)
           VALUES (?, ?, 0, ?)
           ON DUPLICATE KEY UPDATE days_remaining = VALUES(days_remaining)`,
          [emp.id, lt.id, lt.max_days],
          resolve
        );
      });
    }
  }

  console.log('✅ Leave types and employee balances initialized successfully.');
  process.exit(0);
}

initLeaveData().catch(e => { console.error(e); process.exit(1); });
