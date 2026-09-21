import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDropdown from '../ui/AppDropdown';
import { Shield, Plus, Save, Trash2, Lock, Users, RefreshCw, Layers, ShieldCheck, UserCheck, Users2, User, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { AdminManagerRegister } from '../auth/AdminManagerRegister';

export function UserRoles() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdminRegisterModal, setShowAdminRegisterModal] = useState(false);

  // New Role Form
  const [newRoleData, setNewRoleData] = useState({
    role_name: '',
    description: '',
    template_role: 'EMPLOYEE'
  });
  const [creating, setCreating] = useState(false);

  const getAuthToken = () => {
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.token || 'mock_jwt_token';
      } catch (e) {
        return 'mock_jwt_token';
      }
    }
    return 'mock_jwt_token';
  };

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch('/app/rbac/roles', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRoles(data.data);
        if (!selectedRole && data.data.length > 0) {
          setSelectedRole(data.data[0]);
        }
      } else {
        addToast(data.message || 'Failed to fetch roles', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRole, addToast]);

  const DEFAULT_SUBMODULE_MAP = {
    dashboard: [{ key: 'dashboard_overview', label: 'Dashboard Overview' }],
    organization: [
      { key: 'company_profile', label: 'Company Profile' },
      { key: 'departments', label: 'Departments' },
      { key: 'designations', label: 'Designations' },
      { key: 'teams', label: 'Teams' },
      { key: 'shift_management', label: 'Shift Management' },
      { key: 'holiday_calendar', label: 'Holiday Calendar' },
      { key: 'organization_chart', label: 'Organization Chart' }
    ],
    employees: [
      { key: 'employee_directory', label: 'Employee Directory' },
      { key: 'employee_list', label: 'Employee List' },
      { key: 'add_employee', label: 'Add Employee' },
      { key: 'employee_profile', label: 'Employee Profile' },
      { key: 'employment_history', label: 'Employment History' },
      { key: 'promotions', label: 'Promotions' },
      { key: 'transfers', label: 'Transfers' },
      { key: 'exit_management', label: 'Exit Management' },
      { key: 'employee_documents', label: 'Employee Documents' }
    ],
    attendance: [
      { key: 'daily_attendance', label: 'Daily Attendance' },
      { key: 'gps_attendance', label: 'GPS Attendance Punch' },
      { key: 'regularization', label: 'Regularization' },
      { key: 'shift_roster', label: 'Shift Roster' },
      { key: 'overtime', label: 'Overtime' },
      { key: 'late_arrival', label: 'Late Arrival' },
      { key: 'punch_locations', label: 'Punch Locations' }
    ],
    leave: [
      { key: 'leave_dashboard', label: 'Leave Dashboard' },
      { key: 'leave_balance', label: 'Leave Balance' },
      { key: 'my_leave', label: 'My Leave' },
      { key: 'leave_approval', label: 'Leave Requests / Approval' },
      { key: 'leave_types', label: 'Leave Types' },
      { key: 'holiday_list', label: 'Holiday List' },
      { key: 'comp_off', label: 'Comp Off' }
    ],
    payroll: [
      { key: 'salary_structure', label: 'Salary Structure' },
      { key: 'salary_components', label: 'Salary Components' },
      { key: 'payroll_processing', label: 'Payroll Processing' },
      { key: 'generate_payslips', label: 'Generate Payslips' },
      { key: 'bonus_incentives', label: 'Bonus & Incentives' },
      { key: 'reimbursements', label: 'Reimbursements' },
      { key: 'loans_advances', label: 'Loans & Advances' },
      { key: 'tax_management', label: 'Tax Management' }
    ],
    recruitment: [
      { key: 'recruitment_dashboard', label: 'Recruitment Dashboard' },
      { key: 'job_openings', label: 'Job Openings' },
      { key: 'candidates', label: 'Candidates' },
      { key: 'interview_schedule', label: 'Interview Schedule' },
      { key: 'offer_letters', label: 'Offer Letters' },
      { key: 'hiring_pipeline', label: 'Hiring Pipeline' }
    ],
    onboarding: [
      { key: 'new_joiners', label: 'New Joiners' },
      { key: 'document_verification', label: 'Document Verification' },
      { key: 'asset_allocation', label: 'Asset Allocation' },
      { key: 'welcome_kit', label: 'Welcome Kit' },
      { key: 'orientation', label: 'Orientation' },
      { key: 'probation', label: 'Probation' }
    ],
    performance: [
      { key: 'goals', label: 'Goals' },
      { key: 'kpis', label: 'KPIs' },
      { key: 'kras', label: 'KRAs' },
      { key: 'appraisals', label: 'Appraisals' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'feedback', label: 'Feedback' },
      { key: 'performance_promotions', label: 'Promotions' }
    ],
    projects: [
      { key: 'project_dashboard', label: 'Project Dashboard' },
      { key: 'projects_list', label: 'Projects' },
      { key: 'tasks', label: 'Tasks' },
      { key: 'sprint_board', label: 'Sprint Board' },
      { key: 'timesheets', label: 'Timesheets' },
      { key: 'milestones', label: 'Milestones' },
      { key: 'team_members', label: 'Team Members' }
    ],
    projects_tasks: [
      { key: 'project_dashboard', label: 'Project Dashboard' },
      { key: 'projects_list', label: 'Projects' },
      { key: 'tasks', label: 'Tasks' },
      { key: 'sprint_board', label: 'Sprint Board' },
      { key: 'timesheets', label: 'Timesheets' },
      { key: 'milestones', label: 'Milestones' },
      { key: 'team_members', label: 'Team Members' }
    ],
    reports: [
      { key: 'reports_directory', label: 'Reports Directory' },
      { key: 'reports_employee', label: 'Employee Reports' },
      { key: 'reports_attendance', label: 'Attendance Reports' },
      { key: 'reports_leave', label: 'Leave Reports' },
      { key: 'reports_payroll', label: 'Payroll Reports' },
      { key: 'reports_recruitment', label: 'Recruitment Reports' },
      { key: 'reports_performance', label: 'Performance Reports' },
      { key: 'reports_project', label: 'Project Reports' }
    ],
    expenses: [
      { key: 'expense_claims', label: 'Expense Claims' },
      { key: 'expense_categories', label: 'Expense Categories' },
      { key: 'expense_approval', label: 'Expense Approval' },
      { key: 'expense_reimbursements', label: 'Reimbursements' },
      { key: 'expense_reports', label: 'Expense Reports' }
    ],
    documents: [
      { key: 'doc_employee', label: 'Employee Documents' },
      { key: 'doc_company', label: 'Company Documents' },
      { key: 'doc_policies', label: 'HR Policies' },
      { key: 'doc_templates', label: 'Templates' },
      { key: 'doc_signatures', label: 'Digital Signatures' }
    ],
    helpdesk: [
      { key: 'helpdesk_dashboard', label: 'Dashboard' },
      { key: 'tickets', label: 'Tickets' },
      { key: 'helpdesk_categories', label: 'Categories' },
      { key: 'helpdesk_priorities', label: 'Priorities' },
      { key: 'knowledge_base', label: 'Knowledge Base' },
      { key: 'helpdesk_reports', label: 'Reports' }
    ],
    settings: [
      { key: 'settings_company', label: 'Company Information' },
      { key: 'settings_branding', label: 'Branding' },
      { key: 'settings_organization', label: 'Organization' },
      { key: 'user_roles', label: 'User Roles & Permissions' },
      { key: 'settings_hr', label: 'HR Settings' },
      { key: 'settings_communication', label: 'Communication' },
      { key: 'settings_integrations', label: 'Integrations' },
      { key: 'settings_security', label: 'Security' },
      { key: 'settings_system', label: 'System' }
    ],
    ai_assistant: [
      { key: 'ai_dashboard', label: 'AI Assistant Dashboard' }
    ],
    user_roles: [
      { key: 'roles_matrix', label: 'Role Permissions Management' }
    ]
  };

  const fetchRolePermissions = useCallback(async (roleKey) => {
    setLoadingMatrix(true);
    try {
      const res = await fetch(`/app/rbac/permissions/${roleKey}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const enriched = data.data.map(m => {
          let subs = m.submodules;
          if (!subs || subs.length === 0) {
            const defaults = DEFAULT_SUBMODULE_MAP[m.module_key] || [];
            subs = defaults.map(d => ({
              submodule_key: d.key,
              submodule_label: d.label,
              can_view: m.can_view,
              can_create: m.can_create,
              can_edit: m.can_edit,
              can_delete: m.can_delete
            }));
          }
          return {
            ...m,
            submodules: subs
          };
        });
        setPermissionsMatrix(enriched);
      } else {
        addToast(data.message || 'Failed to fetch permissions', 'error');
      }
    } catch (err) {
      addToast('Error loading permission matrix', 'error');
    } finally {
      setLoadingMatrix(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole && selectedRole.role_key) {
      fetchRolePermissions(selectedRole.role_key);
    }
  }, [selectedRole, fetchRolePermissions]);

  const [expandedModules, setExpandedModules] = useState({ leave: true, employees: true, attendance: true });

  const toggleModuleExpand = (moduleKey) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleSubmoduleCheckboxChange = (moduleKey, submoduleKey, field) => {
    if (selectedRole?.role_key === 'SUPER_ADMIN' || selectedRole?.role_key === 'ADMIN') {
      addToast('Admin permissions are protected and cannot be disabled', 'info');
      return;
    }
    setPermissionsMatrix(prev =>
      prev.map(mod => {
        if (mod.module_key === moduleKey) {
          const updatedSubs = (mod.submodules || []).map(sub => {
            if (sub.submodule_key === submoduleKey) {
              const updatedSub = { ...sub, [field]: !sub[field] };
              if (field === 'can_view' && !updatedSub.can_view) {
                updatedSub.can_create = false;
                updatedSub.can_edit = false;
                updatedSub.can_delete = false;
              }
              if ((field === 'can_create' || field === 'can_edit' || field === 'can_delete') && updatedSub[field]) {
                updatedSub.can_view = true;
              }
              return updatedSub;
            }
            return sub;
          });

          const hasAnyView = updatedSubs.some(s => s.can_view);
          const hasAnyCreate = updatedSubs.some(s => s.can_create);
          const hasAnyEdit = updatedSubs.some(s => s.can_edit);
          const hasAnyDelete = updatedSubs.some(s => s.can_delete);

          return {
            ...mod,
            can_view: hasAnyView,
            can_create: hasAnyCreate,
            can_edit: hasAnyEdit,
            can_delete: hasAnyDelete,
            submodules: updatedSubs
          };
        }
        return mod;
      })
    );
  };

  const handleModuleFieldToggle = (moduleKey, field) => {
    if (selectedRole?.role_key === 'SUPER_ADMIN' || selectedRole?.role_key === 'ADMIN') return;
    setPermissionsMatrix(prev =>
      prev.map(mod => {
        if (mod.module_key === moduleKey) {
          const currentAll = (mod.submodules || []).length > 0 && mod.submodules.every(s => s[field]);
          const targetVal = !currentAll;

          const updatedSubs = (mod.submodules || []).map(sub => {
            const updatedSub = { ...sub, [field]: targetVal };
            if (field === 'can_view' && !targetVal) {
              updatedSub.can_create = false;
              updatedSub.can_edit = false;
              updatedSub.can_delete = false;
            }
            if ((field === 'can_create' || field === 'can_edit' || field === 'can_delete') && targetVal) {
              updatedSub.can_view = true;
            }
            return updatedSub;
          });

          return {
            ...mod,
            can_view: updatedSubs.some(s => s.can_view),
            can_create: updatedSubs.some(s => s.can_create),
            can_edit: updatedSubs.some(s => s.can_edit),
            can_delete: updatedSubs.some(s => s.can_delete),
            submodules: updatedSubs
          };
        }
        return mod;
      })
    );
  };

  const handleModuleAllToggle = (moduleKey) => {
    if (selectedRole?.role_key === 'SUPER_ADMIN' || selectedRole?.role_key === 'ADMIN') return;
    setPermissionsMatrix(prev =>
      prev.map(mod => {
        if (mod.module_key === moduleKey) {
          const allActive = (mod.submodules || []).length > 0 && mod.submodules.every(s => s.can_view && s.can_create && s.can_edit && s.can_delete);
          const targetVal = !allActive;

          const updatedSubs = (mod.submodules || []).map(sub => ({
            ...sub,
            can_view: targetVal,
            can_create: targetVal,
            can_edit: targetVal,
            can_delete: targetVal
          }));

          return {
            ...mod,
            can_view: targetVal,
            can_create: targetVal,
            can_edit: targetVal,
            can_delete: targetVal,
            submodules: updatedSubs
          };
        }
        return mod;
      })
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/app/rbac/permissions/${selectedRole.role_key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          permissions: permissionsMatrix,
          roleInfo: {
            role_name: selectedRole.role_name,
            description: selectedRole.description
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Permission matrix updated for ${selectedRole.role_name}!`, 'success');
        window.dispatchEvent(new CustomEvent('permissionsUpdated', { detail: { roleKey: selectedRole.role_key } }));
      } else {
        addToast(data.message || 'Failed to save permissions', 'error');
      }
    } catch (err) {
      addToast('Error saving permission matrix', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoleData.role_name.trim()) {
      addToast('Please enter a role name', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/app/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(newRoleData)
      });
      const data = await res.json();
      if (data.success) {
        addToast(`New role "${newRoleData.role_name}" created successfully!`, 'success');
        setShowAddModal(false);
        setNewRoleData({ role_name: '', description: '', template_role: 'EMPLOYEE' });
        await fetchRoles();
      } else {
        addToast(data.message || 'Failed to create role', 'error');
      }
    } catch (err) {
      addToast('Error creating role', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleKey, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the custom role "${roleName}"?`)) return;
    try {
      const res = await fetch(`/app/rbac/roles/${roleKey}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Role "${roleName}" deleted successfully`, 'success');
        setSelectedRole(null);
        await fetchRoles();
      } else {
        addToast(data.message || 'Failed to delete role', 'error');
      }
    } catch (err) {
      addToast('Error deleting role', 'error');
    }
  };

  const getRoleIcon = (roleKey) => {
    const key = (roleKey || '').toUpperCase();
    if (key === 'SUPER_ADMIN' || key === 'ADMIN') return <ShieldCheck size={20} className="text-blue-600" />;
    if (key === 'HR_MANAGER' || key === 'HR') return <UserCheck size={20} className="text-indigo-600" />;
    if (key === 'TEAM_LEADER') return <Users2 size={20} className="text-cyan-600" />;
    return <User size={20} className="text-slate-600" />;
  };

  const standardRoles = roles.filter(r => r.is_system);
  const customRoles = roles.filter(r => !r.is_system);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Shield size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0F172A' }}>User Roles & Access Control</h1>
          </div>
          <p style={{ margin: '4px 0 0 46px', fontSize: 14, color: '#64748B' }}>
            Configure user roles and manage fine-grained permission matrices across all HRMS modules.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowAdminRegisterModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#4F46E5', color: '#FFFFFF',
              borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.25)'
            }}
          >
            <UserPlus size={18} />
            Register Admin / Manager
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#2563EB', color: '#FFFFFF',
              borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
            }}
          >
            <Plus size={18} />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Standard System Roles Section */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#2563EB" /> Standard System Roles
        </h3>

        {loadingRoles ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#64748B', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            Loading standard system roles...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            {standardRoles.map(r => {
              const isSelected = selectedRole?.role_key === r.role_key;
              return (
                <div
                  key={r.id || r.role_key}
                  onClick={() => setSelectedRole(r)}
                  style={{
                    background: isSelected ? '#F0F6FF' : '#FFFFFF',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getRoleIcon(r.role_key)}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: '#F1F5F9', color: '#475569', textTransform: 'uppercase'
                      }}>
                        System Default
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> {r.user_count || 0}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                    {r.role_name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.4, height: 34, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Roles Section (if any created) */}
      {customRoles.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#D97706" /> Custom Roles
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
            {customRoles.map(r => {
              const isSelected = selectedRole?.role_key === r.role_key;
              return (
                <div
                  key={r.id || r.role_key}
                  onClick={() => setSelectedRole(r)}
                  style={{
                    background: isSelected ? '#FEF3C7' : '#FFFFFF',
                    border: isSelected ? '2px solid #D97706' : '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(217,119,6,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: '#FEF3C7', color: '#D97706', textTransform: 'uppercase'
                    }}>
                      Custom Role
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> {r.user_count || 0}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: isSelected ? '#92400E' : '#0F172A' }}>
                    {r.role_name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.4, height: 34, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {r.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(r.role_key, r.role_name);
                    }}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'none', border: 'none', color: '#94A3B8',
                      cursor: 'pointer', padding: 4
                    }}
                    title="Delete Custom Role"
                  >
                    <Trash2 size={15} className="hover:text-red-600 transition-colors" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      {selectedRole && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {/* Matrix Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                  Permission Matrix: <span style={{ color: '#2563EB' }}>{selectedRole.role_name}</span>
                </h2>
                {(selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN') && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    <Lock size={12} /> Protected Full Access
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Toggle module-level permissions for View, Create, Edit, and Delete actions.
              </p>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={saving || selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: (selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN') ? '#94A3B8' : '#10B981',
                color: '#FFFFFF', borderRadius: 10, fontWeight: 600, fontSize: 14,
                border: 'none', cursor: (selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN') || saving ? 'not-allowed' : 'pointer',
                boxShadow: (selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN') ? 'none' : '0 2px 8px rgba(16,185,129,0.25)'
              }}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>

          {/* Matrix Table */}
          {loadingMatrix ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Loading permission matrix...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#475569', width: '35%' }}>
                      MODULE NAME
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', width: '15%' }}>
                      CAN VIEW
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', width: '15%' }}>
                      CAN CREATE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', width: '15%' }}>
                      CAN EDIT
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', width: '15%' }}>
                      CAN DELETE
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', width: '10%' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsMatrix.map((item, idx) => {
                    const isExpanded = Boolean(expandedModules[item.module_key]);
                    const isProtectedAdmin = selectedRole.role_key === 'SUPER_ADMIN' || selectedRole.role_key === 'ADMIN';
                    const subs = item.submodules || [];
                    const hasSubmodules = subs.length > 0;

                    const allSubsSelected = hasSubmodules && subs.every(s => s.can_view && s.can_create && s.can_edit && s.can_delete);

                    return (
                      <React.Fragment key={item.module_key}>
                        {/* Parent Module Row */}
                        <tr
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                onClick={() => toggleModuleExpand(item.module_key)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                                  color: '#64748B', display: 'flex', alignItems: 'center', borderRadius: 6
                                }}
                                title={isExpanded ? "Collapse Submodules" : "Expand Submodules"}
                              >
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </button>
                              <div>
                                <div
                                  onClick={() => toggleModuleExpand(item.module_key)}
                                  style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                  {item.module_label}
                                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#EFF6FF', color: '#2563EB' }}>
                                    {subs.length} {subs.length === 1 ? 'submodule' : 'submodules'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>{item.category} Module</div>
                              </div>
                            </div>
                          </td>

                          {['can_view', 'can_create', 'can_edit', 'can_delete'].map(field => {
                            const allFieldChecked = hasSubmodules && subs.every(s => s[field]);
                            const someFieldChecked = hasSubmodules && subs.some(s => s[field]);
                            return (
                              <td key={field} style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={allFieldChecked}
                                  ref={el => { if (el) el.indeterminate = !allFieldChecked && someFieldChecked; }}
                                  disabled={isProtectedAdmin}
                                  onChange={() => handleModuleFieldToggle(item.module_key, field)}
                                  title={`Toggle ${field.replace('can_', '')} for all submodules in ${item.module_label}`}
                                  style={{
                                    width: 18, height: 18, accentColor: '#2563EB', cursor: isProtectedAdmin ? 'not-allowed' : 'pointer'
                                  }}
                                />
                              </td>
                            );
                          })}

                          <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleModuleAllToggle(item.module_key)}
                              disabled={isProtectedAdmin}
                              style={{
                                padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                background: allSubsSelected ? '#F1F5F9' : '#EFF6FF',
                                color: allSubsSelected ? '#475569' : '#2563EB',
                                border: 'none', borderRadius: 6, cursor: isProtectedAdmin ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {allSubsSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Submodules Section */}
                        {isExpanded && subs.map((sub, sIdx) => {
                          const subAllSelected = sub.can_view && sub.can_create && sub.can_edit && sub.can_delete;
                          return (
                            <tr
                              key={sub.submodule_key}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                                background: sIdx % 2 === 0 ? '#F8FAFC' : '#F1F5F9'
                              }}
                            >
                              <td style={{ padding: '12px 20px 12px 52px' }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>└──</span>
                                  {sub.submodule_label}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', marginLeft: 22 }}>
                                  Key: {sub.submodule_key}
                                </div>
                              </td>

                              {['can_view', 'can_create', 'can_edit', 'can_delete'].map(field => (
                                <td key={field} style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={sub[field]}
                                    disabled={isProtectedAdmin}
                                    onChange={() => handleSubmoduleCheckboxChange(item.module_key, sub.submodule_key, field)}
                                    style={{
                                      width: 17, height: 17, accentColor: '#2563EB', cursor: isProtectedAdmin ? 'not-allowed' : 'pointer'
                                    }}
                                  />
                                </td>
                              ))}

                              <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                <button
                                  onClick={() => {
                                    if (isProtectedAdmin) return;
                                    const targetVal = !subAllSelected;
                                    setPermissionsMatrix(prev =>
                                      prev.map(mObj => {
                                        if (mObj.module_key === item.module_key) {
                                          const updatedS = mObj.submodules.map(sItem => {
                                            if (sItem.submodule_key === sub.submodule_key) {
                                              return { ...sItem, can_view: targetVal, can_create: targetVal, can_edit: targetVal, can_delete: targetVal };
                                            }
                                            return sItem;
                                          });
                                          return {
                                            ...mObj,
                                            can_view: updatedS.some(s => s.can_view),
                                            can_create: updatedS.some(s => s.can_create),
                                            can_edit: updatedS.some(s => s.can_edit),
                                            can_delete: updatedS.some(s => s.can_delete),
                                            submodules: updatedS
                                          };
                                        }
                                        return mObj;
                                      })
                                    );
                                  }}
                                  disabled={isProtectedAdmin}
                                  style={{
                                    padding: '3px 8px', fontSize: 10, fontWeight: 600,
                                    background: subAllSelected ? '#E2E8F0' : '#DBEAFE',
                                    color: subAllSelected ? '#475569' : '#1E40AF',
                                    border: 'none', borderRadius: 4, cursor: isProtectedAdmin ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {subAllSelected ? 'Clear' : 'All'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 500,
            padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Create Custom Role</h3>
            <form onSubmit={handleCreateRoleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Role Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance Manager"
                  value={newRoleData.role_name}
                  onChange={(e) => setNewRoleData(prev => ({ ...prev, role_name: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  placeholder="Briefly describe the purpose of this custom role..."
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Copy Initial Permissions From
                </label>
                <AppDropdown
                  value={newRoleData.template_role}
                  onChange={v => setNewRoleData(prev => ({ ...prev, template_role: v }))}
                  options={[{ value: 'EMPLOYEE', label: 'Employee (Self-Service)' }, { value: 'HR_MANAGER', label: 'HR (Human Resources Management)' }, { value: 'TEAM_LEADER', label: 'Team Leader (Team Management)' }]}
                  size="sm"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '10px 20px', background: '#2563EB', color: '#FFFFFF', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin / Manager Register Modal */}
      {showAdminRegisterModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)'
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
            <button
              onClick={() => setShowAdminRegisterModal(false)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: 'rgba(255, 255, 255, 0.2)', border: 'none',
                borderRadius: '50%', width: 32, height: 32, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <AdminManagerRegister isModal={true} onClose={() => setShowAdminRegisterModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
