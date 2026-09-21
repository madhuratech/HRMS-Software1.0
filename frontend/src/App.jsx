import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { PermissionProvider } from './context/PermissionContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PermissionGuard } from './components/auth/PermissionGuard';
import { AdminManagerRegister } from './components/auth/AdminManagerRegister';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import SalaryStructure from './components/payroll/SalaryStructure';
import SalaryComponents from './components/payroll/SalaryComponents';
import PayrollProcessing from './components/payroll/PayrollProcessing';
import GeneratePayslips from './components/payroll/GeneratePayslips';
import BonusIncentives from './components/payroll/BonusIncentives';
import Reimbursements from './components/payroll/Reimbursements';
import LoansAdvances from './components/payroll/LoansAdvances';
import TaxManagement from './components/payroll/TaxManagement';
import PayrollReports from './components/payroll/PayrollReports';
import { NewsFeed } from './components/communication/NewsFeed';
import { EmployeeReports } from './components/reports/EmployeeReports';
import { ReportsDirectory } from './components/reports/ReportsDirectory';
import { AttendanceReports as AttendanceReportsModule } from './components/reports/AttendanceReports';
import { LeaveReports } from './components/reports/LeaveReports';
import { PayrollReports as PayrollReportsModule } from './components/reports/PayrollReports';
import { RecruitmentReports as RecruitmentReportsModule } from './components/reports/RecruitmentReports';
import { PerformanceReports } from './components/reports/PerformanceReports';
import { ProjectReports } from './components/reports/ProjectReports';
import { CompanyProfile } from './components/organization/CompanyProfile';
import { Departments } from './components/organization/Departments';
import { Designations } from './components/organization/Designations';
import { Teams } from './components/organization/Teams';
import { ShiftManagement } from './components/organization/ShiftManagement';
import { HolidayCalendar } from './components/organization/HolidayCalendar';
import { OrganizationChart } from './components/organization/OrganizationChart';
import { UserRoles } from './components/organization/UserRoles';

// Employee Module Imports
import EmployeeDirectory from './components/employee/EmployeeDirectory';
import EmployeeListContent from './components/employee/EmployeeListContent';
import AddEmployeeForm from './components/employee/AddEmployeeForm';
import EmployeeProfileContent from './components/employee/EmployeeProfileContent';
import EmploymentHistory from './components/employee/EmploymentHistory';
import PromotionsContent from './components/employee/PromotionsContent';
import TransfersContent from './components/employee/TransfersContent';
import ExitManagement from './components/employee/ExitManagement';
import EmployeeDocuments from './components/employee/EmployeeDocuments';
import { MyShift } from './components/employee/MyShift';
import { MyPerformance } from './components/employee/MyPerformance';
import { TeamLeaderDashboard } from './components/dashboard/TeamLeaderDashboard';
import { TeamAttendanceModule } from './components/team-leader/TeamAttendanceModule';
import { TeamTasksModule } from './components/team-leader/TeamTasksModule';
import { TeamLeaveModule } from './components/team-leader/TeamLeaveModule';
import { TeamPerformanceModule } from './components/team-leader/TeamPerformanceModule';
import { AppLayout } from './components/layout/AppLayout';

// Attendance Module Imports
import DailyAttendance from './components/attendance/DailyAttendance';
import GPSAttendance from './components/attendance/GPSAttendance';
import Regularization from './components/attendance/Regularization';
import ShiftRoster from './components/attendance/ShiftRoster';
import Overtime from './components/attendance/Overtime';
import LateArrival from './components/attendance/LateArrival';
import AttendanceReports from './components/attendance/AttendanceReports';
import PunchLocations from './components/attendance/PunchLocations';

// Leave Module Imports
import LeaveDashboard from './components/leave/LeaveDashboard';
import LeaveApplications from './components/leave/LeaveApplications';
import LeaveApproval from './components/leave/LeaveApproval';
import LeaveBalance from './components/leave/LeaveBalance';
import LeaveTypes from './components/leave/LeaveTypes';
import HolidayList from './components/leave/HolidayList';
import CompOff from './components/leave/CompOff';

// Recruitment Module Imports
import RecruitmentDashboard from './components/recruitment/RecruitmentDashboard';
import JobOpenings from './components/recruitment/JobOpenings';
import Candidates from './components/recruitment/Candidates';
import CandidateScreening from './components/recruitment/CandidateScreening';
import InterviewSchedule from './components/recruitment/InterviewSchedule';
import OfferLetters from './components/recruitment/OfferLetters';
import HiringPipeline from './components/recruitment/HiringPipeline';
import RecruitmentReports from './components/recruitment/RecruitmentReports';
import PublicCareerPage from './components/public/PublicCareerPage';
import PublicJobDetails from './components/public/PublicJobDetails';

// Onboarding Module Imports
import NewJoiners from './components/onboarding/NewJoiners';
import DocumentVerification from './components/onboarding/DocumentVerification';
import AssetAllocation from './components/onboarding/AssetAllocation';
import WelcomeKit from './components/onboarding/WelcomeKit';
import Orientation from './components/onboarding/Orientation';
import Probation from './components/onboarding/Probation';

// Performance Module Imports
import Goals from './components/performance/Goals';
import KPIs from './components/performance/KPIs';
import KRAs from './components/performance/KRAs';
import Appraisals from './components/performance/Appraisals';
import Reviews from './components/performance/Reviews';
import Feedback from './components/performance/Feedback';
import Promotions from './components/performance/Promotions';

// Project Module Imports
import ProjectDashboard from './components/projects/ProjectDashboard';
import ProjectsList from './components/projects/ProjectsList';
import Tasks from './components/projects/Tasks';
import SprintBoard from './components/projects/SprintBoard';
import Timesheets from './components/projects/Timesheets';
import Milestones from './components/projects/Milestones';
import TeamMembers from './components/projects/TeamMembers';

// Client Management Module Imports
import AllClients from './components/clients/AllClients';
import AddClient from './components/clients/AddClient';
import ClientDetails from './components/clients/ClientDetails';

// Expenses Module Imports
import ExpenseClaims from './components/expenses/ExpenseClaims';
import ExpenseCategories from './components/expenses/ExpenseCategories';
import ExpenseApproval from './components/expenses/ExpenseApproval';
import ReimbursementsModule from './components/expenses/Reimbursements';
import ExpenseReports from './components/expenses/ExpenseReports';

// Documents Module Imports
import EmployeeDocumentsModule from './components/documents/EmployeeDocuments';
import CompanyDocuments from './components/documents/CompanyDocuments';
import HRPolicies from './components/documents/HRPolicies';
import Templates from './components/documents/Templates';
import DigitalSignatures from './components/documents/DigitalSignatures';

// Help Desk Module Imports
import HelpDeskDashboard from './components/helpdesk/HelpDeskDashboard';
import Tickets from './components/helpdesk/Tickets';
import Categories from './components/helpdesk/Categories';
import Priorities from './components/helpdesk/Priorities';
import KnowledgeBase from './components/helpdesk/KnowledgeBase';
import HelpDeskReports from './components/helpdesk/HelpDeskReports';

// Settings Module Imports
import SettingsCompany from './components/settings/SettingsCompany';
import SettingsBranding from './components/settings/SettingsBranding';
import SettingsOrganization from './components/settings/SettingsOrganization';
import SettingsUsers from './components/settings/SettingsUsers';
import SettingsHR from './components/settings/SettingsHR';
import SettingsCommunication from './components/settings/SettingsCommunication';
import SettingsIntegrations from './components/settings/SettingsIntegrations';
import SettingsSecurity from './components/settings/SettingsSecurity';
import SettingsSystem from './components/settings/SettingsSystem';
import { AIAssistantDashboard } from './components/ai-assistant/AIAssistantDashboard';

import { CustomCursor } from './components/ui/CustomCursor';
import { Agentation } from 'agentation';

function App() {
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userRole, setUserRole] = useState('SUPER_ADMIN');
  const [userName, setUserName] = useState('');

  // On mount: restore auth state from localStorage and validate with backend /auth/me
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('hrms_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData && authData.loggedIn && authData.token) {
            try {
              const res = await apiFetch('/auth/me');
              if (res && res.success && res.user) {
                const refreshedUser = res.user;
                const refreshedRole = res.role || refreshedUser.role;
                const refreshedName = refreshedUser.name;
                setUserRole(refreshedRole);
                setUserName(refreshedName);
                setIsLoggedIn(true);
                localStorage.setItem('userRole', refreshedRole);
                localStorage.setItem('userName', refreshedName);
                localStorage.setItem('hrms_auth', JSON.stringify({
                  role: refreshedRole,
                  name: refreshedName,
                  loggedIn: true,
                  token: authData.token,
                  user: refreshedUser
                }));
                if (res.permissions) {
                  localStorage.setItem('hrms_permissions', JSON.stringify(res.permissions));
                  window.dispatchEvent(new CustomEvent('permissionsUpdated', { detail: { roleKey: refreshedRole, permissions: res.permissions } }));
                }
                setIsInitializing(false);
                return;
              }
            } catch (apiErr) {
              console.warn('Could not validate session via /auth/me:', apiErr);
            }

            const role = authData.role || authData.user?.role || 'EMPLOYEE';
            const name = authData.name || authData.user?.name || '';
            setUserRole(role);
            setUserName(name);
            setIsLoggedIn(true);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', name);
          }
        }
      } catch (err) {
        localStorage.removeItem('hrms_auth');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = (role, name, userObj) => {
    const finalRole = role || (userObj && userObj.role) || 'EMPLOYEE';
    const finalName = name || (userObj && userObj.name) || '';
    const finalId = (userObj && (userObj.userId || userObj.id)) || 1;
    const finalEmpId = (userObj && (userObj.employeeId || userObj.employee_id)) || finalId;
    const finalEmpCode = (userObj && (userObj.employeeCode || userObj.employee_code || userObj.emp_id)) || `EMP${String(finalEmpId).padStart(4, '0')}`;
    const finalEmail = (userObj && userObj.email) || '';
    const finalToken = (userObj && userObj.token) || 'mock_jwt_token';

    setUserRole(finalRole);
    setUserName(finalName);
    setIsLoggedIn(true);
    localStorage.setItem('userRole', finalRole);
    localStorage.setItem('userName', finalName);

    const authObj = {
      role: finalRole,
      name: finalName,
      loggedIn: true,
      token: finalToken,
      user: {
        id: finalId,
        userId: finalId,
        employee_id: finalEmpId,
        employeeId: finalEmpId,
        emp_id: finalEmpCode,
        employeeCode: finalEmpCode,
        name: finalName,
        email: finalEmail,
        role: finalRole
      }
    };
    localStorage.setItem('hrms_auth', JSON.stringify(authObj));

    const incomingPerms = (userObj && (userObj.permissions || userObj.userPermissions)) || null;
    if (incomingPerms) {
      localStorage.setItem('hrms_permissions', JSON.stringify(incomingPerms));
    } else {
      localStorage.removeItem('hrms_permissions');
    }

    // Reset browser route to root/dashboard for the new user session
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('permissionsUpdated', { detail: { roleKey: finalRole, permissions: incomingPerms } }));
  };

  const handleQuickDemoLogin = (role = 'SUPER_ADMIN', name = 'Madhura Admin') => {
    const emailPreset = role === 'SUPER_ADMIN'
      ? 'madhuratechcbe@gmail.com'
      : role === 'TEAM_LEADER'
      ? 'muthu@gmail.com'
      : 'dhilipanmadhuratech@gmail.com';
    
    const userObj = {
      id: role === 'SUPER_ADMIN' ? 1 : (role === 'TEAM_LEADER' ? 3 : 2),
      name: name,
      email: emailPreset,
      role: role,
      token: 'mock_demo_jwt_token',
      employeeId: role === 'SUPER_ADMIN' ? 1 : (role === 'TEAM_LEADER' ? 3 : 2),
      employeeCode: role === 'SUPER_ADMIN' ? 'EMP0001' : (role === 'TEAM_LEADER' ? 'EMP0003' : 'EMP0002')
    };
    handleLogin(role, name, userObj);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('SUPER_ADMIN');
    setUserName('');
    setAuthView('login');

    // Clear all persisted user-specific auth, role, and permission storage
    localStorage.removeItem('hrms_auth');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('hrms_permissions');
    localStorage.removeItem('selectedEmployeeId');
    localStorage.removeItem('activeModule');
    localStorage.removeItem('selectedMenu');
    localStorage.removeItem('expandedMenus');

    // Reset URL history to root so no protected routes leak to next user
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('permissionsUpdated', { detail: null }));
  };

  // Show a full-screen loading spinner while restoring auth state
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        gap: 20,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.15)',
          borderTopColor: '#3b82f6',
          animation: 'spin 0.85s linear infinite',
        }} />
        <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500, letterSpacing: '0.02em' }}>
          Loading HRMS…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Check if public career page is requested directly
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/career')) {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/career" element={<PublicCareerPage />} />
            <Route path="/career/job/:slug" element={<PublicJobDetails />} />
            <Route path="*" element={<Navigate to="/career" replace />} />
          </Routes>
        </BrowserRouter>
      );
    }

    if (authView === 'register' || (typeof window !== 'undefined' && window.location.pathname.includes('verify-email'))) {
      return (
        <Register
          onRegister={handleLogin}
          onLoginClick={() => setAuthView('login')}
        />
      );
    }

    // Default opening view: Direct Login Page
    return (
      <Login
        onLogin={handleLogin}
        onRegisterClick={() => setAuthView('register')}
      />
    );
  }

  // A helper component to bridge the old currentView state with React Router
  const LegacyViewManager = () => {
    const location = useLocation();
    const currentView = location.pathname.substring(1) || 'dashboard'; // remove leading slash

    switch (currentView) {
      case 'dashboard':
        if (userRole === 'EMPLOYEE') {
          return <EmployeeDashboard />;
        }
        if (userRole === 'TEAM_LEADER') {
          return <TeamLeaderDashboard />;
        }
        return <SuperAdminDashboard />;
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-700">System Settings</h2>
            <p className="text-slate-500 mt-2 max-w-md">Global configuration, role management, and incentive rule settings go here.</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-2xl font-bold text-slate-700">Module Coming Soon</h2>
            <p className="text-slate-500 mt-2">The route {location.pathname} is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <ToastProvider>
      <PermissionProvider>
        <CustomCursor />
        {process.env.NODE_ENV === 'development' && <Agentation />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/landing" element={<Navigate to="/dashboard" replace />} />
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            
            {/* Public Career Website Routes */}
            <Route path="/career" element={<PublicCareerPage />} />
            <Route path="/career/job/:slug" element={<PublicJobDetails />} />

            <Route element={<AppLayout userRole={userRole} onLogout={handleLogout} />}>
              {/* Dashboard Route */}
              <Route path="/dashboard" element={userRole === 'EMPLOYEE' ? <EmployeeDashboard /> : userRole === 'TEAM_LEADER' ? <TeamLeaderDashboard /> : <SuperAdminDashboard />} />

              {/* Dedicated Employee Module Routes */}
              <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/employee/dashboard" element={<PermissionGuard moduleKey="dashboard" submoduleKey="dashboard_overview"><EmployeeDashboard /></PermissionGuard>} />
              <Route path="/employee/profile" element={<Navigate to="/employees/profile" replace />} />
              <Route path="/employee/attendance" element={<PermissionGuard moduleKey="attendance" submoduleKey="daily_attendance"><GPSAttendance /></PermissionGuard>} />
              <Route path="/employee/shift" element={<PermissionGuard moduleKey="attendance" submoduleKey="shift_roster"><MyShift /></PermissionGuard>} />
              <Route path="/employee/leave" element={<PermissionGuard moduleKey="leave" submoduleKey="my_leave"><LeaveApplications /></PermissionGuard>} />
              <Route path="/employee/leave-balance" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_balance"><LeaveBalance /></PermissionGuard>} />
              <Route path="/employee/leave-requests" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_approval"><LeaveApplications activeTab="approval" /></PermissionGuard>} />
              <Route path="/employee/leave-types" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_types"><LeaveTypes /></PermissionGuard>} />
              <Route path="/employee/holidays" element={<PermissionGuard moduleKey="leave" submoduleKey="holiday_list"><HolidayList /></PermissionGuard>} />
              <Route path="/employee/payroll" element={<Navigate to="/payroll/payslips" replace />} />
              <Route path="/employee/tasks" element={<PermissionGuard moduleKey="projects" submoduleKey="tasks"><Tasks /></PermissionGuard>} />
              <Route path="/employee/performance" element={<PermissionGuard moduleKey="performance" submoduleKey="reviews"><MyPerformance /></PermissionGuard>} />
              <Route path="/employee/documents" element={<PermissionGuard moduleKey="documents" submoduleKey="doc_employee"><EmployeeDocuments /></PermissionGuard>} />
              <Route path="/employee/announcements" element={<PermissionGuard moduleKey="organization" submoduleKey="company_profile"><NewsFeed /></PermissionGuard>} />
              <Route path="/employee/help" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="tickets"><Tickets /></PermissionGuard>} />

              {/* Dedicated Team Leader Routes */}
              <Route path="/team-leader" element={<Navigate to="/team-leader/dashboard" replace />} />
              <Route path="/team-leader/dashboard" element={<PermissionGuard moduleKey="dashboard" submoduleKey="dashboard_overview"><TeamLeaderDashboard /></PermissionGuard>} />
              <Route path="/team-leader/profile" element={<Navigate to="/employees/profile" replace />} />
              <Route path="/team-leader/my-attendance" element={<PermissionGuard moduleKey="attendance" submoduleKey="gps_attendance"><GPSAttendance /></PermissionGuard>} />
              <Route path="/team-leader/my-shift" element={<PermissionGuard moduleKey="attendance" submoduleKey="shift_roster"><MyShift /></PermissionGuard>} />
              <Route path="/team-leader/team-attendance" element={<PermissionGuard moduleKey="attendance" submoduleKey="daily_attendance"><TeamAttendanceModule /></PermissionGuard>} />
              <Route path="/team-leader/projects" element={<PermissionGuard moduleKey="projects" submoduleKey="projects_list"><ProjectsList /></PermissionGuard>} />
              <Route path="/team-leader/team-tasks" element={<PermissionGuard moduleKey="projects" submoduleKey="tasks"><TeamTasksModule /></PermissionGuard>} />
              <Route path="/team-leader/team-performance" element={<PermissionGuard moduleKey="performance" submoduleKey="reviews"><TeamPerformanceModule /></PermissionGuard>} />
              <Route path="/team-leader/my-leave" element={<PermissionGuard moduleKey="leave" submoduleKey="my_leave"><LeaveApplications /></PermissionGuard>} />
              <Route path="/team-leader/team-leave" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_approval"><TeamLeaveModule /></PermissionGuard>} />
              <Route path="/team-leader/holidays" element={<PermissionGuard moduleKey="leave" submoduleKey="holiday_list"><HolidayList /></PermissionGuard>} />
              <Route path="/team-leader/leave-types" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_types"><LeaveTypes /></PermissionGuard>} />
              <Route path="/team-leader/my-payroll" element={<Navigate to="/payroll/payslips" replace />} />
              <Route path="/team-leader/help" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="tickets"><Tickets /></PermissionGuard>} />

            {/* AI Assistant Route */}
            <Route path="/ai-assistant" element={<PermissionGuard moduleKey="ai_assistant"><AIAssistantDashboard /></PermissionGuard>} />

            {/* Notifications Center Route */}
            <Route path="/notifications" element={<NotificationsPage userRole={userRole} />} />

            {/* Employee Routes - explicitly rendering their own components */}
            <Route path="/employees/dashboard" element={<Navigate to="/employees" replace />} />
            <Route path="/employees" element={<PermissionGuard moduleKey="employees" submoduleKey="employee_directory"><EmployeeDirectory /></PermissionGuard>} />
            <Route path="/employees/list" element={<PermissionGuard moduleKey="employees" submoduleKey="employee_list"><EmployeeListContent /></PermissionGuard>} />
            <Route path="/employees/add" element={<PermissionGuard moduleKey="employees" submoduleKey="add_employee" action="create"><AddEmployeeForm /></PermissionGuard>} />
            <Route path="/employees/profile" element={<PermissionGuard moduleKey="employees" submoduleKey="employee_profile"><EmployeeProfileContent /></PermissionGuard>} />
            <Route path="/employees/history" element={<PermissionGuard moduleKey="employees" submoduleKey="employment_history"><EmploymentHistory /></PermissionGuard>} />
            <Route path="/employees/promotions" element={<PermissionGuard moduleKey="employees" submoduleKey="promotions"><PromotionsContent /></PermissionGuard>} />
            <Route path="/employees/transfers" element={<PermissionGuard moduleKey="employees" submoduleKey="transfers"><TransfersContent /></PermissionGuard>} />
            <Route path="/employees/exit" element={<PermissionGuard moduleKey="employees" submoduleKey="exit_management"><ExitManagement /></PermissionGuard>} />
            <Route path="/employees/documents" element={<PermissionGuard moduleKey="employees" submoduleKey="employee_documents"><EmployeeDocuments /></PermissionGuard>} />
            <Route path="/employees/reports" element={<Navigate to="/reports/employees" replace />} />

            {/* Attendance Routes */}
            <Route path="/attendance/daily" element={<PermissionGuard moduleKey="attendance" submoduleKey="daily_attendance"><DailyAttendance /></PermissionGuard>} />
            <Route path="/attendance/gps" element={<PermissionGuard moduleKey="attendance" submoduleKey="gps_attendance"><GPSAttendance /></PermissionGuard>} />
            <Route path="/attendance/gps-punch" element={<PermissionGuard moduleKey="attendance" submoduleKey="gps_attendance"><GPSAttendance /></PermissionGuard>} />
            <Route path="/attendance/punch" element={<PermissionGuard moduleKey="attendance" submoduleKey="gps_attendance"><GPSAttendance /></PermissionGuard>} />
            <Route path="/attendance/regularization" element={<PermissionGuard moduleKey="attendance" submoduleKey="regularization"><Regularization /></PermissionGuard>} />
            <Route path="/attendance/shift-roster" element={<PermissionGuard moduleKey="attendance" submoduleKey="shift_roster"><ShiftRoster /></PermissionGuard>} />
            <Route path="/attendance/overtime" element={<PermissionGuard moduleKey="attendance" submoduleKey="overtime"><Overtime /></PermissionGuard>} />
            <Route path="/attendance/late-arrival" element={<PermissionGuard moduleKey="attendance" submoduleKey="late_arrival"><LateArrival /></PermissionGuard>} />
            <Route path="/attendance/reports" element={<Navigate to="/reports/attendance" replace />} />
            <Route path="/attendance/punch-locations" element={<PermissionGuard moduleKey="attendance" submoduleKey="punch_locations"><PunchLocations /></PermissionGuard>} />

            {/* Leave Module */}
            <Route path="/leave-dashboard" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_dashboard"><LeaveDashboard /></PermissionGuard>} />
            <Route path="/leave-applications" element={<PermissionGuard moduleKey="leave" submoduleKey="my_leave"><LeaveApplications /></PermissionGuard>} />
            <Route path="/leave-approval" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_approval"><LeaveApproval /></PermissionGuard>} />
            <Route path="/leave-balance" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_balance"><LeaveBalance /></PermissionGuard>} />
            <Route path="/leave-types" element={<PermissionGuard moduleKey="leave" submoduleKey="leave_types"><LeaveTypes /></PermissionGuard>} />
            <Route path="/leave/reports" element={<Navigate to="/reports/leave" replace />} />
            <Route path="/holiday-list" element={<PermissionGuard moduleKey="leave" submoduleKey="holiday_list"><HolidayList /></PermissionGuard>} />
            <Route path="/comp-off" element={<PermissionGuard moduleKey="leave" submoduleKey="comp_off"><CompOff /></PermissionGuard>} />

            {/* Organization Module */}
            <Route path="/company-profile" element={<PermissionGuard moduleKey="organization" submoduleKey="company_profile"><CompanyProfile /></PermissionGuard>} />
            <Route path="/departments" element={<PermissionGuard moduleKey="organization" submoduleKey="departments"><Departments /></PermissionGuard>} />
            <Route path="/designations" element={<PermissionGuard moduleKey="organization" submoduleKey="designations"><Designations /></PermissionGuard>} />
            <Route path="/teams" element={<PermissionGuard moduleKey="organization" submoduleKey="teams"><Teams /></PermissionGuard>} />
            <Route path="/shift-management" element={<PermissionGuard moduleKey="organization" submoduleKey="shift_management"><ShiftManagement /></PermissionGuard>} />
            <Route path="/holiday-calendar" element={<PermissionGuard moduleKey="organization" submoduleKey="holiday_calendar"><HolidayCalendar /></PermissionGuard>} />
            <Route path="/organization-chart" element={<PermissionGuard moduleKey="organization" submoduleKey="organization_chart"><OrganizationChart /></PermissionGuard>} />
            <Route path="/user-roles" element={<PermissionGuard moduleKey="settings" submoduleKey="user_roles"><UserRoles /></PermissionGuard>} />

            {/* Other Existing Modules */}
            <Route path="/news" element={<NewsFeed />} />
            {/* Global Centralized Reports Module */}
            <Route path="/reports" element={<ReportsDirectory />} />
            <Route path="/reports/employees" element={<EmployeeReports />} />
            <Route path="/reports/employee" element={<EmployeeReports />} />
            <Route path="/reports/attendance" element={<AttendanceReportsModule />} />
            <Route path="/reports/leave" element={<LeaveReports />} />
            <Route path="/reports/payroll" element={<PayrollReportsModule />} />
            <Route path="/reports/recruitment" element={<RecruitmentReportsModule />} />
            <Route path="/reports/performance" element={<PerformanceReports />} />
            <Route path="/reports/projects" element={<ProjectReports />} />
            <Route path="/reports/project" element={<ProjectReports />} />

            {/* Payroll Module */}
            <Route path="/payroll" element={<Navigate to="/payroll/salary-structure" replace />} />
            <Route path="/payroll/salary-structure" element={<PermissionGuard moduleKey="payroll" submoduleKey="salary_structure"><SalaryStructure /></PermissionGuard>} />
            <Route path="/payroll/components" element={<PermissionGuard moduleKey="payroll" submoduleKey="salary_components"><SalaryComponents /></PermissionGuard>} />
            <Route path="/payroll/processing" element={<PermissionGuard moduleKey="payroll" submoduleKey="payroll_processing"><PayrollProcessing /></PermissionGuard>} />
            <Route path="/payroll/payslips" element={<PermissionGuard moduleKey="payroll" submoduleKey="generate_payslips"><GeneratePayslips /></PermissionGuard>} />
            <Route path="/payroll/bonus" element={<PermissionGuard moduleKey="payroll" submoduleKey="bonus_incentives"><BonusIncentives /></PermissionGuard>} />
            <Route path="/payroll/reimbursements" element={<PermissionGuard moduleKey="payroll" submoduleKey="reimbursements"><Reimbursements /></PermissionGuard>} />
            <Route path="/payroll/loans" element={<PermissionGuard moduleKey="payroll" submoduleKey="loans_advances"><LoansAdvances /></PermissionGuard>} />
            <Route path="/payroll/tax" element={<PermissionGuard moduleKey="payroll" submoduleKey="tax_management"><TaxManagement /></PermissionGuard>} />
            <Route path="/payroll/reports" element={<Navigate to="/reports/payroll" replace />} />

            {/* Recruitment Module */}
            <Route path="/recruitment" element={<Navigate to="/recruitment/dashboard" replace />} />
            <Route path="/recruitment/dashboard" element={<PermissionGuard moduleKey="recruitment" submoduleKey="recruitment_dashboard"><RecruitmentDashboard /></PermissionGuard>} />
            <Route path="/recruitment/jobs" element={<PermissionGuard moduleKey="recruitment" submoduleKey="job_openings"><JobOpenings /></PermissionGuard>} />
            <Route path="/recruitment/candidates" element={<PermissionGuard moduleKey="recruitment" submoduleKey="candidates"><Candidates /></PermissionGuard>} />
            <Route path="/recruitment/screening" element={<PermissionGuard moduleKey="recruitment" submoduleKey="screening"><CandidateScreening /></PermissionGuard>} />
            <Route path="/recruitment/interviews" element={<PermissionGuard moduleKey="recruitment" submoduleKey="interview_schedule"><InterviewSchedule /></PermissionGuard>} />
            <Route path="/recruitment/offers" element={<PermissionGuard moduleKey="recruitment" submoduleKey="offer_letters"><OfferLetters /></PermissionGuard>} />
            <Route path="/recruitment/pipeline" element={<PermissionGuard moduleKey="recruitment" submoduleKey="hiring_pipeline"><HiringPipeline /></PermissionGuard>} />
            <Route path="/recruitment/reports" element={<Navigate to="/reports/recruitment" replace />} />

            {/* Onboarding Module */}
            <Route path="/onboarding" element={<Navigate to="/onboarding/new-joiners" replace />} />
            <Route path="/onboarding/new-joiners" element={<PermissionGuard moduleKey="onboarding" submoduleKey="new_joiners"><NewJoiners /></PermissionGuard>} />
            <Route path="/onboarding/documents" element={<PermissionGuard moduleKey="onboarding" submoduleKey="document_verification"><DocumentVerification /></PermissionGuard>} />
            <Route path="/onboarding/assets" element={<PermissionGuard moduleKey="onboarding" submoduleKey="asset_allocation"><AssetAllocation /></PermissionGuard>} />
            <Route path="/onboarding/welcome-kit" element={<PermissionGuard moduleKey="onboarding" submoduleKey="welcome_kit"><WelcomeKit /></PermissionGuard>} />
            <Route path="/onboarding/orientation" element={<PermissionGuard moduleKey="onboarding" submoduleKey="orientation"><Orientation /></PermissionGuard>} />
            <Route path="/onboarding/probation" element={<PermissionGuard moduleKey="onboarding" submoduleKey="probation"><Probation /></PermissionGuard>} />

            {/* Performance Module */}
            <Route path="/performance" element={<Navigate to="/performance/goals" replace />} />
            <Route path="/performance/goals" element={<PermissionGuard moduleKey="performance" submoduleKey="goals"><Goals /></PermissionGuard>} />
            <Route path="/performance/kpis" element={<PermissionGuard moduleKey="performance" submoduleKey="kpis"><KPIs /></PermissionGuard>} />
            <Route path="/performance/kras" element={<PermissionGuard moduleKey="performance" submoduleKey="kras"><KRAs /></PermissionGuard>} />
            <Route path="/performance/appraisals" element={<PermissionGuard moduleKey="performance" submoduleKey="appraisals"><Appraisals /></PermissionGuard>} />
            <Route path="/performance/reviews" element={<PermissionGuard moduleKey="performance" submoduleKey="reviews"><Reviews /></PermissionGuard>} />
            <Route path="/performance/feedback" element={<PermissionGuard moduleKey="performance" submoduleKey="feedback"><Feedback /></PermissionGuard>} />
            <Route path="/performance/promotions" element={<PermissionGuard moduleKey="performance" submoduleKey="performance_promotions"><Promotions /></PermissionGuard>} />
            <Route path="/performance/reports" element={<Navigate to="/reports/performance" replace />} />

            {/* Project Management Module */}
            <Route path="/projects" element={<Navigate to="/projects/dashboard" replace />} />
            <Route path="/projects/dashboard" element={<PermissionGuard moduleKey="projects" submoduleKey="project_dashboard"><ProjectDashboard /></PermissionGuard>} />
            <Route path="/projects/list" element={<PermissionGuard moduleKey="projects" submoduleKey="projects_list"><ProjectsList /></PermissionGuard>} />
            <Route path="/projects/tasks" element={<PermissionGuard moduleKey="projects" submoduleKey="tasks"><Tasks /></PermissionGuard>} />
            <Route path="/projects/sprint-board" element={<PermissionGuard moduleKey="projects" submoduleKey="sprint_board"><SprintBoard /></PermissionGuard>} />
            <Route path="/projects/timesheets" element={<PermissionGuard moduleKey="projects" submoduleKey="timesheets"><Timesheets /></PermissionGuard>} />
            <Route path="/projects/milestones" element={<PermissionGuard moduleKey="projects" submoduleKey="milestones"><Milestones /></PermissionGuard>} />
            <Route path="/projects/team" element={<PermissionGuard moduleKey="projects" submoduleKey="team_members"><TeamMembers /></PermissionGuard>} />
            <Route path="/projects/reports" element={<Navigate to="/reports/projects" replace />} />

            {/* Client Management Module */}
            <Route path="/clients" element={<Navigate to="/clients/list" replace />} />
            <Route path="/clients/list" element={<PermissionGuard moduleKey="clients" submoduleKey="client_management" action="view"><AllClients /></PermissionGuard>} />
            <Route path="/clients/add" element={<PermissionGuard moduleKey="clients" submoduleKey="client_management" action="create"><AddClient /></PermissionGuard>} />
            <Route path="/clients/:id" element={<PermissionGuard moduleKey="clients" submoduleKey="client_management" action="view"><ClientDetails /></PermissionGuard>} />
            <Route path="/clients/:id/edit" element={<PermissionGuard moduleKey="clients" submoduleKey="client_management" action="edit"><AddClient isEdit={true} /></PermissionGuard>} />
            <Route path="/clients/projects" element={<Navigate to="/clients/list" replace />} />

            {/* Expenses Module */}
            <Route path="/expenses" element={<Navigate to="/expenses/claims" replace />} />
            <Route path="/expenses/claims" element={<PermissionGuard moduleKey="expenses" submoduleKey="expense_claims"><ExpenseClaims /></PermissionGuard>} />
            <Route path="/expenses/categories" element={<PermissionGuard moduleKey="expenses" submoduleKey="expense_categories"><ExpenseCategories /></PermissionGuard>} />
            <Route path="/expenses/approval" element={<PermissionGuard moduleKey="expenses" submoduleKey="expense_approval"><ExpenseApproval /></PermissionGuard>} />
            <Route path="/expenses/reimbursements" element={<PermissionGuard moduleKey="expenses" submoduleKey="expense_reimbursements"><ReimbursementsModule /></PermissionGuard>} />
            <Route path="/expenses/reports" element={<Navigate to="/reports/expenses" replace />} />

            {/* Documents Module */}
            <Route path="/documents" element={<Navigate to="/documents/employee" replace />} />
            <Route path="/documents/employee" element={<PermissionGuard moduleKey="documents" submoduleKey="doc_employee"><EmployeeDocumentsModule /></PermissionGuard>} />
            <Route path="/documents/company" element={<PermissionGuard moduleKey="documents" submoduleKey="doc_company"><CompanyDocuments /></PermissionGuard>} />
            <Route path="/documents/policies" element={<PermissionGuard moduleKey="documents" submoduleKey="doc_policies"><HRPolicies /></PermissionGuard>} />
            <Route path="/documents/templates" element={<PermissionGuard moduleKey="documents" submoduleKey="doc_templates"><Templates /></PermissionGuard>} />
            <Route path="/documents/signatures" element={<PermissionGuard moduleKey="documents" submoduleKey="digital_signatures"><DigitalSignatures /></PermissionGuard>} />

            {/* Help Desk Module */}
            <Route path="/help-desk" element={<Navigate to="/help-desk/dashboard" replace />} />
            <Route path="/help-desk/dashboard" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="helpdesk_dashboard"><HelpDeskDashboard /></PermissionGuard>} />
            <Route path="/help-desk/tickets" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="tickets"><Tickets /></PermissionGuard>} />
            <Route path="/help-desk/categories" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="helpdesk_categories"><Categories /></PermissionGuard>} />
            <Route path="/help-desk/priorities" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="helpdesk_priorities"><Priorities /></PermissionGuard>} />
            <Route path="/help-desk/knowledge-base" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="knowledge_base"><KnowledgeBase /></PermissionGuard>} />
            <Route path="/help-desk/reports" element={<PermissionGuard moduleKey="helpdesk" submoduleKey="helpdesk_reports"><HelpDeskReports /></PermissionGuard>} />

            {/* Settings Module */}
            <Route path="/settings" element={<Navigate to="/settings/company" replace />} />
            <Route path="/settings/company" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_company"><SettingsCompany /></PermissionGuard>} />
            <Route path="/settings/branding" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_branding"><SettingsBranding /></PermissionGuard>} />
            <Route path="/settings/organization" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_organization"><SettingsOrganization /></PermissionGuard>} />
            <Route path="/settings/users" element={<PermissionGuard moduleKey="settings" submoduleKey="user_roles"><UserRoles /></PermissionGuard>} />
            <Route path="/settings/hr" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_hr"><SettingsHR /></PermissionGuard>} />
            <Route path="/settings/communication" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_communication"><SettingsCommunication /></PermissionGuard>} />
            <Route path="/settings/integrations" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_integrations"><SettingsIntegrations /></PermissionGuard>} />
            <Route path="/settings/security" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_security"><SettingsSecurity /></PermissionGuard>} />
            <Route path="/settings/system" element={<PermissionGuard moduleKey="settings" submoduleKey="settings_system"><SettingsSystem /></PermissionGuard>} />
            <Route path="/admin-register" element={<PermissionGuard moduleKey="settings" submoduleKey="user_roles"><AdminManagerRegister /></PermissionGuard>} />

            {/* Fallback for all other routes */}
            <Route path="*" element={<LegacyViewManager />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </PermissionProvider>
    </ToastProvider>
  );

}

export default App;