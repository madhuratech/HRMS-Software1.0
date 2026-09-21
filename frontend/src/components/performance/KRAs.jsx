import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { ChevronDown, Plus, ChevronLeft, ChevronRight, X, CheckCircle, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { canCreate, checkActionPermission } from '../../lib/permissions';

export default function KRAs() {
  const { addToast } = useToast();
  const [kraList, setKraList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');

  // KPI Dashboard Stats
  const [kpiData, setKpiData] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    rate: '0%',
    chartData: [
      { name: 'Active', value: 0, color: '#10B981' },
      { name: 'Inactive', value: 0, color: '#EF4444' }
    ],
    deptData: []
  });

  const [formData, setFormData] = useState({
    goal_id: '',
    title: '',
    department: '',
    role: '',
    weightage: '',
    status: 'Active',
    description: ''
  });

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

  const fetchMeta = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
      try {
        const deptRes = await fetch('/app/employees/lookup/departments', { headers });
        const deptData = await deptRes.json();
        if (Array.isArray(deptData) && deptData.length > 0) {
          setDepartments(deptData);
        } else {
          const metaRes = await fetch('/app/requirements/meta/all', { headers });
          const metaData = await metaRes.json();
          if (metaData && (metaData.departments || metaData.branches)) {
            setDepartments(metaData.departments || metaData.branches);
          }
        }
      } catch (e) {
        console.error('Failed to load departments:', e);
      }

      // Fetch goals
      try {
        const goalRes = await fetch('/app/goals?limit=200', { headers });
        const goalData = await goalRes.json();
        if (goalData && goalData.success && goalData.data && Array.isArray(goalData.data.goals)) {
          setGoals(goalData.data.goals);
        }
      } catch (e) {
        console.error('Failed to load goals:', e);
      }
    } catch (err) {
      console.error('Failed to load KRAs metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/app/kras/dashboard', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch KRA dashboard stats:', err);
    }
  }, []);

  const fetchKras = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/app/kras?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterDept && filterDept !== 'All Departments') {
        url += `&department_id=${encodeURIComponent(filterDept)}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setKraList(resData.data.kras || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast(resData.message || 'Failed to fetch KRAs', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept]);

  useEffect(() => {
    fetchKras();
    fetchDashboardStats();
  }, [page, fetchKras, fetchDashboardStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('kras', 'CREATE')) {
      return;
    }
    if (!formData.title || !formData.role) {
      addToast('Please fill in all required fields (KRA Title, Role).', 'error');
      return;
    }

    if (formData.weightage !== '') {
      const numW = Number(formData.weightage);
      if (isNaN(numW) || numW < 0 || numW > 100) {
        addToast('Weightage must be a number between 0% and 100%.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const parsedDept = formData.department ? parseInt(formData.department, 10) : null;
      const parsedGoal = formData.goal_id ? parseInt(formData.goal_id, 10) : null;

      const payload = {
        goal_id: parsedGoal,
        kra_title: formData.title.trim(),
        title: formData.title.trim(),
        department_id: parsedDept,
        role_id: formData.role.trim(),
        weightage: formData.weightage !== '' ? Number(formData.weightage) : null,
        status: formData.status || 'Active',
        description: formData.description ? formData.description.trim() : ''
      };

      const res = await fetch('/app/kras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('KRA created successfully!', 'success');
        setShowAddModal(false);
        setFormData({ goal_id: '', title: '', department: '', role: '', weightage: '', status: 'Active', description: '' });
        fetchKras();
        fetchDashboardStats();
      } else {
        addToast(resData.message || (resData.errors ? JSON.stringify(resData.errors) : 'Failed to save KRA'), 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    return status === 'Active'
      ? { bg: '#DCFCE7', color: '#15803D' }
      : { bg: '#F3F4F6', color: '#6B7280' };
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>

      {/* Add KRA Modal */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 560, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E40AF 0%,#1D4ED8 50%,#2563EB 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -14, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Add Key Result Area (KRA)</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Define core performance domains and assigned weightages</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Parent Goal */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Parent Goal <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <AppDropdown
                  value={formData.goal_id}
                  onChange={v => {
                    const selGoal = goals.find(g => String(g.id) === String(v));
                    setFormData({
                      ...formData,
                      goal_id: v,
                      department: selGoal?.department_id ? String(selGoal.department_id) : formData.department
                    });
                  }}
                  options={[
                    { value: '', label: 'General / Departmental KRA (No Direct Goal)' },
                    ...goals.map(g => ({
                      value: String(g.id),
                      label: `🎯 ${g.goal_title || g.title}${g.employee_name ? ` (${g.employee_name})` : ''}`
                    }))
                  ]}
                  size="sm"
                />
              </div>

              {/* KRA Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  KRA Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Core System Architecture & Backend Stability"
                  style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Department + Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Department
                  </label>
                  <AppDropdown
                    value={formData.department}
                    onChange={v => setFormData({ ...formData, department: v })}
                    options={[
                      { value: '', label: 'All Departments' },
                      ...departments.map(d => ({
                        value: String(d.id || d.branch_name || d.dept_name || d.name),
                        label: d.dept_name || d.branch_name || d.name
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Role / Designation <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text" required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              {/* Row: Weightage + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    KRA Weightage (%)
                  </label>
                  <input
                    type="number" min="0" max="100"
                    value={formData.weightage}
                    onChange={e => setFormData({ ...formData, weightage: e.target.value })}
                    placeholder="e.g. 40"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Status
                  </label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[
                      { value: 'Active', label: '🟢 Active' },
                      { value: 'Inactive', label: '⚪ Inactive' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Description & Scope <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline key outcomes, responsibilities, and success expectations..."
                  style={{ width: '100%', height: 88, padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  KRAs aggregate underlying KPI metrics and contribute to total performance weightage calculation.
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9', marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; }}
                >Cancel</button>
                <button type="submit" disabled={submitting}
                  style={{ height: 44, padding: '0 24px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s', opacity: submitting ? 0.6 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                >
                  <Plus size={15} /> {submitting ? 'Saving KRA...' : 'Save KRA Target'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Key Result Areas (KRAs)</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Define and align Key Result Areas to organizational goals</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ minWidth: '180px' }}>
            <AppDropdown
              value={filterDept}
              onChange={v => setFilterDept(v)}
              options={[
                { value: 'All Departments', label: 'All Departments' },
                ...departments.map(d => ({
                  value: String(d.id || d.branch_name || d.dept_name || d.name),
                  label: d.dept_name || d.branch_name || d.name
                }))
              ]}
              size="sm"
            />
          </div>
          {canCreate('performance', 'kras') && (
            <button 
              onClick={() => setShowAddModal(true)} 
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                background: '#2952E3', 
                color: '#FFF', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={16} /> Add KRA
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { title: 'Total KRAs', value: kpiData.total, icon: <CheckCircle size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
          { title: 'Active KRAs', value: kpiData.active, icon: <CheckCircle size={20} color="#10B981" />, bgColor: '#ECFDF5' },
          { title: 'Active Rate', value: kpiData.rate, icon: <CheckCircle size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
          { title: 'Inactive KRAs', value: kpiData.inactive, icon: <CheckCircle size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
        ].map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '700', whiteSpace: 'nowrap' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>

        {/* Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>KRA Tracker</h3>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>Loading KRAs...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>KRA Title</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Parent Goal</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Department</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Role / Designation</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Weightage</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kraList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>No KRAs defined</td>
                    </tr>
                  ) : (
                    kraList.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: idx === kraList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>{row.kra_title}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#2563EB', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.goal_title || '-'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.department_name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.role_id || '-'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#0F172A', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.weightage !== null && row.weightage !== undefined ? `${row.weightage}%` : '-'}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                            backgroundColor: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color,
                            whiteSpace: 'nowrap', display: 'inline-block'
                          }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button disabled={page === 1} onClick={() => setPage(prev => prev - 1)} style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFF', cursor: page === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)} style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFF', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>KRA Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpiData.chartData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" cx="50%" cy="50%" stroke="none">
                    {kpiData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label value={kpiData.total} position="center" fill="#1E293B" style={{ fontSize: '24px', fontWeight: '700' }} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Department Wise KRAs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kpiData.deptData?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{item.name}</span>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
