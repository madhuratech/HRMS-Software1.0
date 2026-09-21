import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { UserCheck, Clock, AlertTriangle, Award, Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function Probation() {
  const { addToast } = useToast();
  const [probationList, setProbationList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');

  // KPI States
  const [kpiData, setKpiData] = useState({
    underProbation: 0,
    dueReview: 0,
    extended: 0,
    confirmed: 0,
    total: 0,
    timelineData: [],
    chartData: [
      { name: 'Confirmed', value: 0, color: '#2952E3' },
      { name: 'Due for Review', value: 0, color: '#10B981' },
      { name: 'Extended', value: 0, color: '#EF4444' }
    ]
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    startDate: '',
    endDate: '',
    manager: '',
    status: 'Due for Review',
    rating: '3 - Satisfactory',
    remarks: ''
  });

  const fetchMeta = async () => {
    try {
      const empData = await apiFetch('/employees');
      if (Array.isArray(empData)) {
        setEmployees(empData);
      } else if (empData && empData.data && Array.isArray(empData.data)) {
        setEmployees(empData.data);
      }
    } catch (err) {
      console.error('Failed to load probation metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const resData = await apiFetch('/probations/dashboard');
      if (resData && resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchProbations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/probations?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const resData = await apiFetch(url);
      if (resData && resData.success && resData.data) {
        setProbationList(resData.data.probations || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to fetch probation records', 'error');
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
    fetchProbations();
    fetchDashboardStats();
  }, [page, fetchProbations, fetchDashboardStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0' };
      case 'Due for Review': return { bg: '#FFFBEB', text: '#F59E0B', border: '#FDE68A' };
      case 'Extended': return { bg: '#FEF2F2', text: '#EF4444', border: '#FECACA' };
      default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.startDate || !formData.endDate || !formData.manager) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(formData.employee_id),
        probation_start_date: formData.startDate,
        probation_end_date: formData.endDate,
        reporting_manager: formData.manager.trim(),
        status: formData.status,
        rating: formData.rating,
        remarks: formData.remarks.trim()
      };

      const resData = await apiFetch('/probations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (resData && resData.success) {
        addToast('Probation record created successfully!', 'success');
        setShowAddModal(false);
        setFormData({ employee_id: '', startDate: '', endDate: '', manager: '', status: 'Due for Review', rating: '3 - Satisfactory', remarks: '' });
        fetchProbations();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to create probation record', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (probationId) => {
    try {
      const resData = await apiFetch(`/probations/${probationId}/complete`, {
        method: 'PUT'
      });
      if (resData && resData.success) {
        addToast('Employee probation completed successfully and Confirmed!', 'success');
        fetchProbations();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to complete probation', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleExtend = async (probationId) => {
    const newDate = window.prompt('Enter new Probation End Date (YYYY-MM-DD):');
    if (!newDate) return;

    try {
      const resData = await apiFetch(`/probations/${probationId}/extend`, {
        method: 'PUT',
        body: JSON.stringify({ probation_end_date: newDate })
      });
      if (resData && resData.success) {
        addToast('Probation period extended successfully!', 'success');
        fetchProbations();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to extend probation', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const selectedEmployee = employees.find(e => e.id === parseInt(formData.employee_id));
  const totalPages = Math.ceil(total / limit) || 1;

  const kpis = [
    { title: 'Under Probation', value: kpiData.underProbation, icon: <UserCheck size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
    { title: 'Due for Review', value: kpiData.dueReview, icon: <Clock size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
    { title: 'Extended Probation', value: kpiData.extended, icon: <AlertTriangle size={20} color="#EF4444" />, bgColor: '#FEF2F2' },
    { title: 'Confirmed Attendees', value: kpiData.confirmed, icon: <Award size={20} color="#10B981" />, bgColor: '#ECFDF5' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>
      
      {/* Add Probation Modal (1100px Standard) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Probation Evaluation</h2>
                <p className="text-sm text-slate-500 mt-1">Record probation assessment and confirmation milestones.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Employee <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.employee_id}
                    onChange={v => setFormData({ ...formData, employee_id: v })}
                    options={[
                      { value: '', label: 'Select Employee' },
                      ...employees.map(e => ({
                        value: String(e.id),
                        label: `${e.name}${e.employee_code || e.emp_id ? ` (${e.employee_code || e.emp_id})` : ` (EMP${String(e.id).padStart(4, '0')})`}${e.dept_name ? ` - ${e.dept_name}` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                {selectedEmployee && (
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <div><strong>Department:</strong> {selectedEmployee.branch_name}</div>
                    <div><strong>Designation:</strong> {selectedEmployee.role_name}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Probation Start Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Review / End Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reporting Manager <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} placeholder="e.g. Arjun Mehta" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Probation Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{value:'Due for Review',label:'Due for Review'},{value:'Confirmed',label:'Confirmed'},{value:'Extended',label:'Extended'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rating</label>
                  <AppDropdown
                    value={formData.rating}
                    onChange={v => setFormData({ ...formData, rating: v })}
                    options={[{value:'5 - Outstanding',label:'5 - Outstanding'},{value:'4 - Exceeds Expectations',label:'4 - Exceeds Expectations'},{value:'3 - Satisfactory',label:'3 - Satisfactory'},{value:'2 - Needs Improvement',label:'2 - Needs Improvement'},{value:'1 - Unsatisfactory',label:'1 - Unsatisfactory'}]}
                    size="sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Performance Assessment & Remarks</label>
                  <textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Key feedback, performance observations during probation..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Probation</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Track probation period and confirmations</p>
        </div>
        <div>
          {hasPermission('onboarding', 'probation', 'create') && (
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <Plus size={18} /> Add Probation
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginBottom: '4px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '700' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Probation Tracker</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '220px', padding: '8px 10px 8px 30px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading probation records...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Department</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Probation Start</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Probation End Date</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Reporting Manager</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {probationList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No probation records found</td>
                    </tr>
                  ) : (
                    probationList.map((row, index) => {
                      const startDateStr = row.probation_start_date ? new Date(row.probation_start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      const endDateStr = row.probation_end_date ? new Date(row.probation_end_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      return (
                        <tr key={row.id} style={{ borderBottom: index === probationList.length - 1 ? 'none' : '1px solid #F8FAFC', transition: 'background 0.2s', ':hover': { background: '#F8FAFC' } }}>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                {row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('') : 'EM'}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{row.employee_name}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>EMP{String(row.employee_id).padStart(3, '0')}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.department_name}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{startDateStr}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1E293B', fontWeight: '500', whiteSpace: 'nowrap' }}>{endDateStr}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.reporting_manager}</td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              backgroundColor: getStatusStyle(row.status).bg, 
                              color: getStatusStyle(row.status).text,
                              border: `1px solid ${getStatusStyle(row.status).border}`
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            {row.status !== 'Confirmed' && (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => handleComplete(row.id)}
                                  style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Confirm Employee
                                </button>
                                <button 
                                  onClick={() => handleExtend(row.id)}
                                  style={{ background: '#FFFBEB', border: '1px solid #F59E0B', color: '#F59E0B', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Extend
                                </button>
                              </div>
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
          
          {/* Probation Summary Donut Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Probation Summary</h3>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '500' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></div>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>{item.value}</span>
                      <span style={{ color: '#94A3B8' }}>({kpiData.total > 0 ? Math.round((item.value/kpiData.total)*100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Summary */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Review Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kpiData.timelineData.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>No upcoming reviews timeline</div>
              ) : (
                kpiData.timelineData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{item.month}</span>
                    <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '600' }}>{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
