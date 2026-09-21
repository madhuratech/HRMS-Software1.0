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
    `INSERT INTO training_programs (title, description, trainer, start_date, end_date, status) VALUES
    ('Advanced React Native', 'Deep dive into Expo and animations', 'John Doe', '2026-09-01', '2026-09-05', 'planned'),
    ('Leadership Skills', 'Management training for team leads', 'Jane Smith', '2026-08-15', '2026-08-16', 'ongoing')`,

    `INSERT INTO goals (employee_id, title, description, start_date, due_date, status, progress) VALUES
    (1, 'Complete Phase 4', 'Finish all mobile screens', '2026-08-01', '2026-08-31', 'in_progress', 60)`,

    `INSERT INTO kpis (employee_id, title, target_value, achieved_value) VALUES
    (1, 'Customer Satisfaction', '95%', '92%')`,

    `INSERT INTO kras (employee_id, title, description) VALUES
    (1, 'Software Development', 'Maintain and develop new features for the HRMS product.')`,

    `INSERT INTO appraisals (employee_id, appraisal_cycle, rating, feedback, status) VALUES
    (1, 'Q3 2026', 4.5, 'Excellent progress on the mobile app.', 'reviewed')`,

    `INSERT INTO reviews (employee_id, reviewer_id, review_date, comments, rating) VALUES
    (1, 1, '2026-08-10', 'Great team player, always delivers on time.', 4.8)`,

    `INSERT INTO feedback (employee_id, provider_id, feedback_text, feedback_type) VALUES
    (1, 1, 'Great work on the last sprint!', 'positive')`
  ];

  for (const sql of sqls) {
    try {
      await connection.query(sql);
      console.log('Executed insert.');
    } catch (err) {
      console.error('Error executing insert:', err.message);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed();
