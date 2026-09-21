const db = require('../config/database');

async function updatePermissions() {
  console.log('Updating role_permissions for comp_off and leave_approval...');

  // 1. Employee: can_view=1, can_create=1 for comp_off
  await new Promise((res, rej) => {
    const sql = `
      UPDATE role_permissions 
      SET can_view = 1, can_create = 1 
      WHERE UPPER(role_key) = 'EMPLOYEE' AND submodule_key = 'comp_off'
    `;
    db.query(sql, (err, result) => {
      if (err) return rej(err);
      console.log('Employee comp_off updated:', result.affectedRows, 'row(s)');
      res();
    });
  });

  // 2. Team Leader: can_view=1, can_create=1, can_edit=1 for comp_off and leave_approval
  await new Promise((res, rej) => {
    const sql = `
      UPDATE role_permissions 
      SET can_view = 1, can_create = 1, can_edit = 1 
      WHERE UPPER(role_key) = 'TEAM_LEADER' AND submodule_key IN ('comp_off', 'leave_approval')
    `;
    db.query(sql, (err, result) => {
      if (err) return rej(err);
      console.log('Team leader permissions updated:', result.affectedRows, 'row(s)');
      res();
    });
  });

  console.log('Database role_permissions updated successfully!');
  process.exit(0);
}

updatePermissions().catch(err => {
  console.error(err);
  process.exit(1);
});
