CREATE TABLE IF NOT EXISTS training_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  trainer VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
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
);

CREATE TABLE IF NOT EXISTS kpis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_value VARCHAR(100),
  achieved_value VARCHAR(100),
  weightage INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appraisals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  appraisal_cycle VARCHAR(100),
  rating DECIMAL(3, 2),
  feedback TEXT,
  status ENUM('draft', 'submitted', 'reviewed', 'approved') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
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
);

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  provider_id INT NOT NULL,
  feedback_text TEXT NOT NULL,
  feedback_type ENUM('positive', 'constructive') DEFAULT 'positive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Insert Dummy Data for Demo (User wants no "dummy data" on frontend hardcoded, but starting with 1 row in DB helps demo it)
INSERT INTO training_programs (title, description, trainer, start_date, end_date, status) VALUES
('Advanced React Native', 'Deep dive into Expo and animations', 'John Doe', '2026-09-01', '2026-09-05', 'planned'),
('Leadership Skills', 'Management training for team leads', 'Jane Smith', '2026-08-15', '2026-08-16', 'ongoing');

INSERT INTO goals (employee_id, title, description, start_date, due_date, status, progress) VALUES
(1, 'Complete Phase 4', 'Finish all mobile screens', '2026-08-01', '2026-08-31', 'in_progress', 60);

INSERT INTO kpis (employee_id, title, target_value, achieved_value) VALUES
(1, 'Customer Satisfaction', '95%', '92%');

INSERT INTO kras (employee_id, title, description) VALUES
(1, 'Software Development', 'Maintain and develop new features for the HRMS product.');

INSERT INTO appraisals (employee_id, appraisal_cycle, rating, feedback, status) VALUES
(1, 'Q3 2026', 4.5, 'Excellent progress on the mobile app.', 'reviewed');

INSERT INTO reviews (employee_id, reviewer_id, review_date, comments, rating) VALUES
(1, 2, '2026-08-10', 'Great team player, always delivers on time.', 4.8);

INSERT INTO feedback (employee_id, provider_id, feedback_text, feedback_type) VALUES
(1, 2, 'Great work on the last sprint!', 'positive');
