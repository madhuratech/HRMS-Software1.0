const db = require('../config/database');

async function fixBalancesSchema() {
  console.log('Fixing leave_balances duplicates and adding unique constraint...');

  // 1. Remove duplicate leave_balances keeping the lowest ID
  await new Promise((res, rej) => {
    const sql = `
      DELETE b1 FROM leave_balances b1
      INNER JOIN leave_balances b2 
      WHERE b1.id > b2.id 
        AND b1.employee_id = b2.employee_id 
        AND b1.leave_type_id = b2.leave_type_id
    `;
    db.query(sql, (err, r) => {
      if (err) return rej(err);
      console.log('Deleted duplicate rows:', r.affectedRows);
      res();
    });
  });

  // 2. Add unique constraint if not already exists
  await new Promise((res) => {
    db.query("ALTER TABLE leave_balances ADD UNIQUE KEY uniq_emp_leave_type (employee_id, leave_type_id)", (err) => {
      if (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log('Unique key already exists.');
        } else {
          console.warn('Index notice:', err.message);
        }
      } else {
        console.log('Unique key uniq_emp_leave_type added successfully!');
      }
      res();
    });
  });

  process.exit(0);
}

fixBalancesSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
