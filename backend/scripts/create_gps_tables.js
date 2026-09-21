const db = require("../config/database");

const createTables = () => {
  const geofenceLocationsSql = `
    CREATE TABLE IF NOT EXISTS GeofenceLocations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      branch VARCHAR(255),
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      radius INT NOT NULL,
      address TEXT,
      description TEXT,
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const gpsAttendanceSql = `
    CREATE TABLE IF NOT EXISTS GPSAttendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      punch_date DATE NOT NULL,
      check_in_time TIMESTAMP NULL,
      check_out_time TIMESTAMP NULL,
      latitude_in DECIMAL(10, 8) NULL,
      longitude_in DECIMAL(11, 8) NULL,
      latitude_out DECIMAL(10, 8) NULL,
      longitude_out DECIMAL(11, 8) NULL,
      punch_in_location VARCHAR(255) NULL,
      punch_out_location VARCHAR(255) NULL,
      working_hours VARCHAR(50) NULL,
      status VARCHAR(50) NULL,
      early_exit TINYINT(1) DEFAULT 0,
      late_entry TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE KEY unique_employee_date (employee_id, punch_date)
    )
  `;

  const attendanceLogsSql = `
    CREATE TABLE IF NOT EXISTS AttendanceLogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      punch_type ENUM('IN', 'OUT') NOT NULL,
      punch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      location_name VARCHAR(255),
      distance DECIMAL(10, 2),
      inside_radius ENUM('Yes', 'No'),
      device_info VARCHAR(255),
      browser VARCHAR(255),
      ip_address VARCHAR(45),
      status ENUM('Success', 'Failed') DEFAULT 'Success',
      failure_reason TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `;

  const locationHistorySql = `
    CREATE TABLE IF NOT EXISTS LocationHistory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `;

  db.query(geofenceLocationsSql, (err) => {
    if (err) {
      console.error("Error creating GeofenceLocations:", err);
      process.exit(1);
    }
    console.log("GeofenceLocations table verified/created.");

    db.query(gpsAttendanceSql, (err) => {
      if (err) {
        console.error("Error creating GPSAttendance:", err);
        process.exit(1);
      }
      console.log("GPSAttendance table verified/created.");

      db.query(attendanceLogsSql, (err) => {
        if (err) {
          console.error("Error creating AttendanceLogs:", err);
          process.exit(1);
        }
        console.log("AttendanceLogs table verified/created.");

        db.query(locationHistorySql, (err) => {
          if (err) {
            console.error("Error creating LocationHistory:", err);
            process.exit(1);
          }
          console.log("LocationHistory table verified/created.");

          // Seed default locations if empty
          db.query("SELECT COUNT(*) as count FROM GeofenceLocations", (err, rows) => {
            if (err) {
              console.error("Error checking GeofenceLocations:", err);
              process.exit(1);
            }
            if (rows[0].count === 0) {
              const seedSql = `
                INSERT INTO GeofenceLocations (name, branch, latitude, longitude, radius, address, description, status) VALUES
                ('Main Headquarters', 'HQ', 12.9718, 77.5945, 100, 'MG Road, Bangalore', 'Primary corporate office', 'Active'),
                ('Branch Office - Downtown', 'Downtown', 12.9730, 77.6190, 150, 'Indiranagar, Bangalore', 'Engineering center', 'Active'),
                ('Remote Office - Tech Hub', 'Tech Hub', 12.9302, 77.5315, 200, 'Jayanagar, Bangalore', 'Support office', 'Active'),
                ('Client Site - Retail Center', 'Retail', 13.0010, 77.5725, 250, 'Malleshwaram, Bangalore', 'Retail division', 'Active')
              `;
              db.query(seedSql, (err) => {
                if (err) console.error("Error seeding GeofenceLocations:", err);
                else console.log("Default GeofenceLocations seeded.");
                process.exit(0);
              });
            } else {
              process.exit(0);
            }
          });
        });
      });
    });
  });
};

createTables();
