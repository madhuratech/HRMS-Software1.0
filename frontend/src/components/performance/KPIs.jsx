import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { ChevronDown, Plus, ChevronLeft, ChevronRight, X, CheckCircle, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { canCreate, checkActionPermission } from '../../lib/permissions';

export default function KPIs() {
  const { addToast } = useToast();
  const [kpisList, setKpisList] = useState([]);
  const [kras, setKras] = useState([]);
  const [departments, setDepartments] = useState([]);
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
    kra_id: '',
    kpiName: '',
    department: '',
    measurement_type: 'Percentage',
    targetValue: '',
    description: '',
    status: 'Active'
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

      // Fetch KRAs
      try {
        const kraRes = await fetch('/app/kras?limit=200', { headers });
        const kraData = await kraRes.json();
        if (kraData && kraData.success && kraData.data && Array.isArray(kraData.data.kras)) {
          setKras(kraData.data.kras);
        }
      } catch (e) {
        console.error('Failed to load KRAs:', e);
      }
    } catch (err) {
      console.error('Failed to load KPIs metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/app/kpis/dashboard', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/app/kpis?page=${page}&limit=${limit}`;
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
        setKpisList(resData.data.kpis || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast(resData.message || 'Failed to fetch KPIs', 'error');
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
    fetchKpis();
    fetchDashboardStats();
  }, [page, fetchKpis, fetchDashboardStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('kpis', 'CREATE')) {
      return;
    }
    if (!formData.kpiName || !formData.targetValue) {
      addToast('Please fill in all required fields (KPI Name, Target Value).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const parsedDept = formData.department ? parseInt(formData.department, 10) : null;
      const parsedKra = formData.kra_id ? parseInt(formData.kra_id, 10) : null;

      const payload = {
        kra_id: parsedKra,
        kpi_name: formData.kpiName.trim(),
        title: formData.kpiName.trim(),
        department_id: parsedDept,
        measurement_type: formData.measurement_type || 'Percentage',
        target_value: formData.targetValue.trim(),
        description: formData.description ? formData.description.trim() : '',
        status: formData.status || 'Active'
      };

      const res = await fetch('/app/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('KPI created successfully!', 'success');
        setShowAddModal(false);
        setFormData({ kra_id: '', kpiName: '', department: '', measurement_type: 'Percentage', targetValue: '', description: '', status: 'Active' });
        fetchKpis();
        fetchDashboardStats();
      } else {
        addToast(resData.message || (resData.errors ? JSON.stringify(resData.errors) : 'Failed to save KPI'), 'error');
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

      {/* Add KPI Modal */}
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
                    <Activity size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Add Key Performance Indicator (KPI)</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Define quantifiable targets and metrics linked to Key Result Areas</p>
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

              {/* Parent KRA */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Parent KRA (Key Result Area) <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <AppDropdown
                  value={formData.kra_id}
                  onChange={v => {
                    const selKra = kras.find(k => String(k.id) === String(v));
                    setFormData({
                      ...formData,
                      kra_id: v,
                      department: selKra?.department_id ? String(selKra.department_id) : formData.department
                    });
                  }}
                  options={[
                    { value: '', label: 'General KPI (No Direct KRA)' },
                    ...kras.map(k => ({
                      value: String(k.id),
                      label: `🏷️ ${k.kra_title || k.title}${k.weightage ? ` (${k.weightage}%)` : ''}${k.department_name ? ` - ${k.department_name}` : ''}`
                    }))
                  ]}
                  size="sm"
                />
              </div>

              {/* KPI Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  KPI Name & Indicator <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  value={formData.kpiName}
                  onChange={e => setFormData({ ...formData, kpiName: e.target.value })}
                  placeholder="e.g. Code Coverage % / Bug Resolution Time (Hours)"
                  style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Department + Measurement Type */}
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
                    Measurement Type
                  </label>
                  <AppDropdown
                    value={formData.measurement_type}
                    onChange={v => setFormData({ ...formData, measurement_type: v })}
                    options={[
                      { value: 'Percentage', label: '📊 Percentage (%)' },
                      { value: 'Number', label: '🔢 Number / Count' },
                      { value: 'Currency', label: '💵 Currency ($ / ₹)' },
                      { value: 'Milestone', label: '🚩 Milestone / Boolean' },
                      { value: 'Rating', label: '⭐ Rating (1-5 Scale)' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Row: Target Value + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Target Value <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text" required
                    value={formData.targetValue}
                    onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="e.g. 100 / 85 / 50"
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
                  Description & Measurement Criteria <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="KPI metric definitions, calculation criteria, and tracking frequency..."
                  style={{ width: '100%', height: 88, padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  KPIs establish verifiable metric targets and actual achievement criteria evaluated in Performance Reviews.
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
                  <Plus size={15} /> {submitting ? 'Saving KPI...' : 'Save KPI Target'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Key Performance Indicators (KPIs)</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Define quantifiable indicators and measurable metrics</p>
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
          {canCreate('performance', 'kpis') && (
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
              <Plus size={16} /> Add KPI
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { title: 'Total KPIs', value: kpiData.total, icon: <CheckCircle size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
          { title: 'Active KPIs', value: kpiData.active, icon: <CheckCircle size={20} color="#10B981" />, bgColor: '#ECFDF5' },
          { title: 'Active Rate', value: kpiData.rate, icon: <CheckCircle size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
          { title: 'Inactive KPIs', value: kpiData.inactive, icon: <CheckCircle size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
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
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>KPI Tracker</h3>
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
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>Loading KPIs...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>KPI Name</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Parent KRA</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Department</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Measurement Type</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Target Value</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kpisList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>No KPIs configured</td>
                    </tr>
                  ) : (
                    kpisList.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: idx === kpisList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>{row.kpi_name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#2563EB', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.kra_title || '-'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.department_name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.measurement_type || 'Percentage'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#0F172A', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.target_value}</td>
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>KPI Status</h3>
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Department Wise KPIs</h3>
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
