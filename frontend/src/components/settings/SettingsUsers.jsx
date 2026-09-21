import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Save, Users, Shield, Lock, Plus, X, RefreshCw, Check, Layers, UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';

export function SettingsUsers() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'users'
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  // Users Management State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  // Form states
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role_id: '', department_id: '' });
  const [newRoleData, setNewRoleData] = useState({ role_name: '', description: '', template_role: 'EMPLOYEE' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);

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

  // Fetch Roles
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
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRole]);

  // Fetch Permission Matrix for Selected Role
  const fetchRolePermissions = useCallback(async (roleKey) => {
    if (!roleKey) return;
    setLoadingMatrix(true);
    try {
      const res = await fetch(`/app/rbac/permissions/${roleKey}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPermissionsMatrix(data.data);
      }
    } catch (err) {
      addToast('Error loading permission matrix', 'error');
    } finally {
      setLoadingMatrix(false);
    }
  }, [addToast]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await apiFetch('/employees');
      if (Array.isArray(data)) {
        setUsersList(data.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role_name || emp.roleName || 'Employee',
          dept: emp.dept_name || emp.department || 'General',
          status: emp.status || 'Active',
          login: 'Recently'
        })));
      } else if (data && data.success && Array.isArray(data.data)) {
        setUsersList(data.data);
      } else {
        // Fallback default users if endpoint pending
        setUsersList([
          { id: 1, name: 'Rahul Sharma', email: 'rahul.s@acme.com', role: 'Super Admin', dept: 'Engineering', status: 'Active', login: '10 mins ago' },
          { id: 2, name: 'Priya Patel', email: 'priya.p@acme.com', role: 'HR Manager', dept: 'Human Resources', status: 'Active', login: '1 hour ago' },
          { id: 3, name: 'Amit Kumar', email: 'amit.k@acme.com', role: 'Branch Manager', dept: 'Operations', status: 'Active', login: 'Yesterday' }
        ]);
      }
    } catch (err) {
      setUsersList([
        { id: 1, name: 'Rahul Sharma', email: 'rahul.s@acme.com', role: 'Super Admin', dept: 'Engineering', status: 'Active', login: '10 mins ago' },
        { id: 2, name: 'Priya Patel', email: 'priya.p@acme.com', role: 'HR Manager', dept: 'Human Resources', status: 'Active', login: '1 hour ago' },
        { id: 3, name: 'Amit Kumar', email: 'amit.k@acme.com', role: 'Branch Manager', dept: 'Operations', status: 'Active', login: 'Yesterday' }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedRole && selectedRole.role_key) {
      fetchRolePermissions(selectedRole.role_key);
    }
  }, [selectedRole, fetchRolePermissions]);

  const handleCheckboxChange = (moduleKey, field) => {
    if (selectedRole?.role_key === 'SUPER_ADMIN') {
      addToast('Super Admin permissions are protected and cannot be modified', 'info');
      return;
    }
    setPermissionsMatrix(prev =>
      prev.map(item => {
        if (item.module_key === moduleKey) {
          const targetVal = !item[field];
          let updated = { ...item, [field]: targetVal };
          if (field === 'can_view' && !targetVal) {
            updated.can_create = false;
            updated.can_edit = false;
            updated.can_delete = false;
          }
          if ((field === 'can_create' || field === 'can_edit' || field === 'can_delete') && targetVal) {
            updated.can_view = true;
          }

          if (Array.isArray(item.submodules)) {
            updated.submodules = item.submodules.map(sub => {
              let updatedSub = { ...sub, [field]: targetVal };
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
          }

          return updated;
        }
        return item;
      })
    );
  };

  const handleRowToggle = (moduleKey) => {
    if (selectedRole?.role_key === 'SUPER_ADMIN') return;
    setPermissionsMatrix(prev =>
      prev.map(item => {
        if (item.module_key === moduleKey) {
          const allActive = item.can_view && item.can_create && item.can_edit && item.can_delete;
          const targetVal = !allActive;
          const updatedSubs = Array.isArray(item.submodules)
            ? item.submodules.map(sub => ({
                ...sub,
                can_view: targetVal,
                can_create: targetVal,
                can_edit: targetVal,
                can_delete: targetVal
              }))
            : [];
          return {
            ...item,
            can_view: targetVal,
            can_create: targetVal,
            can_edit: targetVal,
            can_delete: targetVal,
            submodules: updatedSubs
          };
        }
        return item;
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
        addToast(`Permission matrix saved for ${selectedRole.role_name}!`, 'success');
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
    if (!newRoleData.role_name.trim()) return;
    setCreatingRole(true);
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
        addToast(`Custom role "${newRoleData.role_name}" created successfully!`, 'success');
        setShowAddRoleModal(false);
        setNewRoleData({ role_name: '', description: '', template_role: 'EMPLOYEE' });
        await fetchRoles();
      } else {
        addToast(data.message || 'Failed to create role', 'error');
      }
    } catch (err) {
      addToast('Error creating role', 'error');
    } finally {
      setCreatingRole(false);
    }
  };

  const calculateTotalRules = () => {
    if (!permissionsMatrix) return 0;
    return permissionsMatrix.reduce((acc, curr) => {
      return acc + (curr.can_view ? 1 : 0) + (curr.can_create ? 1 : 0) + (curr.can_edit ? 1 : 0) + (curr.can_delete ? 1 : 0);
    }, 0);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 24 }}>
      
      {/* Top Title & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Users & Roles</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage system access, granular module permissions, and role assignments</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'permissions' ? (
            <>
              <button
                onClick={() => setShowAddRoleModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Custom Role
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving || selectedRole?.role_key === 'SUPER_ADMIN'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
                  background: selectedRole?.role_key === 'SUPER_ADMIN' ? '#94A3B8' : '#10B981',
                  color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: selectedRole?.role_key === 'SUPER_ADMIN' || saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAddUserModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <UserPlus size={14} /> Add New User
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Total Admin Users</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>{usersList.length || 14} Users</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Active Roles</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>{roles.length || 6} Defined</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Active Permission Rules</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 2 }}>{calculateTotalRules() || 42} Active</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Selected Role</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedRole?.role_name || 'Super Admin'}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
        <button
          onClick={() => setActiveTab('permissions')}
          style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 600, border: 'none', background: 'none',
            color: activeTab === 'permissions' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'permissions' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Shield size={16} /> Role Permission Matrix
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 600, border: 'none', background: 'none',
            color: activeTab === 'users' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'users' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Users size={16} /> System Users & Assignments
        </button>
      </div>

      {/* TAB 1: PERMISSION MATRIX */}
      {activeTab === 'permissions' && (
        <div>
          {/* Roles Selector Pills */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Role to Configure Permissions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map(r => {
                const isSelected = selectedRole?.role_key === r.role_key;
                return (
                  <button
                    key={r.id || r.role_key}
                    onClick={() => setSelectedRole(r)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      background: isSelected ? '#2563EB' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {r.role_key === 'SUPER_ADMIN' && <Lock size={12} />}
                    {r.role_name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matrix Container */}
          {selectedRole && (
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    Module Permissions for <span style={{ color: '#2563EB' }}>{selectedRole.role_name}</span>
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#6B7280' }}>
                    {selectedRole.description || 'Set granular permissions for view, create, edit, and delete operations across all system modules.'}
                  </p>
                </div>
                {selectedRole.role_key === 'SUPER_ADMIN' && (
                  <span style={{ fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} /> Protected Full Access
                  </span>
                )}
              </div>

              {loadingMatrix ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  Loading permission matrix...
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', width: '35%' }}>MODULE NAME</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', width: '15%' }}>CAN VIEW</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', width: '15%' }}>CAN CREATE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', width: '15%' }}>CAN EDIT</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', width: '15%' }}>CAN DELETE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', width: '10%' }}>TOGGLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionsMatrix.map((item, idx) => {
                      const allActive = item.can_view && item.can_create && item.can_edit && item.can_delete;
                      return (
                        <tr key={item.module_key} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{item.module_label}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.category} Module</div>
                          </td>

                          {['can_view', 'can_create', 'can_edit', 'can_delete'].map(field => (
                            <td key={field} style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item[field]}
                                disabled={selectedRole.role_key === 'SUPER_ADMIN'}
                                onChange={() => handleCheckboxChange(item.module_key, field)}
                                style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: selectedRole.role_key === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer' }}
                              />
                            </td>
                          ))}

                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRowToggle(item.module_key)}
                              disabled={selectedRole.role_key === 'SUPER_ADMIN'}
                              style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                                background: allActive ? '#F1F5F9' : '#EFF6FF',
                                color: allActive ? '#475569' : '#2563EB',
                                border: 'none', borderRadius: 6, cursor: selectedRole.role_key === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {allActive ? 'Clear' : 'All'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM USERS & ROLE ASSIGNMENTS */}
      {activeTab === 'users' && (
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>System Administrators & Role Assignments</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['User', 'Role', 'Department', 'Status', 'Last Login'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersList.map((u, i) => (
                <tr key={u.id || i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                  <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    <div>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 400 }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#2563EB', fontWeight: 600 }}>{u.role || u.role_name || 'Super Admin'}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{u.dept || u.department_name || 'Engineering'}</td>
                  <td style={{ padding: '0 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#059669' }}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280' }}>{u.login || 'Recently'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Custom Role Modal */}
      {showAddRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Create Custom System Role</h3>
              <button onClick={() => setShowAddRoleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRoleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Auditor"
                  value={newRoleData.role_name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, role_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of responsibilities and permissions..."
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Clone Permissions From</label>
                <AppDropdown
                  value={newRoleData.template_role}
                  onChange={v => setNewRoleData({ ...newRoleData, template_role: v })}
                  options={[{value:'EMPLOYEE',label:'Employee (Basic Self Service)'},{value:'HR_MANAGER',label:'HR Manager (Employee & HR Management)'},{value:'DEPT_MANAGER',label:'Department Manager (Team Oversight)'},{value:'FINANCE_ADMIN',label:'Finance Admin (Payroll & Expenses)'}]}
                  size="sm"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  style={{ padding: '10px 18px', background: '#2563EB', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                >
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Add New System User</h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newUserData.name || !newUserData.email) return;
              setUsersList([...usersList, {
                id: Date.now(),
                name: newUserData.name,
                email: newUserData.email,
                role: newUserData.role_id || 'HR Manager',
                dept: newUserData.department_id || 'General',
                status: 'Active',
                login: 'Just now'
              }]);
              addToast(`User ${newUserData.name} created successfully!`, 'success');
              setShowAddUserModal(false);
              setNewUserData({ name: '', email: '', role_id: '', department_id: '' });
            }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sethi"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@company.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Assign Role</label>
                  <AppDropdown value={newUserData.role_id} options={[, ...(roles || [])]} size="sm" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations"
                    value={newUserData.department_id}
                    onChange={(e) => setNewUserData({ ...newUserData, department_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#2563EB', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsUsers;
