import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { ChevronDown, Plus, ChevronLeft, ChevronRight, X, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../ui/Toast';
import { canCreate, canApprove, checkActionPermission } from '../../lib/permissions';

export default function Promotions() {
  const { addToast } = useToast();
  const [promotionsList, setPromotionsList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');

  // Dashboard Stats
  const [kpiData, setKpiData] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    today: 0,
    month: 0,
    rate: '0%',
    chartData: []
  });

  const [formData, setFormData] = useState({
    employee: '',
    department: '',
    currentRole: '',
    proposedRole: '',
    effectiveDate: '',
    approver: '',
    status: 'Pending',
    justification: ''
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

      // Fetch departments
      const deptRes = await fetch('/app/requirements/meta/all', { headers });
      const deptData = await deptRes.json();
      if (deptData && deptData.departments) {
        setDepartments(deptData.departments);
      }

      // Fetch employees
      const empRes = await fetch('/app/employees', { headers });
      const empData = await empRes.json();
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }
    } catch (err) {
      console.error('Failed to load promotions metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/app/promotions/dashboard', {
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

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/app/promotions?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setPromotionsList(resData.data.promotions || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast(resData.message || 'Failed to fetch promotions list', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchPromotions();
    fetchDashboardStats();
  }, [page, fetchPromotions, fetchDashboardStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('promotions', 'CREATE')) {
      return;
    }
    if (!formData.employee || !formData.proposedRole || !formData.effectiveDate) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(formData.employee),
        current_department: formData.department,
        current_designation: formData.currentRole,
        promoted_department: formData.department, // Assuming same department unless changed
        promoted_designation: formData.proposedRole.trim(),
        promotion_date: new Date().toISOString().split('T')[0],
        effective_date: formData.effectiveDate,
        promotion_reason: formData.justification.trim(),
        status: formData.status
      };

      const res = await fetch('/app/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('Promotion proposed successfully!', 'success');
        setShowAddModal(false);
        setFormData({ employee: '', department: '', currentRole: '', proposedRole: '', effectiveDate: '', approver: '', status: 'Pending', justification: '' });
        fetchPromotions();
        fetchDashboardStats();
      } else {
        addToast(resData.message || 'Failed to save promotion recommendation', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (promotionId) => {
    if (!checkActionPermission('promotions', 'EDIT')) {
      return;
    }
    try {
      const res = await fetch(`/app/promotions/${promotionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('Promotion approved and Employee Profile updated!', 'success');
        fetchPromotions();
        fetchDashboardStats();
      } else {
        addToast(resData.message || 'Failed to approve promotion', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const selectedEmployee = employees.find(e => e.id === parseInt(formData.employee));
  useEffect(() => {
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        department: selectedEmployee.branch_name || 'Engineering',
        currentRole: selectedEmployee.role_name || 'Associate'
      }));
    }
  }, [selectedEmployee]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#DCFCE7', color: '#15803D' };
      case 'Pending': return { bg: '#FEF3C7', color: '#D97706' };
      case 'Rejected': return { bg: '#FEE2E2', color: '#DC2626' };
    default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
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

      {/* Add Promotion Modal */}
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
                    <Award size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Add Promotion Recommendation</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Submit career progression, role elevation, and designation changes</p>
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

              {/* Employee */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Employee <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <AppDropdown
                  value={formData.employee}
                  onChange={v => setFormData({ ...formData, employee: v })}
                  options={[
                    { value: '', label: 'Select Employee' },
                    ...employees.map(e => ({
                      value: String(e.id),
                      label: `👤 ${e.name}${e.employee_code || e.emp_id ? ` (${e.employee_code || e.emp_id})` : ` (EMP${String(e.id).padStart(4, '0')})`}${e.dept_name ? ` - ${e.dept_name}` : ''}`
                    }))
                  ]}
                  size="sm"
                />
              </div>

              {selectedEmployee && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Current Dept</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{formData.department}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Current Role</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{formData.currentRole}</span>
                  </div>
                </div>
              )}

              {/* Proposed Role */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Proposed Role / Designation <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  value={formData.proposedRole}
                  onChange={e => setFormData({ ...formData, proposedRole: e.target.value })}
                  placeholder="e.g. Lead Full Stack Engineer / Senior Manager"
                  style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Effective Date + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Effective Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date" required
                    value={formData.effectiveDate}
                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Approval Status
                  </label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[
                      { value: 'Pending', label: '🟡 Pending' },
                      { value: 'Approved', label: '🟢 Approved' },
                      { value: 'Rejected', label: '🔴 Rejected' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Justification */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Promotion Justification & Business Case <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={formData.justification}
                  onChange={e => setFormData({ ...formData, justification: e.target.value })}
                  placeholder="Outline demonstrated competencies, leadership contributions, and justification for promotion..."
                  style={{ width: '100%', height: 88, padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  Approving a promotion recommendation automatically updates the employee's official designation and role record.
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
                  <Plus size={15} /> {submitting ? 'Submitting...' : 'Submit Promotion'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Promotions</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Track and manage career promotion recommendations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          {canCreate('performance', 'performance_promotions') && (
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
              <Plus size={16} /> Add Promotion
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { title: 'Total Promotions', value: kpiData.total, icon: <ChevronDown size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
          { title: 'Approved', value: kpiData.approved, icon: <ChevronDown size={20} color="#10B981" />, bgColor: '#ECFDF5' },
          { title: 'Today Promotions', value: kpiData.today, icon: <ChevronDown size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
          { title: 'This Month', value: kpiData.month, icon: <ChevronDown size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
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
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>Promotion Proposals</h3>
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
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>Loading promotions...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Current Designation</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Promoted Role</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Effective Date</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>No promotion proposals found</td>
                    </tr>
                  ) : (
                    promotionsList.map((row, idx) => {
                      const effDateStr = row.effective_date ? new Date(row.effective_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      return (
                        <tr key={row.id} style={{ borderBottom: idx === promotionsList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                {row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('') : 'PR'}
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>{row.employee_name}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.current_designation}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1E293B', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.promoted_designation}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{effDateStr}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                              backgroundColor: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color,
                              whiteSpace: 'nowrap', display: 'inline-block'
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {row.status === 'Pending' && (
                              <button
                                onClick={() => handleApprove(row.id)}
                                style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
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

        {/* Right Side: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Department Wise Promotions</h3>
            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData.chartData}>
                  <XAxis dataKey="name" fontSize="11px" stroke="#94A3B8" />
                  <YAxis fontSize="11px" stroke="#94A3B8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2952E3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
