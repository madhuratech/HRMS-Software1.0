-- Database initialization script for HRM Software
-- Target Database: madhurahrms (or your custom database name)

-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Create Designations Table
CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL
);

-- 3. Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    join_date DATE DEFAULT NULL,
    sales_target DECIMAL(12, 2) DEFAULT 0.00,
    branch_id INT,
    designation_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL
);

-- 4. Create Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    punch_type VARCHAR(20) NOT NULL, -- e.g., 'IN', 'OUT'
    punch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. Insert Seed Data
-- Insert Branches
INSERT IGNORE INTO branches (branch_name) VALUES 
('Downtown'),
('Westside'),
('North Hills'),
('East End');

-- Insert Designations
INSERT IGNORE INTO designations (role_code, role_name) VALUES 
('SUPER_ADMIN', 'Super Admin'),
('BRANCH_MANAGER', 'Branch Manager'),
('SALES_MANAGER', 'Sales Manager'),
('SERVICE_STAFF', 'Service Staff');
