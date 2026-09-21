import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { canCreate } from '../../lib/permissions';
import { getAvatarUrl } from '../../lib/utils';
import { Calendar as CalendarIcon, Filter, MoreHorizontal, ChevronDown, Plus, X, Check, Trash2, RotateCcw, Clock } from 'lucide-react';

export default function Overtime() {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [overtimeData, setOvertimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getLoggedInUser = () => {
    try {
      const auth = localStorage.getItem('hrms_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.user || parsed;
      }
    } catch (e) {}
    return null;
  };
  const currentUser = getLoggedInUser();
  const currentRole = String(currentUser?.role || localStorage.getItem('userRole') || 'EMPLOYEE').toUpperCase().replace(/_/g, ' ');
  const isAdminOrHR = currentRole.includes('SUPER') || currentRole === 'SUPER ADMIN' || currentRole === 'ADMIN' || currentRole === 'HR MANAGER' || currentRole === 'HR';
  const isTeamLeader = currentRole === 'TEAM LEADER';
  const canManageStatus = isAdminOrHR || isTeamLeader;

  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '02h 00m',
    reason: ''
  });

  const loadEmployees = async () => {
    try {
      const data = await apiFetch('/employees?status=Active');
      if (Array.isArray(data)) {
        const formatted = data.map(e => ({
          value: e.id,
          label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Employee #${e.id}`
        }));
        setEmployees(formatted);
      }
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
  };

  const loadOvertime = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/attendance/overtime');
      if (Array.isArray(data)) {
        setOvertimeData(data);
      }
    } catch (e) {
      console.error("Failed to load overtime records:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOvertime();
    loadEmployees();
  }, []);

  const handleOpenModal = () => {
    const defaultEmpId = isAdminOrHR ? (employees[0]?.value || '') : (currentUser?.employee_id || currentUser?.id || '');
    setFormData({
      employee_id: defaultEmpId,
      date: new Date().toISOString().split('T')[0],
      hours: '02h 00m',
      reason: ''
    });
    setShowAddModal(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistically update local state for instant UI responsiveness
    setOvertimeData(prev => prev.map(rec => rec.id === id ? { ...rec, status: newStatus } : rec));
    try {
      await apiFetch(`/attendance/overtime/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await loadOvertime();
    } catch (err) {
      console.error("Failed to update status:", err);
      await loadOvertime();
    }
  };

  const handleReset = async (id) => {
    await handleUpdateStatus(id, 'Pending');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this overtime record?")) return;
    setOvertimeData(prev => prev.filter(rec => rec.id !== id));
    try {
      await apiFetch(`/attendance/overtime/${id}`, { method: 'DELETE' });
      await loadOvertime();
    } catch (err) {
      console.error("Failed to delete overtime record:", err);
      await loadOvertime();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const effectiveEmpId = isAdminOrHR ? formData.employee_id : (currentUser?.employee_id || currentUser?.id || formData.employee_id);
    if (!effectiveEmpId || !formData.date || !formData.hours) {
      addToast("Please fill all required fields.", "error");
      return;
    }

    try {
      const selectedEmp = employees.find(emp => String(emp.value) === String(effectiveEmpId));
      const empName = selectedEmp ? selectedEmp.label : (currentUser?.name || 'Employee');
      const formattedDate = new Date(formData.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      await apiFetch('/attendance/overtime', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: effectiveEmpId,
          employee_name: empName,
          date: formattedDate,
          hours: formData.hours,
          reason: formData.reason
        })
      });
      setShowAddModal(false);
      await loadOvertime();
      addToast("Overtime request submitted successfully!", "success");
    } catch (err) {
      console.error("Failed to log overtime:", err);
      addToast("Failed to save overtime record.", "error");
    }
  };

  // Helper calculation functions for KPIs
  const parseOvertimeMinutes = (str) => {
    if (!str) return 0;
    const hMatch = String(str).match(/(\d+)\s*h/i);
    const mMatch = String(str).match(/(\d+)\s*m/i);
    let mins = 0;
    if (hMatch) mins += parseInt(hMatch[1], 10) * 60;
    if (mMatch) mins += parseInt(mMatch[1], 10);
    if (!hMatch && !mMatch) {
      const floatVal = parseFloat(str);
      if (!isNaN(floatVal)) mins = Math.round(floatVal * 60);
    }
    return mins;
  };

  const formatMinutesToHours = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const totalMins = overtimeData.reduce((acc, curr) => acc + parseOvertimeMinutes(curr.hours), 0);
  const pendingMins = overtimeData.filter(d => d.status === 'Pending').reduce((acc, curr) => acc + parseOvertimeMinutes(curr.hours), 0);
  const approvedMins = overtimeData.filter(d => d.status === 'Approved').reduce((acc, curr) => acc + parseOvertimeMinutes(curr.hours), 0);

  return (
    <div className="hrms-content">
      {/* Header and Toolbar */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '16px' }}>
        <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>August 2026</span>
            <CalendarIcon size={16} style={{ color: '#64748b' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '160px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Departments</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '160px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Status</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Filter size={16} /> Filter
          </button>
        </div>
        {canCreate('attendance', 'overtime') && (
          <button
            onClick={handleOpenModal}
            style={{ height: 38, padding: '0 16px', background: '#2563EB', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={15} /> Log Overtime
          </button>
        )}
      </div>

      <div style={{ width: '100%', flex: 1, display: 'flex' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          {/* Dynamic KPI Cards */}
          <div className="hrms-grid-4">
            <div className="hrms-card hrms-stat-card">
              <div className="hrms-text-sm hrms-font-medium hrms-text-muted" style={{ marginBottom: '12px' }}>Total Overtime Hours</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{formatMinutesToHours(totalMins)}</div>
            </div>
            <div className="hrms-card hrms-stat-card">
              <div className="hrms-text-sm hrms-font-medium hrms-text-muted" style={{ marginBottom: '12px' }}>Total Employees</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{employees.length || 1}</div>
            </div>
            <div className="hrms-card hrms-stat-card">
              <div className="hrms-text-sm hrms-font-medium hrms-text-muted" style={{ marginBottom: '12px' }}>Pending Approval</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{formatMinutesToHours(pendingMins)}</div>
            </div>
            <div className="hrms-card hrms-stat-card">
              <div className="hrms-text-sm hrms-font-medium hrms-text-muted" style={{ marginBottom: '12px' }}>Approved Hours</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{formatMinutesToHours(approvedMins)}</div>
            </div>
          </div>

          {/* Main Table */}
          <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
            <div className="hrms-table-container">
              <table className="hrms-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Overtime Hours</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading overtime records...</td>
                    </tr>
                  ) : overtimeData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No overtime records found.</td>
                    </tr>
                  ) : (
                    overtimeData.map((record) => (
                      <tr key={record.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="hrms-user-info">
                            <img src={getAvatarUrl(record.profile_photo || record.avatar, record.employee_name, record.employee_id || record.id)} alt={record.employee_name} className="hrms-avatar" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                            <span className="hrms-font-medium hrms-text-primary">{record.employee_name}</span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{record.date}</td>
                        <td style={{ whiteSpace: 'nowrap' }} className="hrms-font-medium">{record.hours}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{record.reason}</td>
                        <td>
                          <span style={{
                            padding: '6px 16px', 
                            borderRadius: '6px', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            backgroundColor: record.status === 'Approved' ? '#ecfdf5' : record.status === 'Rejected' ? '#fef2f2' : '#fff7ed',
                            color: record.status === 'Approved' ? '#10b981' : record.status === 'Rejected' ? '#dc2626' : '#ea580c'
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            {canManageStatus ? (
                              record.status === 'Pending' ? (
                                <>
                                  <button 
                                    title="Approve Overtime"
                                    onClick={() => handleUpdateStatus(record.id, 'Approved')}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                                      cursor: 'pointer', transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Check size={14} strokeWidth={2.5} /> Approve
                                  </button>
                                  <button 
                                    title="Reject Overtime"
                                    onClick={() => handleUpdateStatus(record.id, 'Rejected')}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                                      cursor: 'pointer', transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <X size={14} strokeWidth={2.5} /> Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    title="Reset Status to Pending"
                                    onClick={() => handleReset(record.id)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
                                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                                      cursor: 'pointer', transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <RotateCcw size={14} strokeWidth={2.5} /> Reset
                                  </button>
                                  <button
                                    title="Delete Record"
                                    onClick={() => handleDelete(record.id)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                                      borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>--</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="hrms-flex-between" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <span className="hrms-text-sm hrms-text-muted">
                Showing {overtimeData.length} entries
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Log Overtime Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '20px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'grid', placeItems: 'center', placeContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', flexShrink: 0, lineHeight: 0, padding: 0 }}>
                  <Clock size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Log Overtime Record
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Record employee overtime hours for payroll calculations
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', placeContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s', flexShrink: 0, marginLeft: 'auto', lineHeight: 0, padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Employee *</label>
                {isAdminOrHR ? (
                  <AppDropdown
                    value={formData.employee_id}
                    options={[{ value: '', label: 'Select Employee' }, ...(employees || [])]}
                    onChange={(val) => setFormData({ ...formData, employee_id: val })}
                    size="sm"
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1E293B',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: '600',
                    boxSizing: 'border-box'
                  }}>
                    {currentUser?.name || currentUser?.first_name || 'My Account'}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Overtime Hours *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 02h 30m"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Reason</label>
                <textarea
                  rows={3}
                  placeholder="Brief reason for overtime..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#2563EB', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
