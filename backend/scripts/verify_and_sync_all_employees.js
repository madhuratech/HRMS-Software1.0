const xlsx = require('xlsx');
const path = require('path');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const excelPath = path.join(__dirname, '..', 'uploads', 'Employees_personal_details.xlsx');
const wb = xlsx.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

function excelDateToJS(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const s = serial.trim();
    // Format DD/MM/YYYY or D/M/YYYY
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
    return s;
  }
  if (typeof serial === 'number') {
    // Excel epoch 1899-12-30
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }
  return null;
}

async function run() {
  console.log('--- EXCEL & DB EMPLOYEE SYNC & VERIFICATION ---');

  // Load departments, designations, branches
  const depts = await new Promise(r => db.query("SELECT id, dept_name FROM departments", (e, rows) => r(rows || [])));
  const desgs = await new Promise(r => db.query("SELECT id, role_name FROM designations", (e, rows) => r(rows || [])));

  // Ensure Head Office branch exists
  let branchId = null;
  const branches = await new Promise(r => db.query("SELECT id, branch_name FROM branches", (e, rows) => r(rows || [])));
  if (branches.length === 0) {
    const insBranch = await new Promise(r => db.query("INSERT INTO branches (branch_name, location) VALUES ('Head Office', 'Coimbatore')", (e, res) => r(res)));
    branchId = insBranch.insertId;
  } else {
    branchId = branches[0].id;
  }

  // Parse Excel
  const excelEmployees = [];
  for (let i = 2; i < raw.length; i++) {
    const r = raw[i];
    if (!r || !r[1] || !r[2]) continue;
    const sno = r[0];
    const name = String(r[1]).trim();
    const code = String(r[2]).trim().replace(/\s+/g, '');
    const phone = r[3] ? String(r[3]).trim() : '';
    let email = r[4] ? String(r[4]).trim().toLowerCase() : '';
    if (email === 'vishmivishmitha81@gamil.com') email = 'vishmivishmitha81@gmail.com';
    const emergency = r[5] ? String(r[5]).trim() : '';
    const address = r[6] ? String(r[6]).trim() : '';
    const salary = parseFloat(r[7]) || 0;
    const bankAcc = r[8] ? String(r[8]).trim() : '';
    const ifsc = r[9] ? String(r[9]).trim() : '';
    const branchName = r[10] ? String(r[10]).trim() : 'Head Office';
    const doj = excelDateToJS(r[11]);
    const desgText = r[12] ? String(r[12]).trim() : '';
    const dob = excelDateToJS(r[13]);
    const bloodGroup = r[14] ? String(r[14]).trim() : '';

    if (name && code && code.startsWith('MT/')) {
      excelEmployees.push({
        sno, name, code, phone, email, emergency, address, salary, bankAcc, ifsc, branchName, doj, desgText, dob, bloodGroup
      });
    }
  }

  console.log(`Parsed ${excelEmployees.length} employees from Excel.`);

  const dbEmps = await new Promise(r => db.query("SELECT * FROM employees", (e, rows) => r(rows || [])));
  console.log(`Found ${dbEmps.length} employees currently in database.`);

  for (const exp of excelEmployees) {
    // Find matching in DB by code or email or name
    let dbMatch = dbEmps.find(d => 
      (d.employee_code && d.employee_code.trim() === exp.code) ||
      (d.email && d.email.trim().toLowerCase() === exp.email.toLowerCase()) ||
      (d.name && d.name.trim().toLowerCase() === exp.name.toLowerCase())
    );

    // Map department & designation
    let matchedDesgId = null;
    let matchedDeptId = null;

    const desgNorm = exp.desgText.toLowerCase();
    if (desgNorm.includes('manager') && desgNorm.includes('hr')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('resource manager'))?.id || 23;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('human resources'))?.id || 12;
    } else if (desgNorm.includes('full stack') || desgNorm.includes('developer')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('full stack developer'))?.id || 26;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('development'))?.id || 13;
    } else if (desgNorm.includes('designer') || desgNorm.includes('ui/ux') || desgNorm.includes('graphic')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('ui/ux'))?.id || 29;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('design'))?.id || 14;
    } else if (desgNorm.includes('marketting') || desgNorm.includes('marketing') || desgNorm.includes('seo')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('digital marketing'))?.id || 33;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('marketing'))?.id || 16;
    } else if (desgNorm.includes('project manager')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('project manager'))?.id || 36;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('development'))?.id || 13;
    } else if (desgNorm.includes('videographer')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('videographer'))?.id || 35;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('media'))?.id || 18;
    } else if (desgNorm.includes('sales')) {
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('sales'))?.id || 17;
    } else if (desgNorm.includes('human resource') || desgNorm.includes('hr')) {
      matchedDesgId = desgs.find(d => d.role_name.toLowerCase().includes('resource executive'))?.id || 24;
      matchedDeptId = depts.find(d => d.dept_name.toLowerCase().includes('human resources'))?.id || 12;
    }

    const bankDetails = JSON.stringify({
      bankName: exp.branchName || '',
      accountNumber: exp.bankAcc || '',
      ifscCode: exp.ifsc || ''
    });

    const firstName = exp.name.split(' ')[0];
    const defaultPassword = `${firstName}@123`;
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    if (dbMatch) {
      // Update employee details to match Excel
      const updSql = `
        UPDATE employees SET
          name = ?,
          employee_code = ?,
          employee_id = ?,
          email = ?,
          phone = COALESCE(NULLIF(?, ''), phone),
          emergency_contact = COALESCE(NULLIF(?, ''), emergency_contact),
          address = COALESCE(NULLIF(?, ''), address),
          salary = CASE WHEN salary = 0 OR salary IS NULL THEN ? ELSE salary END,
          bank_details = COALESCE(NULLIF(?, ''), bank_details),
          branch_id = COALESCE(branch_id, ?),
          join_date = COALESCE(join_date, ?),
          dob = COALESCE(dob, ?),
          blood_group = COALESCE(NULLIF(?, ''), blood_group),
          department_id = COALESCE(department_id, ?),
          designation_id = COALESCE(designation_id, ?),
          password_hash = COALESCE(password_hash, ?)
        WHERE id = ?
      `;
      await new Promise(r => db.query(updSql, [
        exp.name, exp.code, exp.code, exp.email, exp.phone, exp.emergency, exp.address,
        exp.salary, bankDetails, branchId, exp.doj, exp.dob, exp.bloodGroup,
        matchedDeptId, matchedDesgId, passwordHash, dbMatch.id
      ], r));
      console.log(`Updated DB Employee ID ${dbMatch.id}: ${exp.name} (${exp.code})`);
    } else {
      // Insert missing employee (e.g. Anisha M)
      const insSql = `
        INSERT INTO employees (
          name, employee_code, employee_id, email, phone, emergency_contact, address,
          salary, bank_details, branch_id, join_date, dob, blood_group,
          department_id, designation_id, status, password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
      `;
      const insRes = await new Promise(r => db.query(insSql, [
        exp.name, exp.code, exp.code, exp.email, exp.phone, exp.emergency, exp.address,
        exp.salary, bankDetails, branchId, exp.doj, exp.dob, exp.bloodGroup,
        matchedDeptId, matchedDesgId, passwordHash
      ], (e, res) => {
        if (e) console.error("Error inserting employee " + exp.name, e);
        r(res);
      }));
      const newEmpId = insRes.insertId;
      console.log(`✅ Inserted missing employee into DB: ${exp.name} (${exp.code}) -> New DB ID: ${newEmpId}`);
      dbMatch = { id: newEmpId, email: exp.email, name: exp.name };
    }

    // Now ensure matching user account in `users` table
    const userRole = (exp.code === 'MT/0305' || exp.code === 'MT/0319' || exp.code === 'MT/0328') ? 'HR_MANAGER' : 'EMPLOYEE';
    const userRows = await new Promise(r => db.query(
      "SELECT id, employee_id, email FROM users WHERE employee_id = ? OR LOWER(email) = LOWER(?)",
      [dbMatch.id, exp.email],
      (e, rows) => r(rows || [])
    ));

    if (userRows.length > 0) {
      const u = userRows[0];
      // Ensure user points to the exact employee DB ID and has correct password & role
      await new Promise(r => db.query(
        "UPDATE users SET employee_id = ?, full_name = ?, email = ?, password_hash = COALESCE(password_hash, ?), role = ? WHERE id = ?",
        [dbMatch.id, exp.name, exp.email, passwordHash, userRole, u.id],
        r
      ));
      console.log(`Synced user ID ${u.id} -> employee_id: ${dbMatch.id} (${exp.name})`);
    } else {
      // Create user account
      const insUser = await new Promise(r => db.query(
        "INSERT INTO users (employee_id, full_name, email, password_hash, role, email_verified, email_verified_at, account_status) VALUES (?, ?, ?, ?, ?, 1, NOW(), 'Active')",
        [dbMatch.id, exp.name, exp.email, passwordHash, userRole],
        (e, res) => r(res)
      ));
      console.log(`✅ Created user account for ${exp.name} (user ID ${insUser.insertId}) -> employee_id: ${dbMatch.id}`);
    }
  }

  // Clean orphan records in bonus_incentives and notifications
  await new Promise(r => db.query("DELETE FROM bonus_incentives WHERE employee_id NOT IN (SELECT id FROM employees)", r));
  await new Promise(r => db.query("DELETE FROM notifications WHERE recipient_employee_id IS NOT NULL AND recipient_employee_id NOT IN (SELECT id FROM employees)", r));
  console.log("Cleaned orphan bonus_incentives and orphan notifications.");

  console.log('--- ALL EMPLOYEES & USERS SYNCHRONIZED SUCCESSFULLY ---');
  process.exit(0);
}

run().catch(e => {
  console.error("Sync error:", e);
  process.exit(1);
});
