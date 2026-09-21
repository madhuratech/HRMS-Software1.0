const db = require('../config/database');

const MODULE_STRUCTURE = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    category: 'Overview',
    submodules: [
      { key: 'dashboard_overview', label: 'Dashboard Overview' }
    ]
  },
  {
    key: 'organization',
    label: 'Organization & Structure',
    category: 'Core HR',
    submodules: [
      { key: 'company_profile', label: 'Company Profile' },
      { key: 'departments', label: 'Departments' },
      { key: 'designations', label: 'Designations' },
      { key: 'teams', label: 'Teams' },
      { key: 'shift_management', label: 'Shift Management' },
      { key: 'holiday_calendar', label: 'Holiday Calendar' },
      { key: 'organization_chart', label: 'Organization Chart' }
    ]
  },
  {
    key: 'employees',
    label: 'Employee Management',
    category: 'Core HR',
    submodules: [
      { key: 'employee_directory', label: 'Employee Directory' },
      { key: 'employee_list', label: 'Employee List' },
      { key: 'add_employee', label: 'Add Employee' },
      { key: 'employee_profile', label: 'Employee Profile' },
      { key: 'employment_history', label: 'Employment History' },
      { key: 'promotions', label: 'Promotions' },
      { key: 'transfers', label: 'Transfers' },
      { key: 'exit_management', label: 'Exit Management' },
      { key: 'employee_documents', label: 'Employee Documents' }
    ]
  },
  {
    key: 'attendance',
    label: 'Attendance & Tracking',
    category: 'Time Management',
    submodules: [
      { key: 'daily_attendance', label: 'Daily Attendance' },
      { key: 'gps_attendance', label: 'GPS Attendance Punch' },
      { key: 'regularization', label: 'Regularization' },
      { key: 'shift_roster', label: 'Shift Roster' },
      { key: 'overtime', label: 'Overtime' },
      { key: 'late_arrival', label: 'Late Arrival' },
      { key: 'punch_locations', label: 'Punch Locations' }
    ]
  },
  {
    key: 'leave',
    label: 'Leave Management',
    category: 'Time Management',
    submodules: [
      { key: 'leave_dashboard', label: 'Leave Dashboard' },
      { key: 'leave_balance', label: 'Leave Balance' },
      { key: 'my_leave', label: 'My Leave' },
      { key: 'leave_approval', label: 'Leave Requests / Approval' },
      { key: 'leave_types', label: 'Leave Types' },
      { key: 'holiday_list', label: 'Holiday List' },
      { key: 'comp_off', label: 'Comp Off' }
    ]
  },
  {
    key: 'payroll',
    label: 'Payroll & Compensation',
    category: 'Finance',
    submodules: [
      { key: 'salary_structure', label: 'Salary Structure' },
      { key: 'salary_components', label: 'Salary Components' },
      { key: 'payroll_processing', label: 'Payroll Processing' },
      { key: 'generate_payslips', label: 'Generate Payslips' },
      { key: 'bonus_incentives', label: 'Bonus & Incentives' },
      { key: 'reimbursements', label: 'Reimbursements' },
      { key: 'loans_advances', label: 'Loans & Advances' },
      { key: 'tax_management', label: 'Tax Management' }
    ]
  },
  {
    key: 'recruitment',
    label: 'Recruitment & ATS',
    category: 'Talent Acquisition',
    submodules: [
      { key: 'recruitment_dashboard', label: 'Recruitment Dashboard' },
      { key: 'job_openings', label: 'Job Openings' },
      { key: 'candidates', label: 'Candidates' },
      { key: 'screening', label: 'Screening' },
      { key: 'interview_schedule', label: 'Interview Schedule' },
      { key: 'offer_letters', label: 'Offer Letters' },
      { key: 'hiring_pipeline', label: 'Hiring Pipeline' }
    ]
  },
  {
    key: 'onboarding',
    label: 'Onboarding & Probation',
    category: 'Talent Acquisition',
    submodules: [
      { key: 'new_joiners', label: 'New Joiners' },
      { key: 'document_verification', label: 'Document Verification' },
      { key: 'asset_allocation', label: 'Asset Allocation' },
      { key: 'welcome_kit', label: 'Welcome Kit' },
      { key: 'orientation', label: 'Orientation' },
      { key: 'probation', label: 'Probation' }
    ]
  },
  {
    key: 'performance',
    label: 'Performance & KPIs',
    category: 'Performance',
    submodules: [
      { key: 'goals', label: 'Goals' },
      { key: 'kpis', label: 'KPIs' },
      { key: 'kras', label: 'KRAs' },
      { key: 'appraisals', label: 'Appraisals' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'feedback', label: 'Feedback' },
      { key: 'performance_promotions', label: 'Promotions' }
    ]
  },
  {
    key: 'projects',
    label: 'Projects & Tasks',
    category: 'Operations',
    submodules: [
      { key: 'project_dashboard', label: 'Project Dashboard' },
      { key: 'projects_list', label: 'Projects' },
      { key: 'tasks', label: 'Tasks' },
      { key: 'sprint_board', label: 'Sprint Board' },
      { key: 'timesheets', label: 'Timesheets' },
      { key: 'milestones', label: 'Milestones' },
      { key: 'team_members', label: 'Team Members' }
    ]
  },
  {
    key: 'clients',
    label: 'Client Management',
    category: 'Operations',
    submodules: [
      { key: 'client_management', label: 'All Clients' },
      { key: 'client_projects', label: 'Client Projects' }
    ]
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    category: 'Analytics',
    submodules: [
      { key: 'reports_directory', label: 'Reports Directory' },
      { key: 'reports_employee', label: 'Employee Reports' },
      { key: 'reports_attendance', label: 'Attendance Reports' },
      { key: 'reports_leave', label: 'Leave Reports' },
      { key: 'reports_payroll', label: 'Payroll Reports' },
      { key: 'reports_recruitment', label: 'Recruitment Reports' },
      { key: 'reports_performance', label: 'Performance Reports' },
      { key: 'reports_project', label: 'Project Reports' }
    ]
  },
  {
    key: 'expenses',
    label: 'Expense Claims',
    category: 'Finance',
    submodules: [
      { key: 'expense_claims', label: 'Expense Claims' },
      { key: 'expense_categories', label: 'Expense Categories' },
      { key: 'expense_approval', label: 'Expense Approval' },
      { key: 'expense_reimbursements', label: 'Reimbursements' },
      { key: 'expense_reports', label: 'Expense Reports' }
    ]
  },
  {
    key: 'documents',
    label: 'Document Management',
    category: 'Compliance',
    submodules: [
      { key: 'doc_employee', label: 'Employee Documents' },
      { key: 'doc_company', label: 'Company Documents' },
      { key: 'doc_policies', label: 'HR Policies' },
      { key: 'doc_templates', label: 'Templates' },
      { key: 'doc_signatures', label: 'Digital Signatures' }
    ]
  },
  {
    key: 'helpdesk',
    label: 'Support & Helpdesk',
    category: 'Support',
    submodules: [
      { key: 'helpdesk_dashboard', label: 'Dashboard' },
      { key: 'tickets', label: 'Tickets' },
      { key: 'helpdesk_categories', label: 'Categories' },
      { key: 'helpdesk_priorities', label: 'Priorities' },
      { key: 'knowledge_base', label: 'Knowledge Base' },
      { key: 'helpdesk_reports', label: 'Reports' }
    ]
  },
  {
    key: 'settings',
    label: 'Settings & Configurations',
    category: 'Administration',
    submodules: [
      { key: 'settings_company', label: 'Company Information' },
      { key: 'settings_branding', label: 'Branding' },
      { key: 'settings_organization', label: 'Organization' },
      { key: 'user_roles', label: 'User Roles & Permissions' },
      { key: 'settings_hr', label: 'HR Settings' },
      { key: 'settings_communication', label: 'Communication' },
      { key: 'settings_integrations', label: 'Integrations' },
      { key: 'settings_security', label: 'Security' },
      { key: 'settings_system', label: 'System' }
    ]
  },
  {
    key: 'ai_assistant',
    label: 'AI Assistant',
    category: 'Tools',
    submodules: [
      { key: 'ai_dashboard', label: 'AI Assistant Dashboard' }
    ]
  },
  {
    key: 'user_roles',
    label: 'User Roles & Permissions',
    category: 'Administration',
    submodules: [
      { key: 'roles_matrix', label: 'Role Permissions Management' }
    ]
  }
];

const STANDARD_ROLE_KEYS = ['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'];

class RbacService {
  static getModules() {
    return MODULE_STRUCTURE;
  }

  static async getRoles() {
    const roles = await new Promise((resolve, reject) => {
      const sql = `
        SELECT r.*, 
          COUNT(e.id) as user_count
        FROM roles r
        LEFT JOIN employees e ON e.role_id = r.id
        GROUP BY r.id
        ORDER BY r.is_system DESC, r.id ASC
      `;
      db.query(sql, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const standardRolesMap = {
      'SUPER_ADMIN': {
        role_key: 'SUPER_ADMIN',
        role_name: 'Admin',
        name: 'Admin',
        description: 'Full HRMS administrative access across all system modules and settings.',
        is_system: 1
      },
      'HR_MANAGER': {
        role_key: 'HR_MANAGER',
        role_name: 'HR',
        name: 'HR',
        description: 'HR management access for employees, recruitment, onboarding, and performance.',
        is_system: 1
      },
      'TEAM_LEADER': {
        role_key: 'TEAM_LEADER',
        role_name: 'Team Leader',
        name: 'Team Leader',
        description: 'Team management access for assigned team members, attendance, tasks, and reviews.',
        is_system: 1
      },
      'EMPLOYEE': {
        role_key: 'EMPLOYEE',
        role_name: 'Employee',
        name: 'Employee',
        description: 'Employee self-service portal for personal attendance, leave, payslips, and tasks.',
        is_system: 1
      }
    };

    const finalRoles = [];

    // 1. Add the 4 Standard System Roles
    for (const key of STANDARD_ROLE_KEYS) {
      const dbMatch = roles.find(r => (r.role_key || '').toUpperCase() === key);
      const stdRole = standardRolesMap[key];
      finalRoles.push({
        id: dbMatch ? dbMatch.id : (key === 'SUPER_ADMIN' ? 1 : key === 'HR_MANAGER' ? 20 : key === 'TEAM_LEADER' ? 19 : 12),
        role_key: key,
        role_name: stdRole.role_name,
        name: stdRole.name,
        description: stdRole.description,
        is_system: 1,
        user_count: dbMatch ? dbMatch.user_count : 0
      });
    }

    // 2. Add Custom Roles created by Admin (is_system = 0)
    const customRoles = roles.filter(r => !r.is_system && !STANDARD_ROLE_KEYS.includes((r.role_key || '').toUpperCase()));
    for (const r of customRoles) {
      const roleKey = (r.role_key || r.name || `ROLE_${r.id}`).toUpperCase();
      finalRoles.push({
        ...r,
        role_key: roleKey,
        role_name: r.role_name || r.name || `Role ${r.id}`,
        description: r.description || `Custom role permissions for ${r.role_name || r.name}.`,
        is_system: 0
      });
    }

    return finalRoles;
  }

  static async getRolePermissions(roleKey) {
    let keyUpper = (roleKey || 'EMPLOYEE').trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'].includes(keyUpper)) keyUpper = 'SUPER_ADMIN';
    else if (['HR', 'HR_MANAGER', 'HR_ADMIN', 'BRANCH_MANAGER'].includes(keyUpper)) keyUpper = 'HR_MANAGER';
    else if (['TEAM_LEADER', 'TEAM_LEAD', 'LEAD'].includes(keyUpper)) keyUpper = 'TEAM_LEADER';
    else if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'SALES_MANAGER'].includes(keyUpper)) keyUpper = 'EMPLOYEE';

    const permissions = await new Promise((resolve) => {
      const sql = `SELECT * FROM role_permissions WHERE UPPER(role_key) = ?`;
      db.query(sql, [keyUpper], (err, rows) => {
        if (err) {
          console.error('[RBAC WARN] Failed to fetch role_permissions from DB, using system defaults:', err.message);
          return resolve([]);
        }
        resolve(rows || []);
      });
    });

    const permMap = {};
    permissions.forEach(p => {
      const isSub = p.submodule_key && p.submodule_key !== '_PARENT';
      const itemKey = isSub ? `${p.module_key}:${p.submodule_key}` : p.module_key;
      const permObj = {
        can_view: Boolean(p.can_view),
        can_create: Boolean(p.can_create),
        can_edit: Boolean(p.can_edit),
        can_delete: Boolean(p.can_delete)
      };
      permMap[itemKey] = permObj;
      if (isSub) {
        permMap[p.submodule_key] = permObj;
        if (p.submodule_key === 'tickets') permMap['support_tickets'] = permObj;
        if (p.submodule_key === 'support_tickets') permMap['tickets'] = permObj;
        if (p.submodule_key === 'gps_attendance') permMap['gps_attendance_punch'] = permObj;
        if (p.submodule_key === 'gps_attendance_punch') permMap['gps_attendance'] = permObj;
      }
    });

    const getDefaultSubmoduleView = (mKey, sKey) => {
      if (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') return true;
      if (keyUpper === 'HR_MANAGER' || keyUpper === 'HR') {
        return ['dashboard', 'organization', 'employees', 'attendance', 'leave', 'payroll', 'recruitment', 'onboarding', 'performance', 'projects', 'clients', 'reports', 'expenses', 'documents', 'helpdesk', 'settings'].includes(mKey);
      }
      if (keyUpper === 'TEAM_LEADER') {
        if (sKey === 'leave_approval' || sKey === 'comp_off' || sKey === 'employee_directory' || sKey === 'employee_profile' || sKey === 'tasks' || sKey === 'projects_list' || sKey === 'timesheets' || sKey === 'client_projects') return true;
        if (sKey === 'leave_types' || sKey === 'leave_requests') return false;
        return ['dashboard', 'employees', 'attendance', 'leave', 'projects', 'clients', 'performance', 'reports', 'documents', 'helpdesk'].includes(mKey);
      }
      if (keyUpper === 'EMPLOYEE') {
        if (sKey === 'leave_balance' || sKey === 'my_leave' || sKey === 'comp_off' || sKey === 'holiday_list' || sKey === 'daily_attendance' || sKey === 'gps_attendance' || sKey === 'shift_roster' || sKey === 'employee_profile' || sKey === 'tasks' || sKey === 'timesheets' || sKey === 'generate_payslips') return true;
        if (sKey === 'leave_approval' || sKey === 'leave_requests' || sKey === 'leave_types' || sKey === 'add_employee') return false;
        return ['dashboard', 'employees', 'attendance', 'leave', 'payroll', 'projects', 'performance', 'documents', 'helpdesk'].includes(mKey);
      }
      return true;
    };

    const hrAllowedModules = [
      'organization', 'employees', 'attendance', 'leave',
      'payroll', 'recruitment', 'onboarding', 'performance',
      'projects', 'clients', 'reports', 'expenses', 'documents', 'helpdesk'
    ];

    const getDefaultSubmoduleCreate = (mKey, sKey) => {
      if (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') return true;
      if (keyUpper === 'HR_MANAGER' || keyUpper === 'HR') {
        return hrAllowedModules.includes(mKey);
      }
      if (sKey === 'my_leave' || sKey === 'comp_off') return true;
      return false;
    };

    const getDefaultSubmoduleEdit = (mKey, sKey) => {
      if (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') return true;
      if (keyUpper === 'HR_MANAGER' || keyUpper === 'HR') {
        return hrAllowedModules.includes(mKey);
      }
      if (keyUpper === 'TEAM_LEADER' && (sKey === 'leave_approval' || sKey === 'comp_off')) return true;
      return false;
    };

    const getDefaultSubmoduleDelete = (mKey, sKey) => {
      if (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') return true;
      if (keyUpper === 'HR_MANAGER' || keyUpper === 'HR') {
        return ['employees', 'attendance', 'leave', 'recruitment', 'performance', 'documents'].includes(mKey);
      }
      return false;
    };

    const fullHierarchy = MODULE_STRUCTURE.map(m => {
      const submodules = m.submodules.map(s => {
        const subKey = `${m.key}:${s.key}`;
        const pSub = permMap[subKey] || permMap[s.key];
        const pParent = permMap[m.key];
        
        let canView = false;
        let canCreate = false;
        let canEdit = false;
        let canDelete = false;

        if (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') {
          canView = true;
          canCreate = true;
          canEdit = true;
          canDelete = true;
        } else if (pSub) {
          canView = Boolean(pSub.can_view);
          canCreate = Boolean(pSub.can_create);
          canEdit = Boolean(pSub.can_edit);
          canDelete = Boolean(pSub.can_delete);
        } else if (pParent) {
          canView = Boolean(pParent.can_view);
          canCreate = Boolean(pParent.can_create);
          canEdit = Boolean(pParent.can_edit);
          canDelete = Boolean(pParent.can_delete);
        } else {
          canView = getDefaultSubmoduleView(m.key, s.key);
          canCreate = getDefaultSubmoduleCreate(m.key, s.key);
          canEdit = getDefaultSubmoduleEdit(m.key, s.key);
          canDelete = getDefaultSubmoduleDelete(m.key, s.key);
        }

        return {
          submodule_key: s.key,
          submodule_label: s.label,
          can_view: canView,
          can_create: canCreate,
          can_edit: canEdit,
          can_delete: canDelete
        };
      });

      const parentPerm = permMap[m.key];
      const hasAnySubView = submodules.some(s => s.can_view);
      const moduleCanView = (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') ? true : (parentPerm ? Boolean(parentPerm.can_view) : hasAnySubView);
      const moduleCanCreate = (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') ? true : (parentPerm ? Boolean(parentPerm.can_create) : submodules.some(s => s.can_create));
      const moduleCanEdit = (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') ? true : (parentPerm ? Boolean(parentPerm.can_edit) : submodules.some(s => s.can_edit));
      const moduleCanDelete = (keyUpper === 'SUPER_ADMIN' || keyUpper === 'ADMIN') ? true : (parentPerm ? Boolean(parentPerm.can_delete) : submodules.some(s => s.can_delete));

      return {
        module_key: m.key,
        module_label: m.label,
        category: m.category,
        can_view: moduleCanView,
        can_create: moduleCanCreate,
        can_edit: moduleCanEdit,
        can_delete: moduleCanDelete,
        submodules
      };
    });
    return fullHierarchy;
  }

  static async createRole(data) {
    const { role_name, description, template_role } = data;
    if (!role_name || !role_name.trim()) throw new Error('Role name is required');
    const roleKey = role_name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const existing = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM roles WHERE UPPER(role_key) = ? OR LOWER(role_name) = LOWER(?)', [roleKey, role_name.trim()], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    if (existing.length > 0) throw new Error('A role with this name already exists');
    await new Promise((resolve, reject) => {
      const sql = 'INSERT INTO roles (role_key, role_name, name, description, is_system) VALUES (?, ?, ?, ?, 0)';
      db.query(sql, [roleKey, role_name.trim(), role_name.trim(), description || 'Custom user role'], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    let templatePerms = [];
    if (template_role) templatePerms = await this.getRolePermissions(template_role);
    for (const m of templatePerms) {
      for (const s of m.submodules || []) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO role_permissions (role_key, module_key, submodule_key, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, ?, ?, ?, ?)`;
          db.query(sql, [roleKey, m.module_key, s.submodule_key, s.can_view ? 1 : 0, s.can_create ? 1 : 0, s.can_edit ? 1 : 0, s.can_delete ? 1 : 0], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      }
    }
    return { role_key: roleKey, role_name: role_name.trim() };
  }

  static async updateRolePermissions(roleKey, matrix, roleInfo) {
    const keyUpper = (roleKey || '').toUpperCase();
    if (roleInfo && roleInfo.role_name) {
      await new Promise((resolve, reject) => {
        const sql = 'UPDATE roles SET role_name = ?, description = ? WHERE UPPER(role_key) = ?';
        db.query(sql, [roleInfo.role_name, roleInfo.description || '', keyUpper], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    if (Array.isArray(matrix)) {
      for (const item of matrix) {
        const moduleKey = item.module_key;
        await new Promise((resolve, reject) => {
          const sql = `
            INSERT INTO role_permissions (role_key, module_key, submodule_key, can_view, can_create, can_edit, can_delete)
            VALUES (?, ?, '_PARENT', ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              can_view = VALUES(can_view),
              can_create = VALUES(can_create),
              can_edit = VALUES(can_edit),
              can_delete = VALUES(can_delete)
          `;
          db.query(sql, [keyUpper, moduleKey, item.can_view ? 1 : 0, item.can_create ? 1 : 0, item.can_edit ? 1 : 0, item.can_delete ? 1 : 0], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
        if (Array.isArray(item.submodules)) {
          for (const sub of item.submodules) {
            await new Promise((resolve, reject) => {
              const sql = `
                INSERT INTO role_permissions (role_key, module_key, submodule_key, can_view, can_create, can_edit, can_delete)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                  can_view = VALUES(can_view),
                  can_create = VALUES(can_create),
                  can_edit = VALUES(can_edit),
                  can_delete = VALUES(can_delete)
              `;
              db.query(sql, [keyUpper, moduleKey, sub.submodule_key, sub.can_view ? 1 : 0, sub.can_create ? 1 : 0, sub.can_edit ? 1 : 0, sub.can_delete ? 1 : 0], (err) => {
                if (err) return reject(err);
                resolve();
              });
            });
          }
        }
      }
    }

    return true;
  }

  static async deleteRole(roleKey) {
    const keyUpper = (roleKey || '').toUpperCase();
    if (STANDARD_ROLE_KEYS.includes(keyUpper)) throw new Error('Standard system roles cannot be deleted');
    const roleRows = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM roles WHERE UPPER(role_key) = ?', [keyUpper], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    if (roleRows.length === 0) throw new Error('Role not found');
    if (roleRows[0].is_system) throw new Error('System default roles cannot be deleted');
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM role_permissions WHERE UPPER(role_key) = ?', [keyUpper], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM roles WHERE UPPER(role_key) = ?', [keyUpper], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    return true;
  }

  static async getUserPermissions(roleNameOrKey) {
    if (!roleNameOrKey) return {};
    const inputUpper = String(roleNameOrKey).trim().toUpperCase().replace(/[\s-]+/g, '_');
    let resolvedKey = inputUpper;
    if (['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'].includes(inputUpper)) resolvedKey = 'SUPER_ADMIN';
    else if (['HR', 'HR_MANAGER', 'HR_ADMIN', 'BRANCH_MANAGER'].includes(inputUpper)) resolvedKey = 'HR_MANAGER';
    else if (['TEAM_LEADER', 'TEAM_LEAD', 'LEAD'].includes(inputUpper)) resolvedKey = 'TEAM_LEADER';
    else if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'SALES_MANAGER'].includes(inputUpper)) resolvedKey = 'EMPLOYEE';
    else {
      const roles = await new Promise((resolve) => {
        db.query('SELECT role_key FROM roles WHERE UPPER(role_key) = ? OR UPPER(REPLACE(role_name, " ", "_")) = ? OR LOWER(role_name) = LOWER(?)', [inputUpper, inputUpper, String(roleNameOrKey).trim()], (err, rows) => {
          if (err || !rows) return resolve([]);
          resolve(rows);
        });
      });
      resolvedKey = (roles && roles.length > 0) ? roles[0].role_key : 'EMPLOYEE';
    }
    const matrix = await this.getRolePermissions(resolvedKey);
    const permObj = {};
    matrix.forEach(m => {
      const subMap = {};
      (m.submodules || []).forEach(s => {
        const pData = { view: s.can_view, create: s.can_create, edit: s.can_edit, delete: s.can_delete };
        subMap[s.submodule_key] = pData;
        permObj[s.submodule_key] = pData;
        if (s.submodule_key === 'gps_attendance') {
          subMap['gps_attendance_punch'] = pData;
          permObj['gps_attendance_punch'] = pData;
        } else if (s.submodule_key === 'gps_attendance_punch') {
          subMap['gps_attendance'] = pData;
          permObj['gps_attendance'] = pData;
        }
        if (s.submodule_key === 'tickets') {
          subMap['support_tickets'] = pData;
          permObj['support_tickets'] = pData;
        } else if (s.submodule_key === 'support_tickets') {
          subMap['tickets'] = pData;
          permObj['tickets'] = pData;
        }
      });
      const modPerm = { view: m.can_view, create: m.can_create, edit: m.can_edit, delete: m.can_delete, submodules: subMap };
      permObj[m.module_key] = modPerm;
      if (m.module_key === 'projects' || m.module_key === 'projects_tasks') {
        permObj['projects'] = modPerm;
        permObj['projects_tasks'] = modPerm;
      }
    });
    return permObj;
  }
}

module.exports = RbacService;
