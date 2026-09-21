const db = require('../config/database');

async function runMigration() {
  console.log('Starting Candidate & Employee Experience Migration...');

  const executeSql = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  };

  try {
    const checkAndAddCol = async (table, col, def) => {
      const rows = await executeSql(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [col]);
      if (!rows || rows.length === 0) {
        console.log(`Adding column ${col} to ${table}...`);
        await executeSql(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
        console.log(`Added column ${col} to ${table}`);
      } else {
        console.log(`Column ${col} already exists in ${table}`);
      }
    };

    await checkAndAddCol('employees', 'candidate_id', 'INT NULL AFTER id');
    await checkAndAddCol('employees', 'experience_type', 'VARCHAR(50) DEFAULT "Experienced" AFTER shift_type');
    await checkAndAddCol('employees', 'total_experience_years', 'INT DEFAULT 0 AFTER experience_type');
    await checkAndAddCol('employees', 'total_experience_months', 'INT DEFAULT 0 AFTER total_experience_years');
    await checkAndAddCol('employees', 'relevant_experience_years', 'INT DEFAULT 0 AFTER total_experience_months');
    await checkAndAddCol('employees', 'relevant_experience_months', 'INT DEFAULT 0 AFTER relevant_experience_years');

    console.log('Creating candidate_experiences table if not exists...');
    await executeSql(`
      CREATE TABLE IF NOT EXISTS candidate_experiences (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT UNSIGNED NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        department VARCHAR(255) NULL,
        employment_type VARCHAR(50) NOT NULL DEFAULT 'Full Time',
        start_date DATE NOT NULL,
        end_date DATE NULL,
        is_currently_working TINYINT(1) DEFAULT 0,
        duration_months INT NULL,
        company_location VARCHAR(255) NULL,
        reason_for_leaving TEXT NULL,
        job_description TEXT NULL,
        last_drawn_ctc DECIMAL(12,2) NULL,
        reporting_manager VARCHAR(255) NULL,
        reference_name VARCHAR(255) NULL,
        reference_designation VARCHAR(255) NULL,
        reference_contact VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_candidate_id (candidate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('candidate_experiences table ready.');

    console.log('Creating employee_previous_experiences table if not exists...');
    await executeSql(`
      CREATE TABLE IF NOT EXISTS employee_previous_experiences (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        candidate_experience_id INT UNSIGNED NULL,
        company_name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        department VARCHAR(255) NULL,
        employment_type VARCHAR(50) NOT NULL DEFAULT 'Full Time',
        start_date DATE NOT NULL,
        end_date DATE NULL,
        is_currently_working TINYINT(1) DEFAULT 0,
        duration_months INT NULL,
        company_location VARCHAR(255) NULL,
        reason_for_leaving TEXT NULL,
        job_description TEXT NULL,
        last_drawn_ctc DECIMAL(12,2) NULL,
        reporting_manager VARCHAR(255) NULL,
        reference_name VARCHAR(255) NULL,
        reference_designation VARCHAR(255) NULL,
        reference_contact VARCHAR(255) NULL,
        verification_status ENUM('Pending', 'Verified', 'Rejected', 'Unable to Verify') NOT NULL DEFAULT 'Pending',
        verification_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_emp_id (employee_id),
        INDEX idx_cand_exp_id (candidate_experience_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('employee_previous_experiences table ready.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
