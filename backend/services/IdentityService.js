const db = require('../config/database');

class IdentityService {
  /**
   * Authoritative Central User & Role Resolution Method
   * Resolves complete identity from DB:
   * - userId
   * - employeeId (null for admin without employee record)
   * - employeeCode (actual business code, e.g. MT/0309)
   * - name (actual employee name)
   * - email
   * - role (canonical uppercase e.g. SUPER_ADMIN, HR_MANAGER, TEAM_LEADER, EMPLOYEE)
   * - department
   * - designation
   * - joiningDate
   * - profilePhoto
   * - branch
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
        COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
        e.name as emp_name,
        e.email as emp_email,
        e.join_date,
        e.profile_photo,
        e.department_id,
        e.designation_id,
        e.team_id,
        e.branch_id,
        r.role_key as emp_role_key,
        r.name as emp_role_name,
        desg.role_name as designation_name,
        dept.dept_name as department_name,
        b.branch_name
      FROM users u
      LEFT JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN designations desg ON e.designation_id = desg.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      LEFT JOIN branches b ON e.branch_id = b.id
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
          // Authoritative Role Resolution
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
            employeeId: row.emp_id || null,
            employeeCode: row.emp_code || '',
            name: row.emp_name || row.user_name || 'Employee',
            email: row.emp_email || row.user_email || '',
            role: primaryRole,
            accountStatus: row.account_status || 'Active',
            teamId: row.team_id,
            departmentId: row.department_id,
            department: (row.department_name || '').trim() || (row.emp_id ? 'Human Resources' : ''),
            designationId: row.designation_id,
            designation: (row.designation_name || '').trim() || (row.emp_id ? 'Staff' : ''),
            joiningDate: row.join_date ? new Date(row.join_date).toISOString().split('T')[0] : null,
            profilePhoto: row.profile_photo || null,
            branch: (row.branch_name || '').trim() || 'Head Office',
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
            COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
            e.name as emp_name,
            e.email as emp_email,
            e.join_date,
            e.profile_photo,
            e.department_id,
            e.designation_id,
            e.team_id,
            e.branch_id,
            r.role_key as emp_role_key,
            r.name as emp_role_name,
            desg.role_name as designation_name,
            dept.dept_name as department_name,
            b.branch_name
          FROM employees e
          LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
          LEFT JOIN roles r ON e.role_id = r.id
          LEFT JOIN designations desg ON e.designation_id = desg.id
          LEFT JOIN departments dept ON e.department_id = dept.id
          LEFT JOIN branches b ON e.branch_id = b.id
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
