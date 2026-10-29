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
  static async resolveUser(identifier, options = {}) {
    if (!identifier) return null;

    let targetEmail = null;
    let targetEmpId = null;
    let targetUserId = null;
    let targetCode = null;

    if (typeof identifier === 'object') {
      targetEmail = identifier.email ? String(identifier.email).trim().toLowerCase() : null;
      targetEmpId = identifier.employee_id || identifier.employeeId || null;
      targetUserId = identifier.userId || identifier.user_id || (!targetEmpId ? identifier.id : null);
      targetCode = identifier.employee_code || identifier.employeeCode || null;
    } else if (typeof identifier === 'string' && identifier.includes('@')) {
      targetEmail = identifier.trim().toLowerCase();
    } else if (typeof identifier === 'string' && (identifier.includes('/') || identifier.includes('-') || /[A-Za-z]/.test(identifier))) {
      targetCode = identifier.trim();
    } else {
      const num = parseInt(identifier, 10);
      if (!isNaN(num) && num > 0) {
        if (options && options.byUserId) {
          targetUserId = num;
        } else {
          // In standard HRMS flows, numeric IDs passed refer to employees.id
          targetEmpId = num;
        }
      }
    }

    const processResolvedRow = async (row) => {
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

      return {
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
    };

    const runQuery = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    // 1. If targetEmail is available, resolve strictly by email
    if (targetEmail) {
      const emailSql = `
        SELECT 
          u.id as user_id, u.email as user_email, u.full_name as user_name, u.role as user_table_role, u.account_status,
          e.id as emp_id, COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
          e.name as emp_name, e.email as emp_email, e.join_date, e.profile_photo,
          e.department_id, e.designation_id, e.team_id, e.branch_id,
          r.role_key as emp_role_key, r.name as emp_role_name,
          desg.role_name as designation_name, dept.dept_name as department_name, b.branch_name
        FROM users u
        LEFT JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN branches b ON e.branch_id = b.id
        WHERE LOWER(u.email) = LOWER(?) OR LOWER(e.email) = LOWER(?)
        LIMIT 1
      `;
      const emailRows = await runQuery(emailSql, [targetEmail, targetEmail]);
      if (emailRows.length > 0) {
        return processResolvedRow(emailRows[0]);
      }
    }

    // 2. If targetCode is available, resolve strictly by employee code
    if (targetCode) {
      const codeSql = `
        SELECT 
          u.id as user_id, u.email as user_email, u.full_name as user_name, u.role as user_table_role,
          COALESCE(u.account_status, e.status, 'Active') as account_status,
          e.id as emp_id, COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
          e.name as emp_name, e.email as emp_email, e.join_date, e.profile_photo,
          e.department_id, e.designation_id, e.team_id, e.branch_id,
          r.role_key as emp_role_key, r.name as emp_role_name,
          desg.role_name as designation_name, dept.dept_name as department_name, b.branch_name
        FROM employees e
        LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN branches b ON e.branch_id = b.id
        WHERE e.employee_code = ? OR e.employee_id = ?
        LIMIT 1
      `;
      const codeRows = await runQuery(codeSql, [targetCode, targetCode]);
      if (codeRows.length > 0) {
        return processResolvedRow(codeRows[0]);
      }
    }

    // 3. If targetEmpId is available, resolve strictly from employees table (e.id)
    if (targetEmpId) {
      const empSql = `
        SELECT 
          u.id as user_id, u.email as user_email, u.full_name as user_name, u.role as user_table_role,
          COALESCE(u.account_status, e.status, 'Active') as account_status,
          e.id as emp_id, COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
          e.name as emp_name, e.email as emp_email, e.join_date, e.profile_photo,
          e.department_id, e.designation_id, e.team_id, e.branch_id,
          r.role_key as emp_role_key, r.name as emp_role_name,
          desg.role_name as designation_name, dept.dept_name as department_name, b.branch_name
        FROM employees e
        LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN branches b ON e.branch_id = b.id
        WHERE e.id = ?
        LIMIT 1
      `;
      const empRows = await runQuery(empSql, [targetEmpId]);
      if (empRows.length > 0) {
        return processResolvedRow(empRows[0]);
      }
    }

    // 4. If targetUserId is available (e.g. Admin who has no employee record), resolve from users table (u.id)
    if (targetUserId) {
      const userSql = `
        SELECT 
          u.id as user_id, u.email as user_email, u.full_name as user_name, u.role as user_table_role, u.account_status,
          e.id as emp_id, COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
          e.name as emp_name, e.email as emp_email, e.join_date, e.profile_photo,
          e.department_id, e.designation_id, e.team_id, e.branch_id,
          r.role_key as emp_role_key, r.name as emp_role_name,
          desg.role_name as designation_name, dept.dept_name as department_name, b.branch_name
        FROM users u
        LEFT JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN branches b ON e.branch_id = b.id
        WHERE u.id = ?
        LIMIT 1
      `;
      const userRows = await runQuery(userSql, [targetUserId]);
      if (userRows.length > 0) {
        return processResolvedRow(userRows[0]);
      }
    }

    return null;
  }
}

module.exports = IdentityService;
