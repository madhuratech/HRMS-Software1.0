const db = require('../config/database');

async function seedLeaveData() {
  console.log('--- Initializing Leave Types and Balances ---');

  // 1. Check & Insert Leave Types
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
        `INSERT INTO leave_types (name, code, max_days, forward, type_name, days_allowed, is_paid)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE max_days = VALUES(max_days), days_allowed = VALUES(days_allowed)`,
        [t.name, t.code, t.max_days, t.forward, t.type_name, t.days_allowed, t.is_paid],
        (err, res) => {
          if (err) console.error(`Error inserting type ${t.code}:`, err.message);
          else console.log(`Leave type ${t.name} (${t.code}) ready.`);
          resolve();
        }
      );
    });
  }

  // 2. Fetch all leave types from DB
  const leaveTypes = await new Promise((resolve) => {
    db.query('SELECT id, name, code, max_days FROM leave_types', (err, rows) => resolve(rows || []));
  });
  console.log(`Fetched ${leaveTypes.length} leave types.`);

  const typeMap = {};
  leaveTypes.forEach(lt => { typeMap[lt.code] = lt.id; });

  // 3. Specific seed for Dhilipan P (ID 10): CL: 5, SL: 3, EL: 8
  const dhilipanBalances = [
    { code: 'CL', remaining: 5, used: 7 },
    { code: 'SL', remaining: 3, used: 7 },
    { code: 'EL', remaining: 8, used: 7 },
    { code: 'PL', remaining: 15, used: 0 },
    { code: 'COMP', remaining: 10, used: 0 }
  ];

  for (const b of dhilipanBalances) {
    const typeId = typeMap[b.code];
    if (typeId) {
      await new Promise((resolve) => {
        db.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining)
           VALUES (10, ?, ?, ?)
           ON DUPLICATE KEY UPDATE days_used = VALUES(days_used), days_remaining = VALUES(days_remaining)`,
          [typeId, b.used, b.remaining],
          (err) => {
            if (err) console.error(`Error inserting balance for Dhilipan ${b.code}:`, err.message);
            else console.log(`Dhilipan P (EMP10) -> ${b.code}: ${b.remaining} remaining, ${b.used} used.`);
            resolve();
          }
        );
      });
    }
  }

  // 4. Seed for Dinakaran R (ID 11): Full balances
  const dinaBalances = [
    { code: 'CL', remaining: 12, used: 0 },
    { code: 'SL', remaining: 10, used: 0 },
    { code: 'EL', remaining: 15, used: 0 },
    { code: 'PL', remaining: 15, used: 0 },
    { code: 'COMP', remaining: 10, used: 0 }
  ];

  for (const b of dinaBalances) {
    const typeId = typeMap[b.code];
    if (typeId) {
      await new Promise((resolve) => {
        db.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining)
           VALUES (11, ?, ?, ?)
           ON DUPLICATE KEY UPDATE days_used = VALUES(days_used), days_remaining = VALUES(days_remaining)`,
          [typeId, b.used, b.remaining],
          (err) => {
            if (err) console.error(`Error inserting balance for Dinakaran ${b.code}:`, err.message);
            else console.log(`Dinakaran R (EMP11) -> ${b.code}: ${b.remaining} remaining, ${b.used} used.`);
            resolve();
          }
        );
      });
    }
  }

  // 5. Seed for Muthu (ID 9)
  const muthuBalances = [
    { code: 'CL', remaining: 10, used: 2 },
    { code: 'SL', remaining: 9, used: 1 },
    { code: 'EL', remaining: 15, used: 0 },
    { code: 'PL', remaining: 15, used: 0 },
    { code: 'COMP', remaining: 10, used: 0 }
  ];

  for (const b of muthuBalances) {
    const typeId = typeMap[b.code];
    if (typeId) {
      await new Promise((resolve) => {
        db.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining)
           VALUES (9, ?, ?, ?)
           ON DUPLICATE KEY UPDATE days_used = VALUES(days_used), days_remaining = VALUES(days_remaining)`,
          [typeId, b.used, b.remaining],
          (err) => {
            if (err) console.error(`Error inserting balance for Muthu ${b.code}:`, err.message);
            else console.log(`Muthu (EMP9) -> ${b.code}: ${b.remaining} remaining, ${b.used} used.`);
            resolve();
          }
        );
      });
    }
  }

  console.log('--- Seeding finished successfully! ---');
  process.exit(0);
}

seedLeaveData();
