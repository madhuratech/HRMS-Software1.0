const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const sqls = [
    `DROP TABLE IF EXISTS feedback`,
    `DROP TABLE IF EXISTS reviews`,
    `DROP TABLE IF EXISTS appraisals`,
    `DROP TABLE IF EXISTS kras`,
    `DROP TABLE IF EXISTS kpis`,
    `DROP TABLE IF EXISTS goals`,
    `DROP TABLE IF EXISTS training_programs`,
    `CREATE TABLE IF NOT EXISTS training_programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      trainer VARCHAR(100),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE,
      due_date DATE,
      status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
      progress INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS kpis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      target_value VARCHAR(100),
      achieved_value VARCHAR(100),
      weightage INT DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS kras (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS appraisals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      appraisal_cycle VARCHAR(100),
      rating DECIMAL(3, 2),
      feedback TEXT,
      status ENUM('draft', 'submitted', 'reviewed', 'approved') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      review_date DATE,
      comments TEXT,
      rating DECIMAL(3, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      provider_id INT NOT NULL,
      feedback_text TEXT NOT NULL,
      feedback_type ENUM('positive', 'constructive') DEFAULT 'positive',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES employees(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of sqls) {
    try {
      await connection.query(sql);
      console.log('Executed:', sql.substring(0, 50));
    } catch (err) {
      console.error('Error executing:', err.message);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed();
