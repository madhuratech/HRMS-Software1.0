const db = require('../config/database');

db.query("SELECT * FROM role_permissions WHERE submodule_key = 'leave_types'", (err, rows) => {
  console.log('leave_types role_permissions:', rows);
  
  // Also check columns of leave_types table!
  db.query("DESCRIBE leave_types", (err2, cols) => {
    console.log('leave_types columns:', cols);
    process.exit();
  });
});
