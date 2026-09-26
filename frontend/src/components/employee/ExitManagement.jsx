import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Clock, Briefcase, CheckCircle2, RefreshCw, DollarSign, FileText, Plus, Check, X, LogOut } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getAvatarUrl } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit } from '../../lib/permissions';
import './employee-module.css';

export default function ExitManagement() {
  const { addToast } = useToast();
  const [exits, setExits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExit, setSelectedExit] = useState(null);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [exitType, setExitType] = useState('Resignation');
  const [reason, setReason] = useState('');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/employees/exits");
      if (Array.isArray(data)) {
        setExits(data);
        if (data.length > 0) {
          setSelectedExit(data[0]);
        }
      } else {
        setExits([]);
      }
    } catch (err) {
      console.error(err);
      setExits([]);
    } finally {
      setLoading(false);
    }

    try {
      const empData = await apiFetch("/employees?status=Active");
      if (Array.isArray(empData)) setEmployees(empData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      addToast("Please select an employee", "error");
      return;
    }

    try {
      const res = await apiFetch("/employees/exits", {
        method: "POST",
        body: JSON.stringify({ employeeId, exitType, noticeDate, exitDate, reason })
      });
      if (res && res.error) {
        throw new Error(res.message || "Failed to record exit");
      }
      addToast(res?.message || "Exit process recorded successfully!", "success");
      setShowAddForm(false);
      setEmployeeId('');
      setReason('');
      loadData();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to save exit record", "error");
    }
  };

  const handleSettle = async (exitId) => {
    try {
      const res = await apiFetch(`/employees/exits/${exitId}/settle`, {
        method: "PUT"
      });
      if (res && res.error) {
        throw new Error(res.message || "Settlement failed");
      }
      addToast("Exit settled and employee deactivated!", "success");
      loadData();
    } catch (err) {
      console.error(err);
      addToast("Failed to settle exit", "error");
    }
  };

  const resignedCount = exits.filter(e => e.exit_type === 'Resignation').length;
  const terminatedCount = exits.filter(e => e.exit_type === 'Termination').length;
  const retiredCount = exits.filter(e => e.exit_type === 'Retirement').length;

  return (
    <div className="hrms-content">
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Exit Management</h1>
        {canCreate('employees', 'exit_management') && (
          <button
            className="hrms-primary-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> File Resignation/Termination
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '600px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '22px',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              position: 'relative',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <LogOut size={22} style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    File Employee Exit Process
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Record resignation, termination, or retirement details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
              >
                <X size={18} style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateExit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Select Employee *</label>
                    <AppDropdown
                      value={employeeId}
                      onChange={v => setEmployeeId(v)}
                      options={[
                        { value: '', label: 'Choose Employee...' },
                        ...employees.map(emp => ({
                          value: String(emp.id),
                          label: `${emp.first_name || emp.name || ''} ${emp.last_name || ''} (${emp.employee_code || emp.employeeId || emp.emp_code || `EMP${String(emp.id).padStart(4, '0')}`})`
                        }))
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Exit Type *</label>
                    <AppDropdown
                      value={exitType}
                      onChange={v => setExitType(v)}
                      options={[
                        { value: 'Resignation', label: 'Resignation' },
                        { value: 'Termination', label: 'Termination' },
                        { value: 'Retirement', label: 'Retirement' }
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Notice Date *</label>
                    <input
                      type="date"
                      className="hrms-input"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Last Working Date *</label>
                    <input
                      type="date"
                      className="hrms-input"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                    />
                  </div>
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Reason for Exit *</label>
                  <textarea
                    className="hrms-input"
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter detailed reason for exit or severance notes..."
                    style={{ height: 'auto', borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={() => setShowAddForm(false)}
                  style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hrms-primary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  File Exit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hrms-grid-4 hrms-mb-6">
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Employees Resigned</span>
          <span className="hrms-stat-value hrms-text-primary">{resignedCount}</span>
          <span className="hrms-stat-trend hrms-text-muted">This Year</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Terminated</span>
          <span className="hrms-stat-value hrms-text-danger">{terminatedCount}</span>
          <span className="hrms-stat-trend hrms-text-muted">This Year</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Retired</span>
          <span className="hrms-stat-value" style={{ color: '#f59e0b' }}>{retiredCount}</span>
          <span className="hrms-stat-trend hrms-text-muted">This Year</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Total Processed</span>
          <span className="hrms-stat-value hrms-text-primary">{exits.length}</span>
          <span className="hrms-stat-trend hrms-text-muted">All Time</span>
        </div>
      </div>

      {/* Exit Process Overview Header Card (when an exit is selected) */}
      {selectedExit && (
        <div className="hrms-card hrms-mb-6" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div className="hrms-flex-between hrms-mb-4">
            <h2 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0, color: '#0f172a' }}>
              Exit Process Overview: <span style={{ color: '#2563eb' }}>{selectedExit.employee_name}</span>
            </h2>
            <button
              onClick={() => setSelectedExit(null)}
              className="hrms-secondary-btn"
              style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
            >
              ✕ Close Overview
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div className="hrms-flex-between" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="hrms-flex-start" style={{ gap: '10px' }}>
                <Clock size={16} className="hrms-text-muted" />
                <span className="hrms-text-sm hrms-font-medium">Notice Submitted</span>
              </div>
              <span className="hrms-badge hrms-badge-active">{new Date(selectedExit.notice_date).toLocaleDateString()}</span>
            </div>

            <div className="hrms-flex-between" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="hrms-flex-start" style={{ gap: '10px' }}>
                <Briefcase size={16} className="hrms-text-muted" />
                <span className="hrms-text-sm hrms-font-medium">Exit Type</span>
              </div>
              <span className="hrms-badge hrms-badge-active">{selectedExit.exit_type}</span>
            </div>

            <div className="hrms-flex-between" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="hrms-flex-start" style={{ gap: '10px' }}>
                <CheckCircle2 size={16} className="hrms-text-muted" />
                <span className="hrms-text-sm hrms-font-medium">Clearance</span>
              </div>
              <span className={`hrms-badge ${selectedExit.status === 'Settled' ? 'hrms-badge-active' : 'hrms-badge-pending'}`}>
                {selectedExit.status === 'Settled' ? 'Cleared' : 'Pending'}
              </span>
            </div>

            <div className="hrms-flex-between" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="hrms-flex-start" style={{ gap: '10px' }}>
                <DollarSign size={16} className="hrms-text-muted" />
                <span className="hrms-text-sm hrms-font-medium">Final Settlement</span>
              </div>
              <span className={`hrms-badge ${selectedExit.status === 'Settled' ? 'hrms-badge-active' : 'hrms-badge-inactive'}`}>
                {selectedExit.status}
              </span>
            </div>

            {selectedExit.status === 'Pending' && canEdit('employees', 'exit_management') && (
              <button
                className="hrms-primary-btn"
                onClick={() => handleSettle(selectedExit.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', gridColumn: 'span 1' }}
              >
                <Check size={16} /> Approve & Settle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full Width Recent Exits Table */}
      <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', width: '100%' }}>
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>Recent Exits</h2>
          <span className="hrms-text-sm hrms-text-muted">Click any row to view process details</span>
        </div>
        <div className="hrms-table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="hrms-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Exit Date</th>
                <th>Notice Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading exits...</td>
                </tr>
              ) : exits.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No exits recorded.</td>
                </tr>
              ) : (
                exits.map((exit) => (
                  <tr key={exit.id} onClick={() => setSelectedExit(exit)} style={{ cursor: 'pointer', background: selectedExit?.id === exit.id ? '#f1f5f9' : 'transparent' }}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="hrms-user-info">
                        <img src={getAvatarUrl(exit.profile_photo, exit.employee_name, exit.employee_id)} alt={exit.employee_name} className="hrms-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span className="hrms-font-medium" style={{ color: '#0f172a' }}>{exit.employee_name}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(exit.exit_date).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(exit.notice_date).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{exit.reason || '—'}</td>
                    <td>
                      <span className={`hrms-badge ${exit.status === 'Settled' ? 'hrms-badge-active' : 'hrms-badge-pending'}`}>
                        {exit.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
