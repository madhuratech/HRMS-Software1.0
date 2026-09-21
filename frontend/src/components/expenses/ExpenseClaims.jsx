import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Download, Calendar, ChevronDown, Plus, Eye, ArrowUpRight, ArrowDownRight, Layers, FileText, CheckCircle, Clock, XCircle, Users, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function ExpenseClaims() {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ employees: [], categories: [], departments: [] });
  const [dashboard, setDashboard] = useState({
    kpis: { totalClaims: 0, pendingClaims: 0, approvedClaims: 0, rejectedClaims: 0, totalReimbursement: 0 },
    categoryPie: [],
    monthlyTrend: [],
    deptStats: []
  });

  const [formData, setFormData] = useState({
    title: '',
    employee_id: '',
    category_id: '',
    amount: '',
    date: '',
    paymentMethod: 'Reimbursement',
    receipt: '',
    description: '',
    status: 'Pending'
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const metaRes = await apiFetch('/expenses/meta');
      if (metaRes.success) setMeta(metaRes.data);

      let url = '/expenses/claims?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (deptFilter) url += `department_id=${deptFilter}&`;

      const claimsRes = await apiFetch(url);
      if (claimsRes.success) setClaimsList(claimsRes.data || []);

      const dbRes = await apiFetch('/expenses/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load expense claims data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deptFilter, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.employee_id || !formData.amount || !formData.category_id || !formData.date) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    try {
      const res = await apiFetch('/expenses/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          employee_id: parseInt(formData.employee_id),
          category_id: parseInt(formData.category_id),
          amount: parseFloat(formData.amount),
          date: formData.date,
          payment_method: formData.paymentMethod,
          receipt: formData.receipt || null,
          description: formData.description,
          status: formData.status
        })
      });
      if (res.success) {
        addToast('Expense claim submitted successfully', 'success');
        setShowAddModal(false);
        setFormData({ title: '', employee_id: '', category_id: '', amount: '', date: '', paymentMethod: 'Reimbursement', receipt: '', description: '', status: 'Pending' });
        fetchData();
      } else {
        addToast(res.message || 'Failed to submit claim', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const getUserRole = () => {
    try {
      const auth = JSON.parse(localStorage.getItem('hrms_auth') || '{}');
      if (auth.user && auth.user.role) return auth.user.role;
    } catch (e) { }
    return localStorage.getItem('userRole') || 'SUPER_ADMIN';
  };

  const currentRole = (getUserRole() || '').toUpperCase();
  const isSuperAdminOrHR = currentRole.includes('SUPER') || currentRole.includes('ADMIN') || currentRole.includes('HR');

  const handleApprove = async (id, status = 'Approved') => {
    try {
      const res = await apiFetch(`/expenses/claims/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        addToast(`Claim ${status.toLowerCase()} successfully`, 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to update claim status', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) return;
    try {
      const res = await apiFetch(`/expenses/claims/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Claim deleted successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to delete claim', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const handleExport = () => {
    const headers = ['Claim ID', 'Employee', 'Department', 'Category', 'Purpose', 'Date', 'Amount', 'Status'];
    const rows = claimsList.map(r => [r.id, r.employee_name, r.department_name, r.category_name, r.title, formatDate(r.date), r.amount, r.status]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_claims_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Expense Claims...</div>;
  }

  const KpiCard = ({ label, value, subtext, isPositive, iconBg, iconColor, icon: Icon }) => (
    <div style={{
      background: '#FFF',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 4px rgba(15,23,42,.06)',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      overflow: 'hidden',
      minWidth: 0,
      flex: '1 1 0'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>

      {/* Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Expense Claims</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Track and manage all employee expense claims</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input placeholder="Search purpose/employee..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38, paddingLeft: 12, paddingRight: 12, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <AppDropdown
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
              options={[{ value: '', label: 'All Statuses' }, { value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }]}
              size="sm"
            />
          </div>

          <div style={{ position: 'relative' }}>
            <AppDropdown
              value={deptFilter}
              onChange={v => setDeptFilter(v)}
              options={[{ value: '', label: 'All Departments' }]}
              size="sm"
            />
            <ChevronDown size={13} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Download size={14} /> Export</button>

          {hasPermission('expenses', 'expense_claims', 'create') && (
            <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(41,82,227,0.25)' }}><Plus size={16} /> New Claim</button>
          )}
        </div>
      </div>

      {/* 5 KPI Cards in Single Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Total Claims" value={dashboard.kpis.totalClaims} iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Pending Claims" value={dashboard.kpis.pendingClaims} iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Approved Claims" value={dashboard.kpis.approvedClaims} iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Rejected Claims" value={dashboard.kpis.rejectedClaims} iconBg="#FEF2F2" iconColor="#EF4444" icon={XCircle} />
        <KpiCard label="Total Reimbursement Paid" value={`₹ ${dashboard.kpis.totalReimbursement.toLocaleString('en-IN')}`} iconBg="#EFF6FF" iconColor="#2563EB" icon={Layers} />
      </div>

      {/* 3 Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px 1.2fr', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>

        {/* Left: Monthly Trend */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Expenses Trend</h3>
          {dashboard.monthlyTrend.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No data logged yet</div>
          ) : (
            <div style={{ width: '100%', height: 180, flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Center: Claims by Status */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Claims by Status</h3>
          <div style={{ width: '100%', height: 180, position: 'relative', flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Approved', value: dashboard.kpis.approvedClaims, color: '#2563EB' },
                  { name: 'Pending', value: dashboard.kpis.pendingClaims, color: '#10B981' },
                  { name: 'Rejected', value: dashboard.kpis.rejectedClaims, color: '#EF4444' }
                ]} cx="50%" cy="50%" innerRadius={45} outerRadius={64} dataKey="value" stroke="none">
                  {[
                    <Cell key={0} fill="#2563EB" />,
                    <Cell key={1} fill="#10B981" />,
                    <Cell key={2} fill="#EF4444" />
                  ]}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Expenses by Department */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Expenses by Department</h3>
          {dashboard.deptStats.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No data logged yet</div>
          ) : (
            <div style={{ width: '100%', height: 180, flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dashboard.deptStats} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#374151' }} width={80} />
                  <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Claims List Table */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Claims</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Claim ID', 'Employee', 'Department', 'Category', 'Purpose', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claimsList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    No expense claims found.
                  </td>
                </tr>
              ) : (
                claimsList.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>CLM-{r.id}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.department_name || 'Unassigned'}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.category_name}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.title}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>₹ {parseFloat(r.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Approved' ? '#ECFDF5' : r.status === 'Pending' ? '#FEF3C7' : '#FEF2F2',
                        color: r.status === 'Approved' ? '#059669' : r.status === 'Pending' ? '#D97706' : '#EF4444',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isSuperAdminOrHR && r.status !== 'Approved' && (
                          <button
                            onClick={() => handleApprove(r.id, 'Approved')}
                            style={{
                              background: '#10B981',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {isSuperAdminOrHR && r.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(r.id, 'Rejected')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#F59E0B',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Reject
                          </button>
                        )}
                        {hasPermission('expenses', 'expense_claims', 'delete') && (
                          <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, fontSize: 12, fontWeight: 600 }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Claims Modal */}
      {showAddModal && hasPermission('expenses', 'expense_claims', 'create') && (
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
                    <FileText size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Submit Expense Claim</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Fill in the fields to file a new expense reimbursement claim</p>
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

              {/* Claim Title / Purpose */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Claim Title / Purpose <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Travel tickets to Mumbai"
                  style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Employee + Expense Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Employee <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={formData.employee_id}
                    onChange={v => setFormData({ ...formData, employee_id: v })}
                    options={[{ value: '', label: 'Select Employee' }, ...(meta.employees || []).map(e => ({ value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Employee #${e.id}` }))]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Expense Category <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={formData.category_id}
                    onChange={v => setFormData({ ...formData, category_id: v })}
                    options={[{ value: '', label: 'Select Category' }, ...(meta.categories || []).map(c => ({ value: c.id, label: c.category_name || c.name }))]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Row: Amount + Expense Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Amount (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number" required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 4500"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Expense Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                  Description <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional details or notes regarding this claim..."
                  style={{ width: '100%', height: 88, padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  This claim will be submitted for approval. Make sure all attached details match your payment receipts.
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9', marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; }}
                >Cancel</button>
                <button type="submit"
                  style={{ height: 44, padding: '0 24px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                >
                  <Plus size={15} /> Submit Claim
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}

export default ExpenseClaims;
