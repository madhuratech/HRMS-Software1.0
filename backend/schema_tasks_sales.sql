CREATE TABLE IF NOT EXISTS task_board (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'review', 'completed') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assignee_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE
);

CREATE TABLE IF NOT EXISTS sales_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    enquiry_details TEXT,
    status ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost') DEFAULT 'new',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    sale_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES sales_enquiries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT,
    followup_date DATE,
    notes TEXT,
    next_action VARCHAR(255),
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES sales_enquiries(id) ON DELETE CASCADE
);

-- Insert sample data for demo purposes since these are new tables
INSERT INTO task_board (title, description, status, priority, assignee_id, due_date) VALUES 
('Quarterly Financial Review', 'Prepare the Q3 financial statements for the board meeting', 'todo', 'high', 1, '2026-09-01'),
('Update Employee Handbook', 'Revise policies regarding remote work and comp-off', 'in_progress', 'medium', 1, '2026-08-20'),
('Client Presentation', 'Draft slides for upcoming enterprise pitch', 'completed', 'high', 1, '2026-08-10');

INSERT INTO sales_enquiries (customer_name, contact_email, contact_phone, enquiry_details, status) VALUES 
('Acme Corp', 'contact@acmecorp.com', '+1-555-0100', 'Looking for enterprise software license for 500 users.', 'new'),
('Globex Inc', 'info@globex.com', '+1-555-0200', 'Interested in the premium support package.', 'contacted');

INSERT INTO sales_entries (enquiry_id, amount, sale_date, notes) VALUES 
(2, 15000.00, '2026-08-01', 'Initial payment received for premium support.');

INSERT INTO sales_followups (enquiry_id, followup_date, notes, next_action, status) VALUES 
(1, '2026-08-15', 'Send product brochure and pricing sheet.', 'Email brochure', 'pending');
