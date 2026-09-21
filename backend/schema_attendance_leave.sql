-- Attendance and Leave Management Schema Patch

-- 1. Daily Attendance
CREATE TABLE IF NOT EXISTS daily_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  punch_in TIME,
  punch_out TIME,
  status VARCHAR(50) DEFAULT 'Present', -- Present, Absent, Half Day, Late
  work_hours DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (employee_id, date)
);

-- 2. Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- Sick Leave, Casual Leave, Earned Leave
  days_allowed INT NOT NULL,
  is_paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0,
  remaining_days DECIMAL(5,2) NOT NULL,
  year INT NOT NULL,
  UNIQUE KEY (employee_id, leave_type_id, year)
);

-- 4. Leave Applications
CREATE TABLE IF NOT EXISTS leave_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Shift Roster
CREATE TABLE IF NOT EXISTS shift_roster (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  shift_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Regularization Requests
CREATE TABLE IF NOT EXISTS regularization_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  requested_punch_in TIME,
  requested_punch_out TIME,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Leave Types
INSERT IGNORE INTO leave_types (id, name, days_allowed, is_paid) VALUES 
(1, 'Sick Leave', 12, TRUE),
(2, 'Casual Leave', 12, TRUE),
(3, 'Earned Leave', 15, TRUE);
