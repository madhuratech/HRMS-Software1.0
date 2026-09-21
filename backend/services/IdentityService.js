const db = require('../config/database');

class IdentityService {
  /**
   * Authoritative Central User & Role Resolution Method
   * Resolves complete identity from DB:
   * - userId
   * - employeeId
   * - employeeCode
   * - name
   * - email
   * - role (canonical uppercase e.g. SUPER_ADMIN, HR_MANAGER, TEAM_LEADER, EMPLOYEE)
   * - permissions
   */
  static async resolveUser(identifier) {
    if (!identifier) return null;

    const sql = `
      SELECT 
        u.id as user_id,
        u.email as user_email,
        u.full_name as user_name,
        u.role as user_table_role,
        u.account_status,
        e.id as emp_id,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        e.name as emp_name,
        e.department_id,
        e.designation_id,
        e.team_id,
        r.role_key as emp_role_key,
        r.name as emp_role_name,
        desg.role_name as designation_name
      FROM users u
      LEFT JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN designations desg ON e.designation_id = desg.id
      WHERE u.id = ? OR LOWER(u.email) = LOWER(?) OR e.id = ? OR LOWER(e.email) = LOWER(?)
      ORDER BY (u.id = ?) DESC, (e.id = ?) DESC
      LIMIT 1
    `;

    const isNum = !isNaN(parseInt(identifier)) && parseInt(identifier) > 0;
    const numId = isNum ? parseInt(identifier) : 0;
    const strId = String(identifier).trim();

    return new Promise((resolve, reject) => {
      db.query(sql, [numId, strId, numId, strId, numId, numId], async (err, rows) => {
        if (err) return reject(err);

        const processResolvedRow = async (row) => {
          // Authoritative Role Resolution:
          // 1. users.role (primary account role)
          // 2. roles.role_key from linked employee
          // 3. designation/email heuristics
          let primaryRole = 'EMPLOYEE';
          const userRoleUpper = (row.user_table_role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
          const empRoleUpper = (row.emp_role_key || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
          const desgLower = (row.designation_name || '').toLowerCase();
          const emailLower = (row.user_email || row.emp_email || '').toLowerCase();

          if (['SUPER_ADMIN', 'ADMIN', 'SUPERADMIN'].includes(userRoleUpper) || ['SUPER_ADMIN', 'ADMIN'].includes(empRoleUpper) || emailLower.includes('admin')) {
            primaryRole = 'SUPER_ADMIN';
          } else if (['HR_MANAGER', 'HR', 'HR_ADMIN', 'BRANCH_MANAGER'].includes(userRoleUpper) || ['HR_MANAGER', 'HR', 'HR_ADMIN'].includes(empRoleUpper) || desgLower.includes('hr')) {
            primaryRole = 'HR_MANAGER';
          } else if (['TEAM_LEADER', 'TEAM_LEAD', 'LEAD'].includes(userRoleUpper) || ['TEAM_LEADER', 'TEAM_LEAD'].includes(empRoleUpper) || desgLower.includes('team leader') || desgLower.includes('team lead')) {
            primaryRole = 'TEAM_LEADER';
          } else if (userRoleUpper) {
            primaryRole = userRoleUpper;
          } else if (empRoleUpper) {
            primaryRole = empRoleUpper;
          }

          const RbacService = require('./RbacService');
          const permissions = await RbacService.getUserPermissions(primaryRole);

          const resolved = {
            userId: row.user_id || row.emp_id,
            employeeId: row.emp_id || row.user_id,
            employeeCode: row.emp_code || `EMP${String(row.emp_id || row.user_id).padStart(4, '0')}`,
            name: row.user_name || row.emp_name || 'User',
            email: row.user_email || row.emp_email,
            role: primaryRole,
            accountStatus: row.account_status || 'Active',
            teamId: row.team_id,
            departmentId: row.department_id,
            designationId: row.designation_id,
            designation: row.designation_name,
            permissions
          };

          resolve(resolved);
        };

        if (rows && rows.length > 0) {
          return processResolvedRow(rows[0]);
        }

        // Fallback: Query starting from employees table for employees without users table record
        const empSql = `
          SELECT 
            u.id as user_id,
            u.email as user_email,
            u.full_name as user_name,
            u.role as user_table_role,
            COALESCE(u.account_status, e.status, 'Active') as account_status,
            e.id as emp_id,
            COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
            e.name as emp_name,
            e.email as emp_email,
            e.department_id,
            e.designation_id,
            e.team_id,
            r.role_key as emp_role_key,
            r.name as emp_role_name,
            desg.role_name as designation_name
          FROM employees e
          LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
          LEFT JOIN roles r ON e.role_id = r.id
          LEFT JOIN designations desg ON e.designation_id = desg.id
          WHERE e.id = ? OR LOWER(e.email) = LOWER(?) OR u.id = ? OR LOWER(u.email) = LOWER(?)
          ORDER BY (e.id = ?) DESC
          LIMIT 1
        `;

        db.query(empSql, [numId, strId, numId, strId, numId], async (empErr, empRows) => {
          if (empErr) return reject(empErr);
          if (!empRows || empRows.length === 0) return resolve(null);
          return processResolvedRow(empRows[0]);
        });
      });
    });
  }
}

module.exports = IdentityService;
