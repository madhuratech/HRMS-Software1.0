-- CREATE requirement_audit_logs table to track changes
CREATE TABLE IF NOT EXISTS `requirement_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `requirement_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL, -- e.g., 'CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'RESTORED'
  `status_from` VARCHAR(50) NULL,
  `status_to` VARCHAR(50) NULL,
  `performed_by` INT NOT NULL, -- User ID
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
