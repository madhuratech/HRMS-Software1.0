import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Plus, Laptop, CheckCircle, Clock, HardDrive, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function AssetAllocation() {
  const { addToast } = useToast();
  const [assetsList, setAssetsList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');

  // KPI Dashboard Stats
  const [kpiData, setKpiData] = useState({
    total: 0,
    allocated: 0,
    pending: 0,
    available: 0,
    summaryData: [],
    chartData: [
      { name: 'Allocated', value: 0, color: '#2952E3' },
      { name: 'Pending', value: 0, color: '#F59E0B' },
      { name: 'Returned', value: 0, color: '#64748B' }
    ]
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    asset_id: '',
    allocationDate: '',
    assignedBy: '',
    status: 'Allocated',
    description: ''
  });

  const fetchMeta = async () => {
    try {
      // Fetch active employees
      const empData = await apiFetch('/employees');
      if (Array.isArray(empData)) {
        setEmployees(empData);
      } else if (empData && empData.data && Array.isArray(empData.data)) {
        setEmployees(empData.data);
      }

      // Fetch available assets
      const assetData = await apiFetch('/assets/available');
      if (assetData && assetData.success && assetData.data) {
        setAvailableAssets(assetData.data);
      }
    } catch (err) {
      console.error('Failed to load asset allocation metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const resData = await apiFetch('/assets/dashboard');
      if (resData && resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/assets?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const resData = await apiFetch(url);
      if (resData && resData.success && resData.data) {
        setAssetsList(resData.data.allocations || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to fetch asset allocations', 'error');
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
    fetchAllocations();
    fetchDashboardStats();
  }, [page, fetchAllocations, fetchDashboardStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Allocated': return { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0' };
      case 'Pending': return { bg: '#FFFBEB', text: '#F59E0B', border: '#FDE68A' };
      case 'Returned': return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
      default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.asset_id || !formData.allocationDate || !formData.assignedBy) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(formData.employee_id),
        asset_id: parseInt(formData.asset_id),
        allocation_date: formData.allocationDate,
        assigned_by: formData.assignedBy.trim(),
        status: formData.status,
        description: formData.description.trim()
      };

      const resData = await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (resData && resData.success) {
        addToast('Asset allocated successfully!', 'success');
        setShowAddModal(false);
        setFormData({ employee_id: '', asset_id: '', allocationDate: '', assignedBy: '', status: 'Allocated', description: '' });
        fetchAllocations();
        fetchDashboardStats();
        fetchMeta();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to allocate asset', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (allocationId) => {
    if (!window.confirm('Are you sure you want to mark this asset as returned?')) return;
    
    try {
      const resData = await apiFetch(`/assets/${allocationId}/return`, {
        method: 'PUT'
      });
      if (resData && resData.success) {
        addToast('Asset returned successfully!', 'success');
        fetchAllocations();
        fetchDashboardStats();
        fetchMeta();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to return asset', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const selectedAsset = availableAssets.find(a => a.id === parseInt(formData.asset_id));
  const selectedEmployee = employees.find(e => e.id === parseInt(formData.employee_id));
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>
      
      {/* Allocate Asset Modal (1100px Standard) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Allocate Asset</h2>
                <p className="text-sm text-slate-500 mt-1">Assign company hardware and devices to new employees.</p>
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
                    <div><strong>Department:</strong> {selectedEmployee.branch_name || selectedEmployee.dept_name}</div>
                    <div><strong>Designation:</strong> {selectedEmployee.role_name}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.asset_id}
                    onChange={v => setFormData({ ...formData, asset_id: v })}
                    options={[
                      { value: '', label: 'Select Available Asset' },
                      ...availableAssets.map(a => ({
                        value: String(a.id),
                        label: `${a.asset_name || a.name || a.asset_type} (${a.serial_number || a.asset_code || `AST${a.id}`})`
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                {selectedAsset && (
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <div><strong>Asset Type:</strong> {selectedAsset.asset_type}</div>
                    <div><strong>Serial Number:</strong> {selectedAsset.serial_number}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allocation Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.allocationDate} onChange={e => setFormData({ ...formData, allocationDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned By <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.assignedBy} onChange={e => setFormData({ ...formData, assignedBy: e.target.value })} placeholder="e.g. IT Admin Team" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{value:'Allocated',label:'Allocated'},{value:'Pending',label:'Pending'}]}
                    size="sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Notes</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Asset condition, warranty, accessories provided..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Asset Allocation</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Allocate and track assets for new employees</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { title: 'Total Assets', value: kpiData.total, icon: <Laptop size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
          { title: 'Allocated Assets', value: kpiData.allocated, icon: <CheckCircle size={20} color="#10B981" />, bgColor: '#ECFDF5' },
          { title: 'Pending Allocation', value: kpiData.pending, icon: <Clock size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
          { title: 'Available Assets', value: kpiData.available, icon: <HardDrive size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
        ].map((kpi, idx) => (
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
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
            <div style={{ display: 'flex', gap: '12px' }}>
              {hasPermission('onboarding', 'asset_allocation', 'create') && (
                <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                  <Plus size={16} /> Allocate Asset
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading asset allocations...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Department</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Asset Allocated</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Allocated On</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Allocated By</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No asset allocations found</td>
                    </tr>
                  ) : (
                    assetsList.map((row, index) => {
                      const allocDate = row.allocation_date ? new Date(row.allocation_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      return (
                        <tr key={row.id} style={{ borderBottom: index === assetsList.length - 1 ? 'none' : '1px solid #F8FAFC', transition: 'background 0.2s', ':hover': { background: '#F8FAFC' } }}>
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
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#2952E3', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.asset_name}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{allocDate}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.assigned_by}</td>
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
                            {row.status !== 'Returned' && hasPermission('onboarding', 'asset_allocation', 'edit') && (
                              <button 
                                onClick={() => handleReturn(row.id)}
                                style={{ background: '#EFF6FF', border: '1px solid #2952E3', color: '#2952E3', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Return Asset
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
          
          {/* Asset Summary */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Asset Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kpiData.summaryData.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>No asset breakdown records</div>
              ) : (
                kpiData.summaryData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '600' }}>{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allocation Status Donut Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Asset Allocation Status</h3>
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

        </div>
      </div>

    </div>
  );
}
