const xlsx = require('xlsx');
const path = require('path');
const db = require('../config/database');

const excelPath = path.join(__dirname, '..', 'uploads', 'Employees_personal_details.xlsx');
const wb = xlsx.readFile(excelPath);
const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('personal details')) || wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const employeesFromExcel = [];
for (let i = 2; i < raw.length; i++) {
  const row = raw[i];
  if (!row || !row[1] || !row[2]) continue;
  const sno = row[0];
  const name = String(row[1] || '').trim();
  const code = String(row[2] || '').trim();
  const email = String(row[4] || '').trim().toLowerCase();
  if (name && code && code.toLowerCase() !== 'employee code') {
    employeesFromExcel.push({ sno, name, code, email });
  }
}

console.log('Read', employeesFromExcel.length, 'records from Excel.');

async function run() {
  const dbRows = await new Promise((resolve, reject) => {
    db.query('SELECT id, name, email, employee_code, employee_id FROM employees ORDER BY id ASC', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

  for (const emp of employeesFromExcel) {
    const match = dbRows.find(d => 
      (d.email && d.email.toLowerCase() === emp.email) || 
      (d.name && d.name.toLowerCase() === emp.name.toLowerCase())
    );

    if (!match) {
      console.warn(`No match found in DB for ${emp.name} (${emp.email})`);
      continue;
    }

    await new Promise((resolve, reject) => {
      const sql = 'UPDATE employees SET employee_code = ?, employee_id = ? WHERE id = ?';
      db.query(sql, [emp.code, emp.code, match.id], (err, result) => {
        if (err) {
          console.error('Failed to update ' + emp.name, err);
          return reject(err);
        }
        console.log(`Updated ${emp.name} (DB ID: ${match.id}) -> employee_code: ${emp.code}`);
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
        console.log(`DB ID: ${r.id} | Code: ${r.employee_code} | Name: ${r.name}`);
      });
    }
    process.exit(0);
  });
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
