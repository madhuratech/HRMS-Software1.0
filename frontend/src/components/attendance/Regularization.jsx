import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { canCreate } from '../../lib/permissions';
import { getAvatarUrl } from '../../lib/utils';
import { Search, Filter, Download, Calendar as CalendarIcon, Edit2, Eye, ChevronDown, Check, X, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function Regularization() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

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

  // Form State for new regularization request
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Late Arrival',
    time: '09:30 AM',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadEmployees = async () => {
    try {
      const res = await apiFetch('/employees');
      if (Array.isArray(res)) {
        setEmployees(res.map(e => ({ value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Employee #${e.id}` })));
      }
    } catch (e) {
      console.error("Failed to load employees for dropdown:", e);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/attendance/regularization?status=${activeTab}`);
      if (Array.isArray(res)) {
        setRequests(res);
      }
    } catch (e) {
      console.error("Failed to load regularization requests:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    loadEmployees();
  }, [activeTab]);

  const handleOpenModal = () => {
    const defaultEmpId = isAdminOrHR ? (employees[0]?.value || '') : (currentUser?.employee_id || currentUser?.id || '');
    setFormData({
      employee_id: defaultEmpId,
      date: new Date().toISOString().split('T')[0],
      type: 'Late Arrival',
      time: '09:30 AM',
      reason: ''
    });
    setShowApplyModal(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiFetch(`/attendance/regularization/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await loadRequests();
      addToast(`Regularization request ${newStatus.toLowerCase()} successfully!`, 'success');
    } catch (err) {
      console.error("Failed to update status:", err);
      addToast("Failed to update status", "error");
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      addToast("Please provide a reason for the regularization request.", "error");
      return;
    }

    const effectiveEmpId = isAdminOrHR ? formData.employee_id : (currentUser?.employee_id || currentUser?.id || formData.employee_id);
    const selectedEmp = employees.find(emp => String(emp.value) === String(effectiveEmpId));
    const empName = selectedEmp ? selectedEmp.label : (currentUser?.name || 'Employee');

    setSubmitting(true);
    try {
      const formattedDate = new Date(formData.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      await apiFetch('/attendance/regularization', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: effectiveEmpId,
          employee_name: empName,
          date: formattedDate,
          type: formData.type,
          time: formData.time,
          reason: formData.reason
        })
      });

      setShowApplyModal(false);
      setFormData(prev => ({ ...prev, reason: '' }));
      await loadRequests();
      addToast("Attendance regularization submitted successfully!", "success");
    } catch (err) {
      console.error("Failed to create regularization request:", err);
      addToast("Failed to submit request. Please try again.", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="hrms-content">
      {/* Header and Tabs */}
      <div className="hrms-header" style={{ paddingBottom: '0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Attendance Regularization</h1>
          </div>
          {canCreate('attendance', 'regularization') && (
            <button
              onClick={handleOpenModal}
              className="hrms-primary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563EB' }}
            >
              <Plus size={16} /> Apply Regularization
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', width: '100%', justifyContent: 'flex-start' }}>
          <button
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'pending' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'pending' ? '#2563EB' : '#64748b', fontWeight: activeTab === 'pending' ? '600' : '400', cursor: 'pointer' }}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests
          </button>
          <button
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'approved' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'approved' ? '#2563EB' : '#64748b', fontWeight: activeTab === 'approved' ? '600' : '400', cursor: 'pointer' }}
            onClick={() => setActiveTab('approved')}
          >
            Approved Requests
          </button>
          <button
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'rejected' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'rejected' ? '#2563EB' : '#64748b', fontWeight: activeTab === 'rejected' ? '600' : '400', cursor: 'pointer' }}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected Requests
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '16px' }}>
          <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '160px', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Departments</span>
              <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '160px', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Types</span>
              <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', flex: 1, display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px' }}>
            <div className="hrms-table-container">
              <table className="hrms-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading requests...</td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No {activeTab} regularization requests found.</td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="hrms-user-info">
                            <img src={getAvatarUrl(req.profile_photo || req.avatar, req.employee_name, req.employee_id || req.id)} alt={req.employee_name} className="hrms-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span className="hrms-font-medium hrms-text-primary">{req.employee_name}</span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }} className="hrms-font-medium">{req.date}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{req.type}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{req.reason}</td>
                        <td>
                          <span style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: req.status === 'Approved' ? '#f0fdf4' : req.status === 'Rejected' ? '#fef2f2' : '#fff7ed',
                            color: req.status === 'Approved' ? '#16a34a' : req.status === 'Rejected' ? '#dc2626' : '#ea580c'
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {activeTab === 'pending' && canManageStatus ? (
                              <>
                                <button
                                  title="Approve"
                                  onClick={() => handleUpdateStatus(req.id, 'Approved')}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', color: '#16a34a' }}
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  title="Reject"
                                  onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', color: '#dc2626' }}
                                >
                                  <X size={16} />
                                </button>
                              </>
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

            <div className="hrms-flex-between" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <span className="hrms-text-sm hrms-text-muted">
                Showing {requests.length} entries
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Regularization Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>

            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '20px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'grid', placeItems: 'center', placeContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', flexShrink: 0, lineHeight: 0, padding: 0 }}>
                  <Clock size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    New Regularization Request
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Submit an attendance punch or correction request for approval
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', placeContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s', flexShrink: 0, marginLeft: 'auto', lineHeight: 0, padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateRequest} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF', overflowY: 'auto', flex: 1 }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Employee <span style={{ color: '#EF4444' }}>*</span>
                </label>
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
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '11px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '13.5px',
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Type <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={formData.type}
                    onChange={v => setFormData({ ...formData, type: v })}
                    options={[{ value: 'Late Arrival', label: 'Late Arrival' }, { value: 'Early Exit', label: 'Early Exit' }, { value: 'Missed Punch', label: 'Missed Punch' }, { value: 'On-Duty', label: 'On-Duty' }, { value: 'Absent', label: 'Absent' }]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Regularization Reason <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for regularization request..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', resize: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Notice Banner */}
              <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '12px', padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', fontWeight: '500', lineHeight: '1.4' }}>
                  Regularization requests are sent to reporting manager for verification and attendance update.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  style={{ height: '44px', padding: '0 20px', borderRadius: '11px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ height: '44px', padding: '0 26px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s', opacity: submitting ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)'; }}
                >
                  <CheckCircle2 size={16} />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
