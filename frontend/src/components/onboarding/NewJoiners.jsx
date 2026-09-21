import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Plus, Users, UserPlus, Clock, CheckCircle, Percent, MoreHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function NewJoiners() {
  const { addToast } = useToast();
  const [joinersList, setJoinersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterStatus, setFilterStatus] = useState('All Status');

  // KPI States
  const [kpiData, setKpiData] = useState({
    total: 0,
    joinedThisWeek: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    completionRate: '0%',
    chartData: [
      { name: 'Completed', value: 0, color: '#10B981' },
      { name: 'In Progress', value: 0, color: '#2952E3' },
      { name: 'Pending', value: 0, color: '#F59E0B' }
    ],
    deptData: []
  });

  const [formData, setFormData] = useState({
    selectedOfferId: '',
    employee: '',
    department: '',
    designation: '',
    joiningDate: '',
    reportingManager: '',
    checklist: '',
    buddy: '',
    status: 'In Progress'
  });

  const fetchMeta = async () => {
    try {
      // Fetch departments
      const data = await apiFetch('/requirements/meta/all');
      if (data && data.departments) {
        setDepartments(data.departments);
      }

      // Fetch accepted offers
      const offerData = await apiFetch('/offers?status=Accepted&limit=100');
      if (offerData && offerData.success && offerData.data) {
        setAcceptedOffers(offerData.data.offers || []);
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const resData = await apiFetch('/joiners/dashboard');
      if (resData && resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  }, []);

  const fetchJoiners = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/joiners?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterStatus && filterStatus !== 'All Status') {
        url += `&status=${encodeURIComponent(filterStatus)}`;
      }
      if (filterDept && filterDept !== 'All Departments') {
        url += `&department_id=${encodeURIComponent(filterDept)}`;
      }

      const resData = await apiFetch(url);
      if (resData && resData.success && resData.data) {
        setJoinersList(resData.data.joiners || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to fetch joiners onboarding', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterStatus, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, filterStatus]);

  useEffect(() => {
    fetchJoiners();
    fetchDashboardStats();
  }, [page, fetchJoiners, fetchDashboardStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#ECFDF5', text: '#10B981' };
      case 'In Progress': return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'Pending': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const handleOfferChange = (offerId) => {
    if (!offerId) {
      setFormData({
        ...formData,
        selectedOfferId: '',
        employee: '',
        department: '',
        designation: '',
        joiningDate: '',
        reportingManager: ''
      });
      return;
    }
    const offer = acceptedOffers.find(o => o.id === parseInt(offerId));
    if (offer) {
      // Format joining date: "YYYY-MM-DD"
      let formattedDate = '';
      if (offer.joining_date) {
        formattedDate = new Date(offer.joining_date).toISOString().split('T')[0];
      }
      setFormData({
        ...formData,
        selectedOfferId: offerId,
        employee: offer.candidate_name,
        department: offer.department_id,
        designation: offer.job_position,
        joiningDate: formattedDate,
        reportingManager: offer.reporting_manager
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.employee || !formData.department || !formData.designation || !formData.joiningDate || !formData.reportingManager || !formData.checklist) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_name: formData.employee.trim(),
        department_id: parseInt(formData.department),
        designation: formData.designation.trim(),
        joining_date: formData.joiningDate,
        reporting_manager: formData.reportingManager.trim(),
        checklist: formData.checklist,
        buddy: formData.buddy.trim(),
        status: formData.status
      };

      const resData = await apiFetch('/joiners', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (resData && resData.success) {
        addToast('New Joiner onboarding created successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          selectedOfferId: '', employee: '', department: '', designation: '', joiningDate: '',
          reportingManager: '', checklist: '', buddy: '', status: 'In Progress'
        });
        fetchJoiners();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to start onboarding', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const kpis = [
    { title: 'Total New Joiners', value: kpiData.total, trend: 'This Month', icon: <Users size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Joined This Week', value: kpiData.joinedThisWeek, icon: <UserPlus size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
    { title: 'Pending Tasks', value: kpiData.pending, icon: <Clock size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
    { title: 'Completed Onboarding', value: kpiData.completed, icon: <CheckCircle size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Completion Rate', value: kpiData.completionRate, trend: 'Overall', icon: <Percent size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
  ];

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>New Joiners</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Manage and track newly joined employees</p>
        </div>
        <div>
          {hasPermission('onboarding', 'new_joiners', 'create') && (
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <Plus size={18} /> Add New Joiner
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(kpi.icon, { size: 18 })}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.title}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', lineHeight: '1' }}>{kpi.value}</div>
              {kpi.trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10B981', background: '#ECFDF5', padding: '4px 8px', borderRadius: '20px', fontWeight: '600' }}>
                  {kpi.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>

        {/* Left Side: Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Joiners List</h3>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search joiner..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '180px', padding: '8px 10px 8px 30px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
                />
              </div>

              <AppDropdown
                value={filterDept}
                onChange={v => setFilterDept(v)}
                options={[{ value: 'All Departments', label: 'All Departments' }, ...departments.map(d => ({ value: String(d.id), label: d.name }))]}
                size="sm"
              />

              <AppDropdown
                value={filterStatus}
                onChange={v => setFilterStatus(v)}
                options={[{ value: 'All Status', label: 'All Status' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Pending', label: 'Pending' }, { value: 'Completed', label: 'Completed' }]}
                size="sm"
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading joiners records...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Employee Name</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Department</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Designation</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Joining Date</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Assigned Checklist</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {joinersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No joiners onboarding found</td>
                    </tr>
                  ) : (
                    joinersList.map((row, index) => {
                      const dateStr = row.joining_date ? new Date(row.joining_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      return (
                        <tr key={row.id} style={{ borderBottom: index === joinersList.length - 1 ? 'none' : '1px solid #F8FAFC', transition: 'background 0.2s', ':hover': { background: '#F8FAFC' } }}>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                {row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('') : 'EM'}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{row.employee_name}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>Buddy: {row.buddy || 'Not Assigned'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.department_name}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.designation}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{dateStr}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.checklist}</td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: getStatusStyle(row.status).bg,
                              color: getStatusStyle(row.status).text
                            }}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#64748B' }}
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === i + 1 ? '#2952E3' : '#FFF', border: page === i + 1 ? 'none' : '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', color: page === i + 1 ? '#FFF' : '#64748B', fontSize: '13px', fontWeight: '500' }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#64748B' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Charts & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Donut Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Onboarding Overview</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px', position: 'relative', flexShrink: 0 }}>
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
                <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', color: '#64748B' }}>Total</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginLeft: '16px' }}>
                {kpiData.chartData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></div>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>{item.value}</span>
                      <span style={{ color: '#94A3B8' }}>({kpiData.total > 0 ? Math.round((item.value / kpiData.total) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Wise Summary */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Department Wise Joiners</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {kpiData.deptData.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>No joiners grouped by department</div>
              ) : (
                kpiData.deptData.map((dept, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{dept.name}</span>
                    <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600' }}>{dept.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add New Employee Onboarding Modal (1100px Standard) */}
      {showAddModal && hasPermission('onboarding', 'new_joiners', 'create') && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add New Employee Onboarding</h2>
                <p className="text-sm text-slate-500 mt-1">Initiate onboarding workflow and checklist for a new joiner.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* Auto Populate section */}
              <div style={{ background: '#EFF6FF', border: '1px dashed #2952E3', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <label className="block text-sm font-semibold text-blue-700 mb-2">Import from Accepted Offer Letters (Optional)</label>
                <AppDropdown
                  value={formData.selectedOfferId}
                  onChange={v => handleOfferChange(v)}
                  options={[{ value: '', label: 'Select Accepted Offer to Auto-Populate' }, ...acceptedOffers.map(o => ({ value: String(o.id), label: `${o.candidate_name} - ${o.job_position}` }))]}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Employee Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })} placeholder="e.g. Rahul Sharma" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.department}
                    onChange={v => setFormData({ ...formData, department: v })}
                    options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: String(d.id), label: d.name }))]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Designation <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Software Developer" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Joining Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reporting Manager <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.reportingManager} onChange={e => setFormData({ ...formData, reportingManager: e.target.value })} placeholder="e.g. Arjun Mehta" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned Checklist <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.checklist}
                    onChange={v => setFormData({ ...formData, checklist: v })}
                    options={[{ value: '', label: 'Select Onboarding Checklist' }, { value: 'Standard Engineering Checklist', label: 'Standard Engineering Checklist' }, { value: 'HR & Admin Checklist', label: 'HR & Admin Checklist' }, { value: 'Executive Management Checklist', label: 'Executive Management Checklist' }]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Buddy / Mentor</label>
                  <input type="text" value={formData.buddy} onChange={e => setFormData({ ...formData, buddy: e.target.value })} placeholder="e.g. Rohan Verma" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{ value: 'In Progress', label: 'In Progress' }, { value: 'Pending', label: 'Pending' }, { value: 'Completed', label: 'Completed' }]}
                    size="sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Starting...' : 'Start Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
