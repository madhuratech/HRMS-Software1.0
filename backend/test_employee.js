const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function test() {
  const password_hash = await bcrypt.hash('Admin2026', 10);
  const sql = `
        INSERT INTO employees
        (name, email, phone, dob, join_date, gender, employment_type, experience, experience_type, total_experience_years, total_experience_months, relevant_experience_years, relevant_experience_months, shift_type, salary, address, emergency_contact, bank_details, password_hash, branch_id, department_id, designation_id, manager_id, team_id)
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          (SELECT id FROM branches WHERE branch_name = ? LIMIT 1),
          (SELECT id FROM departments WHERE dept_name = ? LIMIT 1),
          (SELECT id FROM designations WHERE role_name = ? OR role_code = ? LIMIT 1),
          (SELECT id FROM (SELECT id FROM employees WHERE name = ? LIMIT 1) as temp),
          (SELECT id FROM teams WHERE name = ? LIMIT 1)
        )
      `;
      
  db.query(sql, [
    'Test Name', 'test999@test.com', '1234567890', '1990-01-01', '2026-01-01', 'Male', 'Full-time', null, 'Fresher', 0, 0, 0, 0, 'Regular Shift', 60000, 'Test Address', 'Test Contact', '{}', password_hash,
    'Downtown', 'Engineering', 'Developer', 'Developer', 'Manager', 'Team'
  ], (err, result) => {
    if (err) {
      console.error("ERROR:", err);
    } else {
      console.log("SUCCESS:", result);
    }
    process.exit();
  });
}

test();
