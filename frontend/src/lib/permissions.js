/**
 * Safe Boolean Normalization Function
 * Converts true, 1, "1", "true" -> true
 * Converts false, 0, "0", "false", null, undefined -> false
 */
export function normalizeBoolean(val) {
  if (val === true || val === 1 || val === '1' || val === 'true') {
    return true;
  }
  return false;
}

/**
 * Standardize and normalize permission strings to module.action or submodule
 * e.g. "employee.create", "employees.create", "employee_create" -> "employees.create"
 */
export function normalizePermission(permission) {
  if (!permission) return '';
  return String(permission)
    .trim()
    .toLowerCase()
    .replace(/[_\s:]+/g, '.');
}

export function getLocalRoleAndPermissions() {
  let role = 'EMPLOYEE';
  let permissions = null;
  
  try {
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      const userObj = parsed.user || parsed;
      role = parsed.role || userObj.role || localStorage.getItem('userRole') || 'EMPLOYEE';
    } else {
      role = localStorage.getItem('userRole') || 'EMPLOYEE';
    }
  } catch (e) {}

  try {
    const stored = localStorage.getItem('hrms_permissions');
    if (stored) {
      permissions = JSON.parse(stored);
    }
  } catch (e) {}
  
  return { role, permissions };
}

export function resolveModuleKeys(modKey, parentModule = null) {
  if (!modKey) return { moduleKey: null, submoduleKey: null };
  const cleanKey = String(modKey).toLowerCase().trim().replace(/[-.]/g, '_');
  const parentClean = parentModule ? String(parentModule).toLowerCase().trim().replace(/[-.]/g, '_') : null;

  // Performance module submodules
  if (['goals', 'goal'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'goals' };
  if (['kpi', 'kpis'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'kpis' };
  if (['kra', 'kras'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'kras' };
  if (['appraisal', 'appraisals'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'appraisals' };
  if (['review', 'reviews'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'reviews' };
  if (['feedback'].includes(cleanKey)) return { moduleKey: 'performance', submoduleKey: 'feedback' };
  if (cleanKey === 'performance_promotions' || (['promotion', 'promotions'].includes(cleanKey) && parentClean === 'performance')) {
    return { moduleKey: 'performance', submoduleKey: 'performance_promotions' };
  }

  // Leave module submodules
  if (['my_leave', 'myleave', 'leave_applications'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'my_leave' };
  if (['leave_balance', 'leavebalance'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'leave_balance' };
  if (['leave_dashboard', 'leavedashboard'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'leave_dashboard' };
  if (['leave_approval', 'leaveapproval', 'leave_requests'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'leave_approval' };
  if (['leave_types', 'leavetypes'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'leave_types' };
  if (['holiday_list', 'holidaylist'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'holiday_list' };
  if (['comp_off', 'compoff'].includes(cleanKey)) return { moduleKey: 'leave', submoduleKey: 'comp_off' };

  // Attendance module submodules
  if (['daily_attendance', 'dailyattendance'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'daily_attendance' };
  if (['gps_attendance', 'gpsattendance', 'gps_attendance_punch', 'gpsattendancepunch', 'gps_punch', 'gpspunch', 'geo_attendance', 'geo_fencing', 'geofenced_punch', 'attendance_punch'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'gps_attendance' };
  if (['regularization'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'regularization' };
  if (['shift_roster', 'shiftroster'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'shift_roster' };
  if (['overtime'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'overtime' };
  if (['late_arrival', 'latearrival'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'late_arrival' };
  if (['punch_locations', 'punchlocations'].includes(cleanKey)) return { moduleKey: 'attendance', submoduleKey: 'punch_locations' };

  // Employees module submodules
  if (['employee_directory', 'employeedirectory', 'directory'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'employee_directory' };
  if (['employee_list', 'employeelist', 'employees_list'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'employee_list' };
  if (['add_employee', 'addemployee'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'add_employee' };
  if (['employee_profile', 'employeeprofile', 'my_profile'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'employee_profile' };
  if (['employment_history', 'employmenthistory'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'employment_history' };
  if (['transfers', 'transfer'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'transfers' };
  if (['promotions', 'promotion', 'employee_promotions'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'promotions' };
  if (['exit_management', 'exitmanagement', 'exit'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'exit_management' };
  if (['employee_documents', 'employeedocuments'].includes(cleanKey)) return { moduleKey: 'employees', submoduleKey: 'employee_documents' };

  // Projects submodules
  if (['tasks', 'task'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'tasks' };
  if (['sprints', 'sprint', 'sprint_board', 'sprintboard'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'sprint_board' };
  if (['timesheets', 'timesheet'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'timesheets' };
  if (['milestones', 'milestone'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'milestones' };
  if (['team_members', 'teammembers', 'team_member'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'team_members' };
  if (['projects_list', 'projectslist'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'projects_list' };
  if (['project_dashboard', 'projectdashboard'].includes(cleanKey)) return { moduleKey: 'projects', submoduleKey: 'project_dashboard' };

  // Recruitment submodules
  if (['screening', 'candidate_screening', 'candidatescreening'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'screening' };
  if (['job_openings', 'jobopenings', 'jobs'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'job_openings' };
  if (['candidates', 'candidate'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'candidates' };
  if (['interview_schedule', 'interviewschedule', 'interviews'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'interview_schedule' };
  if (['offer_letters', 'offerletters', 'offers'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'offer_letters' };
  if (['hiring_pipeline', 'hiringpipeline', 'pipeline'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'hiring_pipeline' };
  if (['recruitment_dashboard', 'recruitmentdashboard'].includes(cleanKey)) return { moduleKey: 'recruitment', submoduleKey: 'recruitment_dashboard' };

  // Onboarding submodules
  if (['new_joiners', 'newjoiners', 'joiners'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'new_joiners' };
  if (['document_verification', 'documentverification'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'document_verification' };
  if (['asset_allocation', 'assetallocation', 'assets'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'asset_allocation' };
  if (['welcome_kit', 'welcomekit'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'welcome_kit' };
  if (['orientation', 'orientations'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'orientation' };
  if (['probation', 'probations'].includes(cleanKey)) return { moduleKey: 'onboarding', submoduleKey: 'probation' };

  // Payroll submodules
  if (['salary_structure', 'salarystructure'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'salary_structure' };
  if (['salary_components', 'salarycomponents'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'salary_components' };
  if (['payroll_processing', 'payrollprocessing'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'payroll_processing' };
  if (['generate_payslips', 'generatepayslips', 'payslips', 'payslip'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'generate_payslips' };
  if (['bonus_incentives', 'bonusincentives', 'bonus'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'bonus_incentives' };
  if (['reimbursements', 'reimbursement'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'reimbursements' };
  if (['loans_advances', 'loansadvances', 'loans'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'loans_advances' };
  if (['tax_management', 'taxmanagement', 'tax'].includes(cleanKey)) return { moduleKey: 'payroll', submoduleKey: 'tax_management' };

  // Expenses submodules
  if (['expense_claims', 'expenseclaims', 'claims'].includes(cleanKey)) return { moduleKey: 'expenses', submoduleKey: 'expense_claims' };
  if (['expense_categories', 'expensecategories'].includes(cleanKey)) return { moduleKey: 'expenses', submoduleKey: 'expense_categories' };
  if (['expense_approval', 'expenseapproval'].includes(cleanKey)) return { moduleKey: 'expenses', submoduleKey: 'expense_approval' };
  if (['expense_reports', 'expensereports'].includes(cleanKey)) return { moduleKey: 'expenses', submoduleKey: 'expense_reports' };
  if (['expense_reimbursements', 'expensereimbursements'].includes(cleanKey)) return { moduleKey: 'expenses', submoduleKey: 'expense_reimbursements' };

  // Documents submodules
  if (['doc_employee', 'docemployee', 'employee_docs', 'employee_documents'].includes(cleanKey)) return { moduleKey: 'documents', submoduleKey: 'doc_employee' };
  if (['doc_company', 'doccompany', 'company_docs', 'company_documents'].includes(cleanKey)) return { moduleKey: 'documents', submoduleKey: 'doc_company' };
  if (['doc_policies', 'docpolicies', 'hr_policies', 'hrpolicies'].includes(cleanKey)) return { moduleKey: 'documents', submoduleKey: 'doc_policies' };
  if (['doc_templates', 'doctemplates', 'templates', 'template'].includes(cleanKey)) return { moduleKey: 'documents', submoduleKey: 'doc_templates' };
  if (['doc_signatures', 'docsignatures', 'digital_signatures', 'signatures'].includes(cleanKey)) return { moduleKey: 'documents', submoduleKey: 'doc_signatures' };

  // Helpdesk submodules
  if (['support_tickets', 'supporttickets', 'tickets', 'ticket'].includes(cleanKey)) return { moduleKey: 'helpdesk', submoduleKey: 'tickets' };
  if (['knowledge_base', 'knowledgebase', 'kb'].includes(cleanKey)) return { moduleKey: 'helpdesk', submoduleKey: 'knowledge_base' };
  if (['helpdesk_categories', 'helpdeskcategories'].includes(cleanKey)) return { moduleKey: 'helpdesk', submoduleKey: 'helpdesk_categories' };

  // Organization submodules
  if (['departments', 'department', 'org_departments'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'departments' };
  if (['designations', 'designation', 'org_designations'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'designations' };
  if (['teams', 'team', 'org_teams'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'teams' };
  if (['shift_management', 'shiftmanagement', 'shifts'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'shift_management' };
  if (['holiday_calendar', 'holidaycalendar', 'calendar'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'holiday_calendar' };
  if (['company_profile', 'companyprofile'].includes(cleanKey)) return { moduleKey: 'organization', submoduleKey: 'company_profile' };

  // Settings submodules
  if (['user_roles', 'userroles', 'roles_matrix', 'rolesmatrix', 'roles'].includes(cleanKey)) return { moduleKey: 'settings', submoduleKey: 'user_roles' };
  if (['settings_users', 'users_settings', 'users'].includes(cleanKey)) return { moduleKey: 'settings', submoduleKey: 'settings_users' };
  if (['settings_company', 'company_settings'].includes(cleanKey)) return { moduleKey: 'settings', submoduleKey: 'settings_company' };
  if (['settings_hr', 'hr_settings'].includes(cleanKey)) return { moduleKey: 'settings', submoduleKey: 'settings_hr' };

  // Clients submodules
  if (['client_management', 'clientmanagement', 'all_clients', 'allclients', 'clients_list'].includes(cleanKey)) return { moduleKey: 'clients', submoduleKey: 'client_management' };
  if (['client_projects', 'clientprojects', 'client_project'].includes(cleanKey)) return { moduleKey: 'clients', submoduleKey: 'client_projects' };

  // Plural normalization for core modules
  if (cleanKey === 'employee') return { moduleKey: 'employees', submoduleKey: null };
  if (cleanKey === 'project') return { moduleKey: 'projects', submoduleKey: null };
  if (cleanKey === 'leaves') return { moduleKey: 'leave', submoduleKey: null };
  if (cleanKey === 'expense') return { moduleKey: 'expenses', submoduleKey: null };
  if (cleanKey === 'document') return { moduleKey: 'documents', submoduleKey: null };
  if (cleanKey === 'client') return { moduleKey: 'clients', submoduleKey: null };

  return { moduleKey: cleanKey, submoduleKey: null };
}

export function showPermissionDenied(customMsg = null) {
  if (document.getElementById('permission-denied-popup-root')) return;

  const root = document.createElement('div');
  root.id = 'permission-denied-popup-root';
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.display = 'flex';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';
  root.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
  root.style.backdropFilter = 'blur(4px)';
  root.style.zIndex = '999999';
  root.style.fontFamily = '"Inter", -apple-system, sans-serif';

  const modal = document.createElement('div');
  modal.style.background = '#FFFFFF';
  modal.style.borderRadius = '16px';
  modal.style.width = '90%';
  modal.style.maxWidth = '380px';
  modal.style.padding = '24px';
  modal.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
  modal.style.textAlign = 'center';
  modal.style.border = '1px solid #E5E7EB';

  if (!document.getElementById('permission-modal-anim-style')) {
    const style = document.createElement('style');
    style.id = 'permission-modal-anim-style';
    style.textContent = `
      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  modal.style.animation = 'scaleIn 0.2s ease-out';

  const displayMessage = customMsg || 'You do not have permission to perform this action.';

  modal.innerHTML = `
    <div style="width: 52px; height: 52px; border-radius: 50%; background-color: #FEF2F2; color: #EF4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    </div>
    <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #1E293B;">Permission Denied</h3>
    <p style="margin: 0 0 20px; font-size: 13px; color: #64748B; line-height: 1.5;">${displayMessage}</p>
    <button id="close-permission-denied-btn" style="width: 100%; height: 40px; background-color: #1E293B; color: #FFFFFF; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.15s;">
      Dismiss
    </button>
  `;

  root.appendChild(modal);
  document.body.appendChild(root);

  const closeBtn = modal.querySelector('#close-permission-denied-btn');
  const dismiss = () => root.remove();
  
  closeBtn.addEventListener('click', dismiss);
  root.addEventListener('click', (e) => {
    if (e.target === root) dismiss();
  });

  setTimeout(() => {
    if (document.body.contains(root)) dismiss();
  }, 3500);
}

/**
 * Universal Permission Resolution Function
 * Supports multiple call signatures:
 * 1) hasPermission('employee.create') / hasPermission('employees_create')
 * 2) hasPermission('projects', 'tasks', 'create')
 * 3) hasPermission('leave', 'my_leave')
 * 4) hasPermission('leave', 'view')
 * 5) hasPermission(userPermissions, userRole, 'projects', 'tasks', 'create')
 * 6) hasPermission(null, null, 'projects', 'tasks', 'create')
 */
export function hasPermission(...args) {
  const ACTIONS = ['view', 'create', 'edit', 'update', 'delete', 'approve', 'reject', 'export', 'import'];

  let userPermissions = null;
  let userRole = null;
  let moduleKey = null;
  let submoduleKey = null;
  let action = 'view';

  // Check if first two arguments are permissions object and role string (5-arg or 4-arg signature)
  if (args.length >= 3 && (typeof args[0] === 'object' || args[0] === null) && (typeof args[1] === 'string' || args[1] === null)) {
    userPermissions = args[0];
    userRole = args[1];
    moduleKey = args[2];
    submoduleKey = args[3] || null;
    action = args[4] || 'view';

    // If submoduleKey is actually an action string (e.g. hasPermission(perms, role, 'projects', 'create'))
    if (submoduleKey && ACTIONS.includes(String(submoduleKey).toLowerCase())) {
      action = submoduleKey;
      submoduleKey = null;
    }
    if (moduleKey && !submoduleKey) {
      const resolved = resolveModuleKeys(moduleKey);
      if (resolved.moduleKey) {
        moduleKey = resolved.moduleKey;
        submoduleKey = resolved.submoduleKey;
      }
    }
  } else if (args.length === 1 && typeof args[0] === 'string') {
    // Single string format e.g. "employee.create" or "leave.approval.edit" or "tasks"
    const parts = args[0].split(/[._:]/);
    if (parts.length >= 3) {
      moduleKey = parts[0];
      submoduleKey = parts.slice(1, -1).join('_');
      action = parts[parts.length - 1];
    } else if (parts.length === 2) {
      if (ACTIONS.includes(parts[1].toLowerCase())) {
        const resolved = resolveModuleKeys(parts[0]);
        moduleKey = resolved.moduleKey;
        submoduleKey = resolved.submoduleKey;
        action = parts[1];
      } else {
        moduleKey = parts[0];
        submoduleKey = parts[1];
        action = 'view';
      }
    } else {
      const resolved = resolveModuleKeys(parts[0]);
      moduleKey = resolved.moduleKey;
      submoduleKey = resolved.submoduleKey;
      action = 'view';
    }
  } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    // 2 string arguments: could be (module, action) OR (module, submodule) OR (submodule, action)
    const arg1 = args[0].toLowerCase().trim();
    const arg2 = args[1].toLowerCase().trim();

    if (ACTIONS.includes(arg2)) {
      const resolved = resolveModuleKeys(arg1);
      moduleKey = resolved.moduleKey;
      submoduleKey = resolved.submoduleKey;
      action = arg2;
    } else {
      moduleKey = arg1;
      submoduleKey = arg2;
      action = 'view';
    }
  } else if (args.length >= 3 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    // 3 string arguments: (moduleKey, submoduleKey, action)
    moduleKey = args[0];
    submoduleKey = args[1];
    action = args[2] || 'view';
  }

  // Dashboard is universally accessible
  if (moduleKey === 'dashboard' || submoduleKey === 'dashboard' || submoduleKey === 'dashboard_overview') {
    return true;
  }

  // Retrieve role and permissions from storage if not provided
  if (!userRole) {
    const { role } = getLocalRoleAndPermissions();
    userRole = role;
  }
  userRole = userRole || 'EMPLOYEE';

  const normRole = String(userRole).toUpperCase().replace(/_/g, ' ');

  // Admin / Super Admin bypass
  if (normRole === 'SUPER ADMIN' || normRole === 'SUPERADMIN' || normRole === 'ADMIN') {
    return true;
  }

  if (!userPermissions) {
    const { permissions } = getLocalRoleAndPermissions();
    userPermissions = permissions;
  }

  if (!userPermissions) {
    return false;
  }

  // Normalize action key aliases
  let actKey = String(action || 'view').toLowerCase();
  if (actKey === 'update' || actKey === 'approve' || actKey === 'reject') actKey = 'edit';

  const actKeyAlt = actKey === 'view' ? 'canView' : actKey === 'create' ? 'canCreate' : actKey === 'edit' ? 'canEdit' : actKey === 'delete' ? 'canDelete' : actKey === 'export' ? 'canExport' : 'canImport';
  const actKeyDb = actKey === 'view' ? 'can_view' : actKey === 'create' ? 'can_create' : actKey === 'edit' ? 'can_edit' : actKey === 'delete' ? 'can_delete' : actKey === 'export' ? 'can_export' : 'can_import';

  const extractVal = (obj) => {
    if (!obj) return undefined;
    if (obj[actKey] !== undefined) return obj[actKey];
    if (obj[actKeyAlt] !== undefined) return obj[actKeyAlt];
    if (obj[actKeyDb] !== undefined) return obj[actKeyDb];
    if (actKey === 'edit') {
      if (obj.can_update !== undefined) return obj.can_update;
      if (obj.canUpdate !== undefined) return obj.canUpdate;
      if (obj.update !== undefined) return obj.update;
    }
    if (actKey === 'import') {
      // Import requires create permission if no specific import permission is defined
      if (obj.can_create !== undefined) return obj.can_create;
      if (obj.canCreate !== undefined) return obj.canCreate;
      if (obj.create !== undefined) return obj.create;
    }
    if (actKey === 'export') {
      // Export requires view permission if no specific export permission is defined
      if (obj.can_view !== undefined) return obj.can_view;
      if (obj.canView !== undefined) return obj.canView;
      if (obj.view !== undefined) return obj.view;
    }
    return undefined;
  };

  // 1. Direct submodule check
  if (submoduleKey) {
    const subClean = submoduleKey.toLowerCase().replace(/[-.]/g, '_');
    const modClean = moduleKey ? moduleKey.toLowerCase().replace(/[-.]/g, '_') : null;

    // Check direct submodule key
    if (userPermissions[subClean] !== undefined && userPermissions[subClean] !== null) {
      const val = extractVal(userPermissions[subClean]);
      if (val !== undefined) return normalizeBoolean(val);
    }

    // Check alias keys if applicable (e.g. gps_attendance <-> gps_attendance_punch, tickets <-> support_tickets)
    const subAlias = subClean === 'gps_attendance' ? 'gps_attendance_punch' : (subClean === 'gps_attendance_punch' ? 'gps_attendance' : (subClean === 'tickets' ? 'support_tickets' : (subClean === 'support_tickets' ? 'tickets' : null)));
    if (subAlias && userPermissions[subAlias] !== undefined && userPermissions[subAlias] !== null) {
      const val = extractVal(userPermissions[subAlias]);
      if (val !== undefined) return normalizeBoolean(val);
    }

    // Check combined key e.g. "projects:tasks" or "projects.tasks"
    if (modClean) {
      const colonKey = `${modClean}:${subClean}`;
      if (userPermissions[colonKey] !== undefined && userPermissions[colonKey] !== null) {
        const val = extractVal(userPermissions[colonKey]);
        if (val !== undefined) return normalizeBoolean(val);
      }
      if (subAlias) {
        const colonAliasKey = `${modClean}:${subAlias}`;
        if (userPermissions[colonAliasKey] !== undefined && userPermissions[colonAliasKey] !== null) {
          const val = extractVal(userPermissions[colonAliasKey]);
          if (val !== undefined) return normalizeBoolean(val);
        }
      }
      const dotKey = `${modClean}.${subClean}`;
      if (userPermissions[dotKey] !== undefined && userPermissions[dotKey] !== null) {
        const val = extractVal(userPermissions[dotKey]);
        if (val !== undefined) return normalizeBoolean(val);
      }
      if (userPermissions[modClean] && userPermissions[modClean].submodules) {
        if (userPermissions[modClean].submodules[subClean]) {
          const val = extractVal(userPermissions[modClean].submodules[subClean]);
          if (val !== undefined) return normalizeBoolean(val);
        }
        if (subAlias && userPermissions[modClean].submodules[subAlias]) {
          const val = extractVal(userPermissions[modClean].submodules[subAlias]);
          if (val !== undefined) return normalizeBoolean(val);
        }
      }
    }
    // Graceful fallback to parent module permission if submodule was not explicitly defined
    if (modClean && userPermissions[modClean] !== undefined && userPermissions[modClean] !== null) {
      const parentVal = extractVal(userPermissions[modClean]);
      if (parentVal !== undefined) return normalizeBoolean(parentVal);
    }
    return false;
  }

  // 2. Parent module check
  if (moduleKey) {
    const modClean = moduleKey.toLowerCase().replace(/[-.]/g, '_');
    if (userPermissions[modClean] !== undefined && userPermissions[modClean] !== null) {
      const val = extractVal(userPermissions[modClean]);
      if (val !== undefined) return normalizeBoolean(val);
    }
  }

  return false;
}

export function canView(...args) {
  if (args.length === 1) return hasPermission(args[0], 'view');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'view');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'view');
  }
  return hasPermission(...args, 'view');
}

export function canCreate(...args) {
  if (args.length === 1) return hasPermission(args[0], 'create');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'create');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'create');
  }
  return hasPermission(...args, 'create');
}

export function canEdit(...args) {
  if (args.length === 1) return hasPermission(args[0], 'edit');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'edit');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'edit');
  }
  return hasPermission(...args, 'edit');
}

export function canUpdate(...args) {
  return canEdit(...args);
}

export function canDelete(...args) {
  if (args.length === 1) return hasPermission(args[0], 'delete');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'delete');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'delete');
  }
  return hasPermission(...args, 'delete');
}

export function canApprove(...args) {
  return canEdit(...args);
}

export function canExport(...args) {
  if (args.length === 1) return hasPermission(args[0], 'export');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'export');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'export');
  }
  return hasPermission(...args, 'export');
}

export function canImport(...args) {
  if (args.length === 1) return hasPermission(args[0], 'import');
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    return hasPermission(args[0], args[1], 'import');
  }
  if (args.length >= 3 && typeof args[0] === 'object') {
    return hasPermission(args[0], args[1], args[2], args[3] || null, 'import');
  }
  return hasPermission(...args, 'import');
}

/**
 * canSeeModule checks if the user has ANY permission (view OR create OR edit OR delete)
 * to decide whether a module/submodule appears in navigation.
 * NOTE: NEVER used for action buttons (Add/Edit/Delete) or API checks.
 */
export function canSeeModule(...args) {
  return canView(...args) || canCreate(...args) || canEdit(...args) || canDelete(...args);
}

export function checkActionPermission(moduleName, actionName = 'CREATE', customMsg = null) {
  const allowed = hasPermission(moduleName, actionName);
  if (!allowed) {
    const msg = customMsg || `You do not have ${actionName.toUpperCase()} permission for this module.`;
    showPermissionDenied(msg);
    return false;
  }
  return true;
}

export function requireActionPermission(moduleKey, submoduleKey = null, action = 'create', callback = null, addToastFn = null, customMessage = null, userPermissions = null, userRole = null) {
  let allowed = false;
  if (userPermissions && userRole) {
    allowed = hasPermission(userPermissions, userRole, moduleKey, submoduleKey, action);
  } else {
    allowed = hasPermission(moduleKey, submoduleKey, action);
  }
  if (!allowed) {
    showPermissionDenied(customMessage);
    return false;
  }
  if (callback && typeof callback === 'function') {
    callback();
  }
  return true;
}

export function guardCreateAction(userPermissions, userRole, moduleKey, submoduleKey = null, addToastFn = null, customMessage = null) {
  const allowed = hasPermission(userPermissions, userRole, moduleKey, submoduleKey, 'create');
  if (!allowed) {
    showPermissionDenied(customMessage);
    return false;
  }
  return true;
}

export function canAccess(moduleKey, submoduleKey = null, action = 'view') {
  return hasPermission(moduleKey, submoduleKey, action);
}

