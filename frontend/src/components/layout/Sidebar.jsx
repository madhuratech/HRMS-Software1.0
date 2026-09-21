import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  CalendarOff,
  DollarSign,
  UserPlus,
  ClipboardList,
  BarChart3,
  FolderKanban,
  FileBarChart,
  Receipt,
  FileText,
  LifeBuoy,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  Briefcase,
  X
} from 'lucide-react';
import { cn, getAvatarUrl } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { canView } from '../../lib/permissions';

export function Sidebar({ userRole, onLogout, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedGroup, setExpandedGroup] = useState(() => {
    const currentPath = window.location.pathname;
    const match = [
      { id: 'organization', paths: ['/company-profile', '/departments', '/designations', '/teams', '/shift-management', '/holiday-calendar', '/organization-chart'] },
      { id: 'employees', paths: ['/employees'] },
      { id: 'attendance', paths: ['/attendance'] },
      { id: 'leave-management', paths: ['/leave', '/holiday-list', '/comp-off'] },
      { id: 'payroll', paths: ['/payroll'] },
      { id: 'recruitment', paths: ['/recruitment'] },
      { id: 'onboarding', paths: ['/onboarding'] },
      { id: 'performance', paths: ['/performance'] },
      { id: 'projects', paths: ['/projects'] },
      { id: 'clients', paths: ['/clients'] },
      { id: 'expenses', paths: ['/expenses'] },
      { id: 'documents', paths: ['/documents'] },
      { id: 'help-desk', paths: ['/help-desk'] },
      { id: 'settings', paths: ['/settings'] },
    ].find(g => g.paths.some(p => currentPath.startsWith(p) || currentPath === p));
    return match ? match.id : null;
  });

  const [userPermissions, setUserPermissions] = useState(() => {
    try {
      const raw = localStorage.getItem('hrms_permissions');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  // Fetch real-time role permissions from backend
  const fetchPermissions = async () => {
    try {
      const storedRole = localStorage.getItem('userRole') || userRole || 'EMPLOYEE';
      const data = await apiFetch(`/rbac/user-permissions?role=${encodeURIComponent(storedRole)}`, {
        headers: { 'x-user-role': storedRole }
      });
      if (data && data.success && (data.permissions || data.data)) {
        const freshPerms = data.permissions || data.data;
        setUserPermissions(freshPerms);
        localStorage.setItem('hrms_permissions', JSON.stringify(freshPerms));
        console.log('[Sidebar] Synced fresh permissions to localStorage for role:', storedRole);
      }
    } catch (e) {
      console.error('Failed to fetch user permissions in Sidebar:', e);
    }
  };

  useEffect(() => {
    fetchPermissions();

    const handlePermUpdate = (e) => {
      if (e && e.detail && e.detail.permissions) {
        setUserPermissions(e.detail.permissions);
      } else {
        fetchPermissions();
      }
    };

    window.addEventListener('permissionsUpdated', handlePermUpdate);
    return () => window.removeEventListener('permissionsUpdated', handlePermUpdate);
  }, [userRole]);

  const getAuthUser = () => {
    try {
      const authRaw = localStorage.getItem('hrms_auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed) {
          const userObj = parsed.user || {};
          const name = parsed.name || userObj.name || localStorage.getItem('userName') || 'Admin User';
          const role = parsed.role || userObj.role || localStorage.getItem('userRole') || userRole || 'SUPER_ADMIN';
          const photo = userObj.profile_photo || userObj.avatar || null;
          const department = userObj.department_name || userObj.department || '';
          const empCode = userObj.employee_code || userObj.employeeCode || userObj.emp_id || (userObj.employee_id ? `EMP${String(userObj.employee_id).padStart(4, '0')}` : '');

          return {
            name,
            role,
            department,
            empCode,
            initials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            photoUrl: photo ? getAvatarUrl(photo) : null
          };
        }
      }
    } catch (e) {
      console.error('Error parsing auth user for sidebar:', e);
    }

    const storedName = localStorage.getItem('userName') || 'Admin User';
    const storedRole = localStorage.getItem('userRole') || userRole || 'SUPER_ADMIN';
    return {
      name: storedName,
      role: storedRole,
      department: '',
      empCode: '',
      initials: storedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      photoUrl: null
    };
  };

  const userInfo = getAuthUser();
  const normRole = String(userInfo.role || userRole || '').toUpperCase().replace(/_/g, ' ');
  const isProtectedAdmin = normRole === 'SUPER ADMIN' || normRole === 'SUPERADMIN' || normRole === 'ADMIN';

  const handleProfileClick = () => {
    let userId = 1;
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        if (parsed.user && parsed.user.id) userId = parsed.user.id;
      } catch (e) { }
    }
    localStorage.setItem('selectedEmployeeId', userId);
    navigate('/employees/profile');
  };

  const toggleGroup = (groupId) => {
    setExpandedGroup(prev => (prev === groupId ? null : groupId));
  };

  const getDashboardPath = () => {
    if (normRole === 'EMPLOYEE') return '/employee/dashboard';
    if (normRole === 'TEAM LEADER') return '/team-leader/dashboard';
    return '/dashboard';
  };

  // Master definition of all existing HRMS sidebar modules & submodules
  const masterMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard', submoduleKey: 'dashboard_overview', path: getDashboardPath() },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      roles: ['ALL'],
      children: [
        { id: 'company-profile', label: 'Company Profile', path: '/company-profile', moduleKey: 'organization', submoduleKey: 'company_profile' },
        { id: 'departments', label: 'Departments', path: '/departments', moduleKey: 'organization', submoduleKey: 'departments' },
        { id: 'designations', label: 'Designations', path: '/designations', moduleKey: 'organization', submoduleKey: 'designations' },
        { id: 'teams', label: 'Teams', path: '/teams', moduleKey: 'organization', submoduleKey: 'teams' },
        { id: 'shift-management', label: 'Shift Management', path: '/shift-management', moduleKey: 'organization', submoduleKey: 'shift_management' },
        { id: 'holiday-calendar', label: 'Holiday Calendar', path: '/holiday-calendar', moduleKey: 'organization', submoduleKey: 'holiday_calendar' },
        { id: 'organization-chart', label: 'Organization Chart', path: '/organization-chart', moduleKey: 'organization', submoduleKey: 'organization_chart' }
      ]
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      roles: ['ALL'],
      children: [
        { id: 'employee-directory', label: 'Employee Directory', path: '/employees', moduleKey: 'employees', submoduleKey: 'employee_directory' },
        { id: 'employee-list', label: 'Employee List', path: '/employees/list', moduleKey: 'employees', submoduleKey: 'employee_list' },
        { id: 'add-employee', label: 'Add Employee', path: '/employees/add', moduleKey: 'employees', submoduleKey: 'add_employee' },
        { id: 'employee-profile', label: 'Employee Profile', path: '/employees/profile', moduleKey: 'employees', submoduleKey: 'employee_profile' },
        { id: 'employment-history', label: 'Employment History', path: '/employees/history', moduleKey: 'employees', submoduleKey: 'employment_history' },
        { id: 'promotions', label: 'Promotions', path: '/employees/promotions', moduleKey: 'employees', submoduleKey: 'promotions' },
        { id: 'transfers', label: 'Transfers', path: '/employees/transfers', moduleKey: 'employees', submoduleKey: 'transfers' },
        { id: 'exit-management', label: 'Exit Management', path: '/employees/exit', moduleKey: 'employees', submoduleKey: 'exit_management' },
        { id: 'employee-documents', label: 'Employee Documents', path: '/employees/documents', moduleKey: 'employees', submoduleKey: 'employee_documents' }
      ]
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      roles: ['ALL'],
      children: [
        { id: 'daily-attendance', label: 'Daily Attendance', path: '/attendance/daily', moduleKey: 'attendance', submoduleKey: 'daily_attendance' },
        { id: 'gps-attendance', label: 'GPS Attendance Punch', path: '/attendance/gps', moduleKey: 'attendance', submoduleKey: 'gps_attendance' },
        { id: 'regularization', label: 'Regularization', path: '/attendance/regularization', moduleKey: 'attendance', submoduleKey: 'regularization' },
        { id: 'shift-roster', label: 'Shift Roster', path: '/attendance/shift-roster', moduleKey: 'attendance', submoduleKey: 'shift_roster' },
        { id: 'overtime', label: 'Overtime', path: '/attendance/overtime', moduleKey: 'attendance', submoduleKey: 'overtime' },
        { id: 'late-arrival', label: 'Late Arrival', path: '/attendance/late-arrival', moduleKey: 'attendance', submoduleKey: 'late_arrival' },
        { id: 'punch-locations', label: 'Punch Locations', path: '/attendance/punch-locations', moduleKey: 'attendance', submoduleKey: 'punch_locations' }
      ]
    },
    {
      id: 'leave-management',
      label: 'Leave Management',
      icon: CalendarOff,
      roles: ['ALL'],
      children: [
        { id: 'leave-dashboard', label: 'Leave Dashboard', path: '/leave-dashboard', moduleKey: 'leave', submoduleKey: 'leave_dashboard' },
        { id: 'leave-applications', label: 'Leave Applications', path: '/leave-applications', moduleKey: 'leave', submoduleKey: 'my_leave' },
        { id: 'leave-approval', label: 'Leave Approval', path: '/leave-approval', moduleKey: 'leave', submoduleKey: 'leave_approval' },
        { id: 'leave-balance', label: 'Leave Balance', path: '/leave-balance', moduleKey: 'leave', submoduleKey: 'leave_balance' },
        { id: 'leave-types', label: 'Leave Types', path: '/leave-types', moduleKey: 'leave', submoduleKey: 'leave_types' },
        { id: 'holiday-list', label: 'Holiday List', path: '/holiday-list', moduleKey: 'leave', submoduleKey: 'holiday_list' },
        { id: 'comp-off', label: 'Comp Off', path: '/comp-off', moduleKey: 'leave', submoduleKey: 'comp_off' }
      ]
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: DollarSign,
      roles: ['ALL'],
      children: [
        { id: 'salary-structure', label: 'Salary Structure', path: '/payroll/salary-structure', moduleKey: 'payroll', submoduleKey: 'salary_structure' },
        { id: 'salary-components', label: 'Salary Components', path: '/payroll/components', moduleKey: 'payroll', submoduleKey: 'salary_components' },
        { id: 'payroll-processing', label: 'Payroll Processing', path: '/payroll/processing', moduleKey: 'payroll', submoduleKey: 'payroll_processing' },
        { id: 'generate-payslips', label: 'Generate Payslips', path: '/payroll/payslips', moduleKey: 'payroll', submoduleKey: 'generate_payslips' },
        { id: 'bonus-incentives', label: 'Bonus & Incentives', path: '/payroll/bonus', moduleKey: 'payroll', submoduleKey: 'bonus_incentives' },
        { id: 'reimbursements', label: 'Reimbursements', path: '/payroll/reimbursements', moduleKey: 'payroll', submoduleKey: 'reimbursements' },
        { id: 'loans-advances', label: 'Loans & Advances', path: '/payroll/loans', moduleKey: 'payroll', submoduleKey: 'loans_advances' },
        { id: 'tax-management', label: 'Tax Management', path: '/payroll/tax', moduleKey: 'payroll', submoduleKey: 'tax_management' }
      ]
    },
    {
      id: 'recruitment',
      label: 'Recruitment',
      icon: UserPlus,
      roles: ['ALL'],
      children: [
        { id: 'recruitment-dashboard', label: 'Dashboard', path: '/recruitment/dashboard', moduleKey: 'recruitment', submoduleKey: 'recruitment_dashboard' },
        { id: 'job-openings', label: 'Job Openings', path: '/recruitment/jobs', moduleKey: 'recruitment', submoduleKey: 'job_openings' },
        { id: 'candidates', label: 'Candidates', path: '/recruitment/candidates', moduleKey: 'recruitment', submoduleKey: 'candidates' },
        { id: 'screening', label: 'Screening', path: '/recruitment/screening', moduleKey: 'recruitment', submoduleKey: 'screening' },
        { id: 'interview-schedule', label: 'Interview Schedule', path: '/recruitment/interviews', moduleKey: 'recruitment', submoduleKey: 'interview_schedule' },
        { id: 'offer-letters', label: 'Offer Letters', path: '/recruitment/offers', moduleKey: 'recruitment', submoduleKey: 'offer_letters' },
        { id: 'hiring-pipeline', label: 'Hiring Pipeline', path: '/recruitment/pipeline', moduleKey: 'recruitment', submoduleKey: 'hiring_pipeline' }
      ]
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      icon: ClipboardList,
      roles: ['ALL'],
      hidden: true,
      children: [
        { id: 'new-joiners', label: 'New Joiners', path: '/onboarding/new-joiners', moduleKey: 'onboarding', submoduleKey: 'new_joiners' },
        { id: 'document-verification', label: 'Document Verification', path: '/onboarding/documents', moduleKey: 'onboarding', submoduleKey: 'document_verification' },
        { id: 'asset-allocation', label: 'Asset Allocation', path: '/onboarding/assets', moduleKey: 'onboarding', submoduleKey: 'asset_allocation' },
        { id: 'welcome-kit', label: 'Welcome Kit', path: '/onboarding/welcome-kit', moduleKey: 'onboarding', submoduleKey: 'welcome_kit' },
        { id: 'orientation', label: 'Orientation', path: '/onboarding/orientation', moduleKey: 'onboarding', submoduleKey: 'orientation' },
        { id: 'probation', label: 'Probation', path: '/onboarding/probation', moduleKey: 'onboarding', submoduleKey: 'probation' }
      ]
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      roles: ['ALL'],
      children: [
        { id: 'goals', label: 'Goals', path: '/performance/goals', moduleKey: 'performance', submoduleKey: 'goals' },
        { id: 'kpi', label: 'KPI', path: '/performance/kpis', moduleKey: 'performance', submoduleKey: 'kpis' },
        { id: 'kras', label: 'KRAs', path: '/performance/kras', moduleKey: 'performance', submoduleKey: 'kras' },
        { id: 'appraisals', label: 'Appraisals', path: '/performance/appraisals', moduleKey: 'performance', submoduleKey: 'appraisals' },
        { id: 'reviews', label: 'Reviews', path: '/performance/reviews', moduleKey: 'performance', submoduleKey: 'reviews' },
        { id: 'feedback', label: 'Feedback', path: '/performance/feedback', moduleKey: 'performance', submoduleKey: 'feedback' },
        { id: 'promotions-performance', label: 'Promotions', path: '/performance/promotions', moduleKey: 'performance', submoduleKey: 'performance_promotions' }
      ]
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      roles: ['ALL'],
      children: [
        { id: 'project-dashboard', label: 'Project Dashboard', path: '/projects/dashboard', moduleKey: 'projects', submoduleKey: 'project_dashboard' },
        { id: 'projects-list', label: 'Projects', path: '/projects/list', moduleKey: 'projects', submoduleKey: 'projects_list' },
        { id: 'tasks', label: 'Tasks', path: '/projects/tasks', moduleKey: 'projects', submoduleKey: 'tasks' },
        { id: 'sprint-board', label: 'Sprint Board', path: '/projects/sprint-board', moduleKey: 'projects', submoduleKey: 'sprint_board' },
        { id: 'timesheets', label: 'Timesheets', path: '/projects/timesheets', moduleKey: 'projects', submoduleKey: 'timesheets' },
        { id: 'milestones', label: 'Milestones', path: '/projects/milestones', moduleKey: 'projects', submoduleKey: 'milestones' },
        { id: 'team-members', label: 'Team Members', path: '/projects/team', moduleKey: 'projects', submoduleKey: 'team_members' }
      ]
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Briefcase,
      roles: ['ALL'],
      children: [
        { id: 'all-clients', label: 'All Clients', path: '/clients/list', moduleKey: 'clients', submoduleKey: 'client_management' }
      ]
    },
    { id: 'reports', label: 'Reports', icon: FileBarChart, moduleKey: 'reports', submoduleKey: 'reports_directory', path: '/reports' },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      roles: ['ALL'],
      children: [
        { id: 'expense-claims', label: 'Expense Claims', path: '/expenses/claims', moduleKey: 'expenses', submoduleKey: 'expense_claims' },
        { id: 'expense-categories', label: 'Expense Categories', path: '/expenses/categories', moduleKey: 'expenses', submoduleKey: 'expense_categories' },
        { id: 'expense-approval', label: 'Expense Approval', path: '/expenses/approval', moduleKey: 'expenses', submoduleKey: 'expense_approval' },
        { id: 'expense-reimbursements', label: 'Reimbursements', path: '/expenses/reimbursements', moduleKey: 'expenses', submoduleKey: 'expense_reimbursements' },
        { id: 'expense-reports', label: 'Expense Reports', path: '/expenses/reports', moduleKey: 'expenses', submoduleKey: 'expense_reports' }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      roles: ['ALL'],
      children: [
        { id: 'employee-documents-module', label: 'Employee Documents', path: '/documents/employee', moduleKey: 'documents', submoduleKey: 'doc_employee' },
        { id: 'company-documents', label: 'Company Documents', path: '/documents/company', moduleKey: 'documents', submoduleKey: 'doc_company' },
        { id: 'hr-policies', label: 'HR Policies', path: '/documents/policies', moduleKey: 'documents', submoduleKey: 'doc_policies' },
        { id: 'templates', label: 'Templates', path: '/documents/templates', moduleKey: 'documents', submoduleKey: 'doc_templates' },
        { id: 'digital-signatures', label: 'Digital Signatures', path: '/documents/signatures', moduleKey: 'documents', submoduleKey: 'doc_signatures' }
      ]
    },
    {
      id: 'help-desk',
      label: 'Help Desk',
      icon: LifeBuoy,
      roles: ['ALL'],
      children: [
        { id: 'help-desk-dashboard', label: 'Dashboard', path: '/help-desk/dashboard', moduleKey: 'helpdesk', submoduleKey: 'helpdesk_dashboard' },
        { id: 'tickets', label: 'Tickets', path: '/help-desk/tickets', moduleKey: 'helpdesk', submoduleKey: 'tickets' },
        { id: 'categories', label: 'Categories', path: '/help-desk/categories', moduleKey: 'helpdesk', submoduleKey: 'helpdesk_categories' },
        { id: 'priorities', label: 'Priorities', path: '/help-desk/priorities', moduleKey: 'helpdesk', submoduleKey: 'helpdesk_priorities' },
        { id: 'help-desk-reports', label: 'Reports', path: '/help-desk/reports', moduleKey: 'helpdesk', submoduleKey: 'helpdesk_reports' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['ALL'],
      children: [
        { id: 'settings-company', label: 'Company Information', path: '/settings/company', moduleKey: 'settings', submoduleKey: 'settings_company' },
        { id: 'settings-branding', label: 'Branding', path: '/settings/branding', moduleKey: 'settings', submoduleKey: 'settings_branding' },
        { id: 'settings-organization', label: 'Organization', path: '/settings/organization', moduleKey: 'settings', submoduleKey: 'settings_organization' },
        { id: 'settings-users', label: 'User Roles & Permissions', path: '/settings/users', moduleKey: 'user_roles', submoduleKey: 'roles_matrix' },
        { id: 'admin-register', label: 'Register Admin / Manager', path: '/admin-register', moduleKey: 'user_roles', submoduleKey: 'roles_matrix' },
        { id: 'settings-hr', label: 'HR Settings', path: '/settings/hr', moduleKey: 'settings', submoduleKey: 'settings_hr' },
        { id: 'settings-communication', label: 'Communication', path: '/settings/communication', moduleKey: 'settings', submoduleKey: 'settings_communication' },
        { id: 'settings-integrations', label: 'Integrations', path: '/settings/integrations', moduleKey: 'settings', submoduleKey: 'settings_integrations' },
        { id: 'settings-security', label: 'Security', path: '/settings/security', moduleKey: 'settings', submoduleKey: 'settings_security' },
        { id: 'settings-system', label: 'System', path: '/settings/system', moduleKey: 'settings', submoduleKey: 'settings_system' }
      ]
    },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, moduleKey: 'ai_assistant', submoduleKey: 'ai_dashboard', path: '/ai-assistant' },
  ];

  const isItemPermitted = (item) => {
    if (isProtectedAdmin) return true;
    if (!userPermissions) return false;
    return canView(userPermissions, normRole, item.moduleKey, item.submoduleKey);
  };

  // Admin / Super Admin gets the original sidebar without hidden items
  // Employee / Team Leader / HR gets the dynamic database-driven sidebar without hidden items
  const filteredMenu = React.useMemo(() => {
    const visibleMasterItems = masterMenuItems.filter(item => !item.hidden);
    if (isProtectedAdmin) return visibleMasterItems;
    return visibleMasterItems
      .map(item => {
        if (item.children && item.children.length > 0) {
          const validChildren = item.children.filter(child => !child.hidden && isItemPermitted(child));
          if (validChildren.length > 0) return { ...item, children: validChildren };
          return null;
        }
        return isItemPermitted(item) ? item : null;
      })
      .filter(Boolean);
  }, [isProtectedAdmin, userPermissions, normRole]);

  useEffect(() => {
    const currentPath = location.pathname;
    const matchingGroup = filteredMenu.find(item => {
      if (item.children) {
        return item.children.some(child => child.path && (currentPath.startsWith(child.path) || currentPath === child.path));
      }
      return false;
    });

    if (matchingGroup) {
      setExpandedGroup(matchingGroup.id);
    } else {
      setExpandedGroup(null);
    }
  }, [location.pathname]);

  const handleNav = (path) => {
    navigate(path);
    if (onClose && typeof onClose === 'function') onClose();
  };

  const renderMenuItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroup === item.id;
    const isActive = item.path === location.pathname || (hasChildren && item.children.some(child => child.path === location.pathname));

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleGroup(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
              isActive ? "text-white" : "custom-sidebar-btn"
            )}
          >
            <item.icon size={18} />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-0.5">
              {item.children.map(child => {
                const targetPath = child.path || `/${child.id}`;
                return (
                  <button
                    key={child.id}
                    onClick={() => handleNav(targetPath)}
                    className={cn(
                      "w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-lg transition-colors text-sm",
                      location.pathname === targetPath
                        ? "custom-sidebar-btn-active bg-blue-600 text-white"
                        : "custom-sidebar-btn"
                    )}
                  >
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{child.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isAIAssistant = item.id === 'ai-assistant';

    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.path || `/${item.id}`)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
          isActive
            ? (isAIAssistant ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "custom-sidebar-btn-active bg-blue-600 text-white")
            : "custom-sidebar-btn"
        )}
      >
        <item.icon
          size={18}
          className={cn(isAIAssistant ? "animate-pulse" : "")}
          style={isAIAssistant ? {
            stroke: 'url(#ai-spark-gradient)',
            filter: 'drop-shadow(0 0 18px rgba(139, 92, 246, 0.35))'
          } : {}}
        />
        {item.label}
      </button>
    );
  };

  return (
    <>
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="ai-spark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="sidebar custom-sidebar overflow-y-auto safe-area-top">
        {/* Logo */}
        <div className="p-5 custom-sidebar-border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">HAWKEYE NEST</h1>
              <p className="text-[10px] text-blue-200/80 uppercase tracking-widest font-semibold mt-0.5">HRMS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenu.map(item => renderMenuItem(item))}
          {!isProtectedAdmin && !userPermissions && (
            <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Loading permissions...
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-3 custom-sidebar-border-t">
          <div className="custom-sidebar-profile-bg rounded-lg p-3 flex items-center gap-3">
            <div
              onClick={handleProfileClick}
              style={{ cursor: 'pointer' }}
              className="flex flex-1 items-center gap-3 min-w-0 hover:opacity-85 transition-opacity"
            >
              {userInfo.photoUrl ? (
                <img
                  src={userInfo.photoUrl}
                  alt={userInfo.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full custom-sidebar-profile-avatar-bg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white">
                  {userInfo.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userInfo.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{userInfo.role ? userInfo.role.replace(/_/g, ' ') : 'Employee'}{userInfo.empCode ? ` (${userInfo.empCode})` : ''}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors p-1 flex-shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
