const db = require('../config/database');

const name = 'Test Leave';
const code = 'TL';
const desc = 'Test description';
const maxDays = 12;
const carryForward = false;
const status = 'Active';

const sql = `
  INSERT INTO leave_types (name, code, description, max_days, carry_forward, status)
  VALUES (?, ?, ?, ?, ?, ?)
`;

db.query(sql, [name, code, desc || '', maxDays || 12, carryForward ? 1 : 0, status || 'Active'], (err, result) => {
  if (err) {
    console.error('SQL ERROR AS EXPECTED:', err.message, 'Code:', err.code);
  } else {
    console.log('Success:', result);
  }
  process.exit();
});
