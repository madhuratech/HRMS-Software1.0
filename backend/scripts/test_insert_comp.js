const db = require('../config/database');

const sql = `
  INSERT INTO salary_components (name, type, taxable, calc_type, percentage_value, percentage_basis, status, is_statutory)
  VALUES ('Basic Salary', 'Earning', 'Yes', 'percentage', 50, 'gross', 'Active', 0)
`;

db.query(sql, (err, res) => {
  console.log('INSERT RESULT:', res, 'ERR:', err);
  process.exit(0);
});
