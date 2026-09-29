const xlsx = require('xlsx');
const path = require('path');
const db = require('../config/database');

const excelPath = path.join(__dirname, '..', 'uploads', 'Employees_personal_details.xlsx');
const wb = xlsx.readFile(excelPath);
const sheet = wb.Sheets['Employees personal details '];
const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const employeesFromExcel = [];
for (let i = 1; i < raw.length; i++) {
  const row = raw[i];
  if (!row || !row[1]) continue;
  const sno = row[0];
  const name = String(row[1] || '').trim();
  const code = String(row[2] || '').trim();
  const email = String(row[4] || '').trim().toLowerCase();
  if (name && code && code !== 'Employee Code') {
    employeesFromExcel.push({ sno, name, code, email });
  }
}

console.log('Read', employeesFromExcel.length, 'records from Excel.');

async function run() {
  for (const emp of employeesFromExcel) {
    await new Promise((resolve, reject) => {
      const sql = 'UPDATE employees SET employee_code = ?, employee_id = ? WHERE email = ? OR id = ? OR LOWER(name) = LOWER(?)';
      db.query(sql, [emp.code, emp.code, emp.email, emp.sno, emp.name], (err, result) => {
        if (err) {
          console.error('Failed to update ' + emp.name, err);
          return reject(err);
        }
        console.log('Updated ' + emp.name + ' (ID: ' + emp.sno + ') -> employee_code: ' + emp.code);
        resolve();
      });
    });
  }

  db.query('SELECT id, employee_code, employee_id, name, email FROM employees ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('\n--- VERIFICATION OF DATABASE EMPLOYEES ---');
      rows.forEach(r => {
        console.log(`ID: ${r.id} | Code: ${r.employee_code} | Name: ${r.name}`);
      });
    }
    process.exit(0);
  });
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
