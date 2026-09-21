import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, ChevronRight, X, Calendar, CheckSquare, Folder,
  Settings, FileText, HelpCircle,
  CheckCircle2, XCircle, User, Clock, Wallet, AlignJustify,
  Sparkles, Building, Briefcase, Award, Shield, UserPlus, BookOpen,
  Layers, ArrowRight, Loader2, Tag, LayoutDashboard, Users, MapPin, CheckCircle
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function Header({ title, userRole, currentView }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global Dynamic Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchEmployees, setSearchEmployees] = useState([]);
  const [searchTickets, setSearchTickets] = useState([]);
  const searchContainerRef = useRef(null);

  // App Routes / Modules navigation list
  const APP_PAGES = [
    { title: 'Dashboard', path: '/dashboard', category: 'Overview', icon: LayoutDashboard, keywords: 'home stats metrics overview' },
    { title: 'Employees Directory', path: '/employees', category: 'Employees', icon: Users, keywords: 'staff list people team directory' },
    { title: 'Add New Employee', path: '/employees/add', category: 'Employees', icon: UserPlus, keywords: 'create employee onboarding register' },
    { title: 'Attendance Logs', path: '/attendance/logs', category: 'Attendance', icon: Calendar, keywords: 'clock in clock out records punches' },
    { title: 'Attendance Regularization', path: '/attendance/regularization', category: 'Attendance', icon: Clock, keywords: 'regularize correction punch request' },
    { title: 'Shifts & Schedules', path: '/attendance/shifts', category: 'Attendance', icon: Clock, keywords: 'roster working hours shifts' },
    { title: 'Overtime Requests', path: '/attendance/overtime', category: 'Attendance', icon: Clock, keywords: 'extra hours ot compensation' },
    { title: 'Client Live Tracking', path: '/attendance/visits', category: 'Attendance', icon: MapPin, keywords: 'gps location field visits clients live' },
    { title: 'Leave Requests', path: '/leaves/requests', category: 'Leaves', icon: Calendar, keywords: 'apply leave sick casual vacation approval' },
    { title: 'Leave Balances', path: '/leaves/balances', category: 'Leaves', icon: Calendar, keywords: 'quota balance entitlement remaining' },
    { title: 'Leave Policies', path: '/leaves/policies', category: 'Leaves', icon: FileText, keywords: 'rules holiday list policies' },
    { title: 'Payroll Dashboard', path: '/payroll', category: 'Payroll', icon: Wallet, keywords: 'salary pay run compensation slips' },
    { title: 'Salary Structure', path: '/payroll/structure', category: 'Payroll', icon: Wallet, keywords: 'ctc components allowances deductions' },
    { title: 'Reimbursements', path: '/payroll/reimbursements', category: 'Payroll', icon: Wallet, keywords: 'expense claims bills reimbursement' },
    { title: 'Job Openings', path: '/recruitment/jobs', category: 'Recruitment', icon: Briefcase, keywords: 'hiring positions vacancies jobs recruitment' },
    { title: 'Candidates', path: '/recruitment/candidates', category: 'Recruitment', icon: Users, keywords: 'applicants resumes screening candidates' },
    { title: 'Interview Schedule', path: '/recruitment/interviews', category: 'Recruitment', icon: Calendar, keywords: 'rounds interviews schedule interviewers' },
    { title: 'Offer Letters', path: '/recruitment/offers', category: 'Recruitment', icon: FileText, keywords: 'job offer letters release candidates' },
    { title: 'Performance Reviews', path: '/performance/reviews', category: 'Performance', icon: Award, keywords: 'appraisals ratings evaluations review' },
    { title: 'Goals & OKRs', path: '/performance/goals', category: 'Performance', icon: Award, keywords: 'kpi kra objectives targets key results' },
    { title: 'Support Tickets', path: '/helpdesk/tickets', category: 'Help Desk', icon: HelpCircle, keywords: 'issues support complaints helpdesk tickets' },
    { title: 'Helpdesk Categories', path: '/helpdesk/categories', category: 'Help Desk', icon: Folder, keywords: 'categories departments ticket type' },
    { title: 'Helpdesk Priorities', path: '/helpdesk/priorities', category: 'Help Desk', icon: Shield, keywords: 'priorities sla urgent high medium' },
    { title: 'Knowledge Base', path: '/helpdesk/kb', category: 'Help Desk', icon: BookOpen, keywords: 'articles faqs guides kb knowledge' },
    { title: 'Company Profile', path: '/organization/company-profile', category: 'Organization', icon: Building, keywords: 'company info documents statutory profile' },
    { title: 'Departments', path: '/organization/departments', category: 'Organization', icon: Layers, keywords: 'divisions units departments org' },
    { title: 'Designations', path: '/organization/designations', category: 'Organization', icon: Shield, keywords: 'roles positions titles designations' },
    { title: 'Teams', path: '/organization/teams', category: 'Organization', icon: Users, keywords: 'squads team leaders members' },
    { title: 'AI Assistant', path: '/ai-assistant', category: 'AI Tools', icon: Sparkles, keywords: 'ai chat bot ask assistant insights gemini' },
    { title: 'System Settings', path: '/settings', category: 'Settings', icon: Settings, keywords: 'config roles permissions audit' },
  ];

  // Debounced API search for live database records
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchEmployees([]);
      setSearchTickets([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const q = encodeURIComponent(searchQuery.trim());
        const [empRes, ticketRes] = await Promise.allSettled([
          apiFetch(`/employees?search=${q}&limit=5`),
          apiFetch(`/tickets?search=${q}&limit=5`)
        ]);

        if (empRes.status === 'fulfilled' && empRes.value) {
          const empList = Array.isArray(empRes.value.employees) ? empRes.value.employees : (Array.isArray(empRes.value) ? empRes.value : []);
          setSearchEmployees(empList.slice(0, 4));
        } else {
          setSearchEmployees([]);
        }

        if (ticketRes.status === 'fulfilled' && ticketRes.value) {
          const tList = Array.isArray(ticketRes.value.tickets) ? ticketRes.value.tickets : (Array.isArray(ticketRes.value) ? ticketRes.value : []);
          setSearchTickets(tList.slice(0, 4));
        } else {
          setSearchTickets([]);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPages = searchQuery.trim()
    ? APP_PAGES.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.keywords.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [
        APP_PAGES.find(p => p.path === '/ai-assistant'),
        APP_PAGES.find(p => p.path === '/helpdesk/tickets'),
        APP_PAGES.find(p => p.path === '/employees'),
        APP_PAGES.find(p => p.path === '/leaves/requests'),
      ].filter(Boolean);

  const handleSelectPage = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSelectEmployee = (emp) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    localStorage.setItem('selectedEmployeeId', emp.id);
    navigate('/employees/profile');
  };

  const handleSelectTicket = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate('/helpdesk/tickets');
  };

  const authRaw = localStorage.getItem('hrms_auth');
  let authData = {};
  try { if (authRaw) authData = JSON.parse(authRaw); } catch (e) { }

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

  const fetchNotifications = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await apiFetch('/notifications');
      if (res && res.success) {
        const notifList = Array.isArray(res.notifications) ? res.notifications : (Array.isArray(res.data) ? res.data : []);
        setNotifications(notifList);
        const count = typeof res.unreadCount === 'number' ? res.unreadCount : notifList.filter(n => !n.is_read && !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (e) {
      // Gracefully maintain current state on network hiccups
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    const handleOnline = () => fetchNotifications();
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleOnline);
    };
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead && !notif.is_read) {
        await apiFetch(`/notifications/${notif.id}/read`, { method: 'PUT' });
      }
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setShowNotifications(false);
      if (notif.actionUrl || notif.action_url) {
        navigate(notif.actionUrl || notif.action_url);
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Just now';
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Returns rowBg (full row tint), iconBg, and icon element per notification type
  const getItemTheme = (type) => {
    const t = (type || '').toUpperCase();

    if (t.includes('LEAVE_APPROVED') || t.includes('LEAVE_APPROVAL')) {
      return {
        rowBg: '#F3FDF6',
        iconBg: '#D1FAE5',
        icon: <CheckCircle2 size={22} style={{ color: '#16A34A' }} />,
      };
    }
    if (t.includes('LEAVE_REJECTED') || t.includes('LEAVE_REJECTION')) {
      return {
        rowBg: '#FFF5F5',
        iconBg: '#FEE2E2',
        icon: <XCircle size={22} style={{ color: '#DC2626' }} />,
      };
    }
    if (t.includes('LEAVE')) {
      return {
        rowBg: '#F0F4FF',
        iconBg: '#DBEAFE',
        icon: <Calendar size={22} style={{ color: '#1D61E7' }} />,
      };
    }
    if (t.includes('PAYROLL') || t.includes('PAYSLIP')) {
      return {
        rowBg: '#F3FDF6',
        iconBg: '#D1FAE5',
        icon: <Wallet size={22} style={{ color: '#16A34A' }} />,
      };
    }
    if (t.includes('ATTENDANCE')) {
      return {
        rowBg: '#F3FDF6',
        iconBg: '#D1FAE5',
        icon: <Clock size={22} style={{ color: '#16A34A' }} />,
      };
    }
    if (t.includes('PERMISSION') || t.includes('ROLE')) {
      return {
        rowBg: '#F8F4FF',
        iconBg: '#EDE9FE',
        icon: <Settings size={22} style={{ color: '#7C3AED' }} />,
      };
    }
    if (t.includes('DOCUMENT')) {
      return {
        rowBg: '#F0F4FF',
        iconBg: '#DBEAFE',
        icon: <FileText size={22} style={{ color: '#1D61E7' }} />,
      };
    }
    if (t.includes('TASK')) {
      return {
        rowBg: '#F0F4FF',
        iconBg: '#DBEAFE',
        icon: <CheckSquare size={22} style={{ color: '#1D61E7' }} />,
      };
    }
    if (t.includes('PROJECT')) {
      return {
        rowBg: '#F8F4FF',
        iconBg: '#EDE9FE',
        icon: <Folder size={22} style={{ color: '#7C3AED' }} />,
      };
    }
    if (t.includes('TICKET') || t.includes('HELPDESK')) {
      return {
        rowBg: '#FFF5F5',
        iconBg: '#FEE2E2',
        icon: <HelpCircle size={22} style={{ color: '#DC2626' }} />,
      };
    }
    if (t.includes('EMPLOYEE') || t.includes('PROFILE')) {
      return {
        rowBg: '#F0F4FF',
        iconBg: '#DBEAFE',
        icon: <User size={22} style={{ color: '#1D61E7' }} />,
      };
    }
    // default
    return {
      rowBg: '#F0F4FF',
      iconBg: '#DBEAFE',
      icon: <Bell size={22} style={{ color: '#1D61E7' }} />,
    };
  };

  const getBreadcrumbs = () => {
    const viewMap = {
      // Main & Common
      'dashboard': ['Dashboard'],
      'ai-assistant': ['AI Assistant'],
      'notifications': ['Notifications'],

      // Organization
      'company-profile': ['Organization', 'Company Profile'],
      'branches': ['Organization', 'Branches'],
      'departments': ['Organization', 'Departments'],
      'designations': ['Organization', 'Designations'],
      'teams': ['Organization', 'Teams'],
      'work-locations': ['Organization', 'Work Locations'],
      'shift-management': ['Organization', 'Shift Management'],
      'holiday-calendar': ['Organization', 'Holiday Calendar'],
      'organization-chart': ['Organization', 'Organization Chart'],
      'user-roles': ['Organization', 'User Roles'],

      // Employees (Admin/HR)
      'employees': ['Employees', 'Employee Directory'],
      'employees-dashboard': ['Employees', 'Employee Directory'],
      'employees-list': ['Employees', 'Employee List'],
      'employees-add': ['Employees', 'Add Employee'],
      'employees-profile': ['Employees', 'Employee Profile'],
      'employees-history': ['Employees', 'Employment History'],
      'employees-promotions': ['Employees', 'Promotions'],
      'employees-transfers': ['Employees', 'Transfers'],
      'employees-exit': ['Employees', 'Exit Management'],
      'employees-documents': ['Employees', 'Employee Documents'],
      'employees-reports': ['Employees', 'Employee Reports'],

      // Employee Self-Service Portal
      'employee': ['Employee Portal', 'Dashboard'],
      'employee-dashboard': ['Employee Portal', 'Dashboard'],
      'employee-profile': ['Employees', 'Employee Profile'],
      'employee-attendance': ['Employee Portal', 'My Attendance'],
      'employee-shift': ['Employee Portal', 'My Shift'],
      'employee-leave': ['Employee Portal', 'Leave Applications'],
      'employee-leave-balance': ['Employee Portal', 'Leave Balance'],
      'employee-leave-requests': ['Employee Portal', 'Leave Requests'],
      'employee-leave-types': ['Employee Portal', 'Leave Types'],
      'employee-holidays': ['Employee Portal', 'Holidays'],
      'employee-payroll': ['Payroll', 'Generate Payslips'],
      'employee-tasks': ['Employee Portal', 'My Tasks'],
      'employee-performance': ['Employee Portal', 'My Performance'],
      'employee-documents': ['Employee Portal', 'My Documents'],
      'employee-announcements': ['Employee Portal', 'Announcements'],
      'employee-help': ['Employee Portal', 'Help Desk'],

      // Team Leader Portal
      'team-leader': ['Team Leader Portal', 'Dashboard'],
      'team-leader-dashboard': ['Team Leader Portal', 'Dashboard'],
      'team-leader-profile': ['Employees', 'Employee Profile'],
      'team-leader-my-attendance': ['Team Leader Portal', 'My Attendance'],
      'team-leader-my-shift': ['Team Leader Portal', 'My Shift'],
      'team-leader-team-attendance': ['Team Leader Portal', 'Team Attendance'],
      'team-leader-projects': ['Team Leader Portal', 'Projects'],
      'team-leader-team-tasks': ['Team Leader Portal', 'Team Tasks'],
      'team-leader-team-performance': ['Team Leader Portal', 'Team Performance'],
      'team-leader-my-leave': ['Team Leader Portal', 'My Leave'],
      'team-leader-team-leave': ['Team Leader Portal', 'Team Leave Approval'],
      'team-leader-holidays': ['Team Leader Portal', 'Holidays'],
      'team-leader-leave-types': ['Team Leader Portal', 'Leave Types'],
      'team-leader-my-payroll': ['Payroll', 'Generate Payslips'],
      'team-leader-help': ['Team Leader Portal', 'Help Desk'],

      // Attendance
      'attendance': ['Attendance', 'Daily Attendance'],
      'attendance-daily': ['Attendance', 'Daily Attendance'],
      'attendance-gps': ['Attendance', 'GPS & Geofencing'],
      'attendance-gps-punch': ['Attendance', 'GPS Attendance Punch'],
      'attendance-punch': ['Attendance', 'GPS Attendance Punch'],
      'attendance-punch-locations': ['Attendance', 'Punch Locations'],
      'attendance-biometric': ['Attendance', 'Biometric Attendance'],
      'attendance-regularization': ['Attendance', 'Regularization'],
      'attendance-shift-roster': ['Attendance', 'Shift Roster'],
      'attendance-overtime': ['Attendance', 'Overtime'],
      'attendance-late-arrival': ['Attendance', 'Late Arrival'],
      'attendance-reports': ['Attendance', 'Attendance Reports'],

      // Leave Management
      'leave-management': ['Leave Management', 'Leave Dashboard'],
      'leave-dashboard': ['Leave Management', 'Leave Dashboard'],
      'leave-applications': ['Leave Management', 'Leave Applications'],
      'leave-approval': ['Leave Management', 'Leave Approval'],
      'leave-balance': ['Leave Management', 'Leave Balance'],
      'leave-types': ['Leave Management', 'Leave Types'],
      'leave-reports': ['Leave Management', 'Leave Reports'],
      'holiday-list': ['Leave Management', 'Holiday List'],
      'comp-off': ['Leave Management', 'Comp Off'],

      // Payroll
      'payroll': ['Payroll', 'Salary Structure'],
      'payroll-salary-structure': ['Payroll', 'Salary Structure'],
      'payroll-components': ['Payroll', 'Salary Components'],
      'payroll-processing': ['Payroll', 'Payroll Processing'],
      'payroll-payslips': ['Payroll', 'Generate Payslips'],
      'payroll-bonus': ['Payroll', 'Bonus & Incentives'],
      'payroll-reimbursements': ['Payroll', 'Reimbursements'],
      'payroll-loans': ['Payroll', 'Loans & Advances'],
      'payroll-tax': ['Payroll', 'Tax Management'],
      'payroll-reports': ['Payroll', 'Payroll Reports'],

      // Recruitment
      'recruitment': ['Recruitment', 'Recruitment Dashboard'],
      'recruitment-dashboard': ['Recruitment', 'Recruitment Dashboard'],
      'recruitment-jobs': ['Recruitment', 'Job Openings'],
      'recruitment-candidates': ['Recruitment', 'Candidates'],
      'recruitment-screening': ['Recruitment', 'Candidate Screening'],
      'recruitment-interviews': ['Recruitment', 'Interview Schedule'],
      'recruitment-offers': ['Recruitment', 'Offer Letters'],
      'recruitment-pipeline': ['Recruitment', 'Hiring Pipeline'],
      'recruitment-reports': ['Recruitment', 'Recruitment Reports'],

      // Onboarding
      'onboarding': ['Onboarding', 'New Joiners'],
      'onboarding-new-joiners': ['Onboarding', 'New Joiners'],
      'onboarding-documents': ['Onboarding', 'Document Verification'],
      'onboarding-assets': ['Onboarding', 'Asset Allocation'],
      'onboarding-welcome-kit': ['Onboarding', 'Welcome Kit'],
      'onboarding-orientation': ['Onboarding', 'Orientation'],
      'onboarding-probation': ['Onboarding', 'Probation'],

      // Performance
      'performance': ['Performance', 'Goals'],
      'performance-goals': ['Performance', 'Goals'],
      'performance-kpis': ['Performance', 'KPIs'],
      'performance-kras': ['Performance', 'KRAs'],
      'performance-appraisals': ['Performance', 'Appraisals'],
      'performance-reviews': ['Performance', 'Reviews'],
      'performance-feedback': ['Performance', 'Feedback'],
      'performance-promotions': ['Performance', 'Promotions'],
      'performance-reports': ['Performance', 'Performance Reports'],

      // Projects
      'projects': ['Projects', 'Project Dashboard'],
      'projects-dashboard': ['Projects', 'Project Dashboard'],
      'projects-list': ['Projects', 'Projects List'],
      'projects-tasks': ['Projects', 'Tasks'],
      'projects-sprint-board': ['Projects', 'Sprint Board'],
      'projects-timesheets': ['Projects', 'Timesheets'],
      'projects-milestones': ['Projects', 'Milestones'],
      'projects-team': ['Projects', 'Team Members'],
      'projects-reports': ['Projects', 'Project Reports'],

      // Clients
      'clients': ['Clients', 'All Clients'],
      'clients-list': ['Clients', 'All Clients'],
      'clients-add': ['Clients', 'Add Client'],

      // Expenses
      'expenses': ['Expenses', 'Expense Claims'],
      'expenses-claims': ['Expenses', 'Expense Claims'],
      'expenses-categories': ['Expenses', 'Expense Categories'],
      'expenses-approval': ['Expenses', 'Expense Approval'],
      'expenses-reimbursements': ['Expenses', 'Reimbursements'],
      'expenses-reports': ['Expenses', 'Expense Reports'],

      // Documents
      'documents': ['Documents', 'Employee Documents'],
      'documents-employee': ['Documents', 'Employee Documents'],
      'documents-company': ['Documents', 'Company Documents'],
      'documents-policies': ['Documents', 'HR Policies'],
      'documents-templates': ['Documents', 'Templates'],
      'documents-signatures': ['Documents', 'Digital Signatures'],

      // Help Desk
      'help-desk': ['Help Desk', 'Help Desk Dashboard'],
      'help-desk-dashboard': ['Help Desk', 'Help Desk Dashboard'],
      'help-desk-tickets': ['Help Desk', 'Tickets'],
      'help-desk-categories': ['Help Desk', 'Categories'],
      'help-desk-priorities': ['Help Desk', 'Priorities'],
      'help-desk-knowledge-base': ['Help Desk', 'Knowledge Base'],
      'help-desk-reports': ['Help Desk', 'Help Desk Reports'],

      // Settings
      'settings': ['Settings', 'Company Settings'],
      'settings-company': ['Settings', 'Company Settings'],
      'settings-branding': ['Settings', 'Branding'],
      'settings-organization': ['Settings', 'Organization'],
      'settings-users': ['Settings', 'User Roles & Permissions'],
      'settings-hr': ['Settings', 'HR Settings'],
      'settings-communication': ['Settings', 'Communication'],
      'settings-integrations': ['Settings', 'Integrations'],
      'settings-security': ['Settings', 'Security'],
      'settings-system': ['Settings', 'System Settings'],

      // Reports
      'reports': ['Reports', 'Reports Directory'],
      'reports-employees': ['Reports', 'Employee Reports'],
      'reports-employee': ['Reports', 'Employee Reports'],
      'reports-attendance': ['Reports', 'Attendance Reports'],
      'reports-leave': ['Reports', 'Leave Reports'],
      'reports-payroll': ['Reports', 'Payroll Reports'],
      'reports-recruitment': ['Reports', 'Recruitment Reports'],
      'reports-performance': ['Reports', 'Performance Reports'],
      'reports-projects': ['Reports', 'Project Reports'],
      'reports-project': ['Reports', 'Project Reports'],
      'reports-expenses': ['Reports', 'Expense Reports'],

      // Sales, Support & Service
      'sales': ['Sales', 'Sales Entry'],
      'leads': ['Sales', 'Sales Enquiries'],
      'customer-sales': ['Sales', 'Customer Sales Details'],
      'service': ['Service', 'Task Board'],
      'news': ['Communication', 'News Feed'],
      'schedule': ['HR', 'Shift Scheduler'],
      'support': ['Support', 'Support Tickets'],
      'assets': ['Assets', 'Asset Allocation'],
    };

    if (viewMap[currentView]) {
      return viewMap[currentView];
    }

    // Dynamic matching for client paths
    if (currentView?.startsWith('clients-')) {
      if (currentView.endsWith('-edit')) return ['Clients', 'Edit Client'];
      return ['Clients', 'Client Details'];
    }

    // Smart fallback formatting: turn 'recruitment-dashboard' -> ['Recruitment', 'Dashboard']
    if (currentView && typeof currentView === 'string') {
      const parts = currentView.split('-').filter(Boolean);
      if (parts.length > 0) {
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
      }
    }

    return [title || 'Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="header h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight size={14} className="text-slate-400" />}
              <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-6">
        {/* Dynamic Global Search */}
        <div className="relative" ref={searchContainerRef} style={{ width: 280 }}>
          <style>{`
            .clean-search-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .clean-search-scroll::-webkit-scrollbar-track {
              background: #F8FAFC;
              border-radius: 8px;
            }
            .clean-search-scroll::-webkit-scrollbar-thumb {
              background: #CBD5E1;
              border-radius: 8px;
            }
            .clean-search-scroll::-webkit-scrollbar-thumb:hover {
              background: #94A3B8;
            }
          `}</style>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Search 
              size={16} 
              color="#94A3B8" 
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search anything..."
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 38,
                paddingRight: searchQuery || isSearching ? 34 : 14,
                background: isSearchOpen ? '#FFFFFF' : '#F1F5F9',
                border: isSearchOpen ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                borderRadius: 20,
                fontSize: 13.5,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'all 0.18s ease',
                boxShadow: isSearchOpen ? '0 0 0 3.5px rgba(37, 99, 235, 0.12)' : 'none',
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchEmployees([]);
                  setSearchTickets([]);
                }}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#E2E8F0',
                  border: 'none',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: 0,
                  zIndex: 2,
                }}
                title="Clear search"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            ) : isSearching ? (
              <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', zIndex: 2, display: 'flex' }}>
                <Loader2 size={15} className="animate-spin" color="#2563EB" />
              </div>
            ) : null}
          </div>

          {/* Search Dropdown Popup */}
          {isSearchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: -80,
                width: 440,
                maxWidth: 'calc(100vw - 32px)',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.16), 0 2px 10px rgba(15, 23, 42, 0.06)',
                zIndex: 9999,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeInDown 0.15s ease-out',
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
            >
              {/* Header inside search popup */}
              <div style={{
                padding: '10px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  {searchQuery ? `Results for "${searchQuery}"` : 'Quick Navigation'}
                </span>
                {isSearching ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Loader2 size={12} className="animate-spin" /> Searching live...
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>HRMS Database</span>
                )}
              </div>

              {/* Scrollable container */}
              <div 
                className="clean-search-scroll"
                style={{
                  maxHeight: 380,
                  overflowY: 'auto',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* 1. Navigation & Pages */}
                {filteredPages.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 8px 6px',
                    }}>
                      Pages & Modules
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {filteredPages.map((page, idx) => {
                        const Icon = page.icon;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectPage(page.path)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <div style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                borderRadius: 8,
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#475569',
                                flexShrink: 0,
                              }}>
                                <Icon size={16} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                  {page.title}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                  {page.category}
                                </div>
                              </div>
                            </div>
                            <ArrowRight size={14} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 8 }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Employees search results */}
                {searchEmployees.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 8px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span>Employees ({searchEmployees.length})</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'none' }}>Live Database</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            {emp.profile_photo ? (
                              <img
                                src={emp.profile_photo.startsWith('http') ? emp.profile_photo : `/uploads/photos/${emp.profile_photo}`}
                                alt={emp.name}
                                style={{
                                  width: 32,
                                  height: 32,
                                  minWidth: 32,
                                  maxWidth: 32,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1px solid #E2E8F0',
                                  flexShrink: 0,
                                }}
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=2563EB&color=fff`; }}
                              />
                            ) : (
                              <div style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                maxWidth: 32,
                                borderRadius: '50%',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #DBEAFE',
                                fontWeight: 700,
                                fontSize: 11.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {(emp.name || 'E').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                {emp.name}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                {emp.role_name || emp.role || emp.dept_name || emp.email}
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: '#2563EB',
                            background: '#EFF6FF',
                            border: '1px solid #DBEAFE',
                            padding: '2px 8px',
                            borderRadius: 12,
                            flexShrink: 0,
                            marginLeft: 8,
                          }}>
                            Profile
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Tickets search results */}
                {searchTickets.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 8px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span>Support Tickets ({searchTickets.length})</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'none' }}>Help Desk</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchTickets.map((ticket, idx) => (
                        <div
                          key={ticket.id || idx}
                          onClick={handleSelectTicket}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              maxWidth: 32,
                              borderRadius: 8,
                              background: '#FEF3C7',
                              color: '#D97706',
                              border: '1px solid #FDE68A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <HelpCircle size={16} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#2563EB',
                                  background: '#EFF6FF',
                                  border: '1px solid #DBEAFE',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  flexShrink: 0,
                                }}>
                                  {ticket.id}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                  {ticket.subject}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                                {ticket.requester} &bull; {ticket.status}
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            flexShrink: 0,
                            marginLeft: 8,
                            ...(ticket.status === 'Open' ? { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' } :
                               ticket.status === 'In Progress' ? { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' } :
                               ticket.status === 'Resolved' || ticket.status === 'Closed' ? { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' } :
                               { background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }),
                          }}>
                            {ticket.status || 'Ticket'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchQuery.trim() && !isSearching && filteredPages.length === 0 && searchEmployees.length === 0 && searchTickets.length === 0 && (
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <Search size={24} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>No results found for "{searchQuery}"</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Try searching by module name, employee name, or ticket subject</div>
                  </div>
                )}
              </div>

              {/* Bottom Shortcut bar */}
              <div style={{
                padding: '8px 16px',
                background: '#F8FAFC',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#64748B',
              }}>
                <span>Tip: Click any item to navigate directly</span>
                <span style={{
                  background: '#FFFFFF',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: '#475569',
                }}>
                  ESC to close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: unreadCount > 9 ? 18 : 18,
                  height: 18,
                  width: unreadCount > 9 ? 'auto' : 18,
                  padding: unreadCount > 9 ? '0 5px' : 0,
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* ══════════════════════════════════════════════
              NOTIFICATION DROPDOWN — reference image match
          ══════════════════════════════════════════════ */}
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowNotifications(false)}
              />

              {/* Card */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 520,
                  maxWidth: 'calc(100vw - 2rem)',
                  background: '#FFFFFF',
                  borderRadius: 24,
                  boxShadow: '0 20px 60px rgba(15,23,42,0.13)',
                  border: '1px solid #E8EDF5',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'min(580px, 85vh)',
                  overflow: 'hidden',
                }}
              >

                {/* ── HEADER (fixed) ── */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: '20px 24px 16px 24px',
                    borderBottom: '1px solid #F0F4FA',
                    background: '#FFFFFF',
                  }}
                >
                  {/* Row 1: title + badge  |  mark-all-read + divider + X */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1 }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: '#EBF3FF',
                            color: '#1A73E8',
                            border: '1px solid #C5DAFC',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 10px',
                            lineHeight: '18px',
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 13, fontWeight: 600, color: '#1A73E8',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 0, lineHeight: 1,
                          }}
                        >
                          <CheckCircle2 size={15} style={{ color: '#1A73E8' }} />
                          Mark all read
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <span style={{ width: 1, height: 18, background: '#CBD5E1', display: 'inline-block', margin: '0 2px' }} />
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 8,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94A3B8',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: subtitle */}
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 400 }}>
                    Recent activity and updates
                  </p>
                </div>

                {/* ── NOTIFICATION LIST (scrollable) ── */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent',
                  }}
                >
                  {notifications.length === 0 ? (
                    /* ── Empty state ── */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 56, height: 56, borderRadius: 16,
                          background: '#F8FAFF', border: '1px solid #E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 14,
                        }}
                      >
                        <Bell size={24} style={{ color: '#CBD5E1' }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: 0 }}>No new notifications</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>You're all caught up.</p>
                    </div>
                  ) : (
                    /* ── Notification rows ── */
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {notifications.map((n) => {
                        const isUnread = !n.isRead && !n.is_read;
                        const theme = getItemTheme(n.type);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 14,
                              padding: '14px 16px',
                              borderRadius: 16,
                              background: theme.rowBg,
                              cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                          >
                            {/* ── Icon box ── */}
                            <div
                              style={{
                                width: 48, height: 48, minWidth: 48,
                                borderRadius: 13,
                                background: theme.iconBg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {theme.icon}
                            </div>

                            {/* ── Text ── */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* Title row */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    lineHeight: '1.35',
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {n.title}
                                </span>
                                {/* Time + unread dot */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 1 }}>
                                  <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {getRelativeTime(n.createdAt || n.created_at)}
                                  </span>
                                  {isUnread && (
                                    <span
                                      style={{
                                        width: 9, height: 9,
                                        borderRadius: '50%',
                                        background: '#2563EB',
                                        display: 'inline-block',
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              <p
                                style={{
                                  fontSize: 13,
                                  color: '#64748B',
                                  lineHeight: '1.5',
                                  marginTop: 3,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {n.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── FOOTER (fixed) ── */}
                <div
                  style={{
                    flexShrink: 0,
                    borderTop: '1px solid #F0F4FA',
                    background: '#FFFFFF',
                  }}
                >
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '18px 24px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1A73E8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0F7FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <AlignJustify size={16} style={{ color: '#1A73E8' }} />
                    <span>View All Notifications</span>
                    <ChevronRight size={16} style={{ color: '#1A73E8' }} />
                  </button>
                </div>

              </div>
              {/* end card */}
            </>
          )}
          {/* end showNotifications */}
        </div>
        {/* end notification bell wrapper */}

        {/* User Info */}
        <div
          onClick={handleProfileClick}
          style={{ cursor: 'pointer' }}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {((authData.name || localStorage.getItem('userName')) || 'User').split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{(authData.name || localStorage.getItem('userName')) || 'User'}</p>
            <p className="text-xs font-medium text-slate-500">
              {authData.user?.emp_id || authData.user?.employeeCode || (authData.user?.employee_id ? `EMP${String(authData.user.employee_id).padStart(4, '0')}` : '')}
              {(authData.user?.emp_id || authData.user?.employeeCode || authData.user?.employee_id) ? ' • ' : ''}
              {authData.user?.designation || (userRole ? userRole.replace(/_/g, ' ') : (authData.role ? authData.role.replace(/_/g, ' ') : 'User'))}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
