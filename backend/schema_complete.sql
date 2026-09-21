-- Complete normalized SQL database schema for Enterprise HRMS

-- Drop existing tables to ensure clean initialization
DROP TABLE IF EXISTS employee_salary_mappings;
DROP TABLE IF EXISTS payslips;
DROP TABLE IF EXISTS payroll_runs;
DROP TABLE IF EXISTS salary_components;
DROP TABLE IF EXISTS salary_structures;
DROP TABLE IF EXISTS leave_applications;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS ticket_priorities;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS roles;

-- 1. Setup Base Organization Tables
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE,
    manager_id INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL
);

-- 2. Setup RBAC Tables
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    perm_code VARCHAR(100) NOT NULL UNIQUE,
    perm_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 3. Core Employee Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    join_date DATE DEFAULT NULL,
    status ENUM('Active', 'Inactive', 'Terminated') DEFAULT 'Active',
    sales_target DECIMAL(12, 2) DEFAULT 0.00,
    branch_id INT,
    department_id INT,
    designation_id INT,
    role_id INT DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- Set manager_id foreign key on departments
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 4. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    punch_type ENUM('IN', 'OUT') NOT NULL,
    punch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. Leave Management
CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    max_days INT NOT NULL,
    forward ENUM('Yes', 'No') DEFAULT 'No'
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    days_used INT DEFAULT 0,
    days_remaining INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    applied_on DATE DEFAULT (CURRENT_DATE),
    approved_by INT DEFAULT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- 6. Compensation, Structures & Components
CREATE TABLE IF NOT EXISTS salary_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    frequency VARCHAR(50) DEFAULT 'Monthly',
    total_ctc DECIMAL(12,2) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS salary_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Earning', 'Deduction', 'Contribution') NOT NULL,
    taxable ENUM('Yes', 'No', 'Partial') DEFAULT 'Yes',
    formula VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'Monthly',
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

-- Mapping Employees to Salary Structures
CREATE TABLE IF NOT EXISTS employee_salary_mappings (
    employee_id INT PRIMARY KEY,
    structure_id INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE
);

-- 7. Payroll Processes & Payslips
CREATE TABLE IF NOT EXISTS payroll_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_month VARCHAR(20) NOT NULL,
    period_year VARCHAR(10) NOT NULL,
    status ENUM('Draft', 'Processing', 'Approved', 'Paid') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_period (period_month, period_year)
);

CREATE TABLE IF NOT EXISTS payslips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id INT NOT NULL,
    employee_id INT NOT NULL,
    basic DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0.00,
    deductions DECIMAL(12,2) DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL,
    status ENUM('Draft', 'Processed', 'Paid') DEFAULT 'Draft',
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 8. Project & Task Board
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Not Started', 'In Progress', 'On Hold', 'Completed') DEFAULT 'Not Started'
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    assignee_id INT,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Todo', 'In Progress', 'Testing', 'Done') DEFAULT 'Todo',
    due_date DATE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- 9. Support Tickets / Help Desk
CREATE TABLE IF NOT EXISTS ticket_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ticket_priorities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    category_id INT,
    priority_id INT,
    subject VARCHAR(150) NOT NULL,
    description TEXT,
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id) ON DELETE SET NULL
);

-- Seed Initial Data
INSERT IGNORE INTO roles (name) VALUES 
('SUPER_ADMIN'),
('BRANCH_MANAGER'),
('SALES_MANAGER'),
('SERVICE_STAFF');

INSERT IGNORE INTO branches (branch_name, location) VALUES 
('Downtown', 'HQ Main'),
('Westside', 'Sales West'),
('North Hills', 'IT Center'),
('East End', 'Logistics East');

INSERT IGNORE INTO designations (role_code, role_name) VALUES 
('SUPER_ADMIN', 'Super Admin'),
('BRANCH_MANAGER', 'Branch Manager'),
('SALES_MANAGER', 'Sales Manager'),
('SERVICE_STAFF', 'Service Staff');

INSERT IGNORE INTO departments (dept_name) VALUES 
('Engineering'),
('Sales'),
('Marketing'),
('Customer Support'),
('Human Resources');

INSERT IGNORE INTO leave_types (name, code, max_days, forward) VALUES 
('Casual Leave', 'CL', 12, 'No'),
('Sick Leave', 'SL', 10, 'No'),
('Privilege Leave', 'PL', 15, 'Yes'),
('Paternity Leave', 'PTL', 15, 'No'),
('Compensatory Off', 'COMP', 10, 'No');

-- Add default super administrator record (Password: Admin2026)
INSERT IGNORE INTO employees (name, email, phone, dob, join_date, status, branch_id, department_id, designation_id, role_id, password_hash)
VALUES (
  'Super Admin',
  'admin@madhuratech.com',
  '+919999999999',
  '1990-01-01',
  '2024-01-01',
  'Active',
  1,
  5,
  1,
  1,
  '$2b$10$Wq9q0pREtP8xHnFw24zK3.l3Lw73f3c/4zQ7Jj6NfTzC7s9Lw9J5i' -- BCrypt hash for 'Admin2026'
);
