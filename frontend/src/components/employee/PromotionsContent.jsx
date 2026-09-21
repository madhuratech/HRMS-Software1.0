import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { MoreVertical, ChevronLeft, ChevronRight, Plus, Check, X, Award, CheckCircle2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getAvatarUrl } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit } from '../../lib/permissions';
import './employee-module.css';

export default function PromotionsContent() {
  const { addToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [newDesignationId, setNewDesignationId] = useState('');
  const [newDesignationName, setNewDesignationName] = useState('Senior Developer');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Load promotions list, employees dropdown, and designations dropdown
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/employees/promotions");
      if (Array.isArray(data)) {
        setPromotions(data);
      } else {
        setPromotions([]);
      }
    } catch (err) {
      console.error(err);
      setPromotions([]);
    } finally {
      setLoading(false);
    }

    try {
      const empData = await apiFetch("/employees?status=Active");
      if (Array.isArray(empData)) setEmployees(empData);
    } catch (err) {
      console.error(err);
    }

    try {
      const desigData = await apiFetch("/employees/lookup/designations");
      if (Array.isArray(desigData) && desigData.length > 0) {
        setDesignations(desigData);
      } else {
        const orgDesigData = await apiFetch("/organization/designations");
        if (Array.isArray(orgDesigData)) setDesignations(orgDesigData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPromotion = async (e) => {
    e.preventDefault();
    if (!employeeId || (!newDesignationName && !newDesignationId)) {
      addToast("Please select an employee and promotion designation", "error");
      return;
    }

    try {
      const res = await apiFetch("/employees/promotions", {
        method: "POST",
        body: JSON.stringify({ employeeId, newDesignationId, newDesignationName, effectiveDate })
      });
      if (res && res.error) {
        throw new Error(res.message || "Failed to submit request");
      }
      addToast(res?.message || "Promotion request submitted successfully!", "success");
      setShowAddForm(false);
      setEmployeeId('');
      setNewDesignationId('');
      loadData();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to submit promotion request", "error");
    }
  };

  const handleApprove = async (promoId) => {
    try {
      const res = await apiFetch(`/employees/promotions/${promoId}/approve`, {
        method: "PUT",
        body: JSON.stringify({ approverId: 1 }) // Default Admin
      });
      if (res && res.error) {
        throw new Error(res.message || "Approval failed");
      }
      addToast("Promotion approved and employee record updated!", "success");
      loadData();
    } catch (err) {
      console.error(err);
      addToast("Failed to approve promotion", "error");
    }
  };

  const pendingCount = promotions.filter(p => p.status === 'Pending').length;
  const approvedCount = promotions.filter(p => p.status === 'Approved').length;

  return (
    <div className="hrms-content">
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Promotions</h1>
        {canCreate('employees', 'promotions') && (
          <button 
            className="hrms-primary-btn" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Request Promotion
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
            width: '580px',
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
                  <Award size={22} style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    Request Employee Promotion
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Submit a formal promotion proposal for HR and management review
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
            <form onSubmit={handleRequestPromotion} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Select Employee *</label>
                  <AppDropdown
                    value={employeeId}
                    onChange={v => setEmployeeId(v)}
                    options={[
                      { value: '', label: 'Choose Employee...' },
                      ...employees.map(emp => ({
                        value: String(emp.id),
                        label: `${emp.first_name || emp.name || ''} ${emp.last_name || ''} (EMP${String(emp.id).padStart(4, '0')})`
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>New Designation *</label>
                  <AppDropdown
                    value={newDesignationId ? String(newDesignationId) : newDesignationName}
                    onChange={(val) => {
                      const match = designations.find(d => String(d.id) === String(val));
                      if (match) {
                        setNewDesignationId(match.id);
                        setNewDesignationName(match.role_name || match.name || val);
                      } else {
                        setNewDesignationName(val);
                      }
                    }}
                    options={[
                      ...(designations.length > 0
                        ? designations.map(d => ({
                          value: String(d.id),
                          label: d.role_name || d.name || `Designation #${d.id}`
                        }))
                        : [
                          { value: 'Software Engineer', label: 'Software Engineer' },
                          { value: 'Senior Developer', label: 'Senior Developer' },
                          { value: 'Branch Manager', label: 'Branch Manager' },
                          { value: 'Sales Manager', label: 'Sales Manager' },
                          { value: 'Team Leader', label: 'Team Leader' }
                        ])
                    ]}
                    size="sm"
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Effective Date *</label>
                  <input
                    type="date"
                    className="hrms-input"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hrms-grid-4 hrms-mb-6">
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Total Promotions</span>
          <span className="hrms-stat-value hrms-text-primary">{promotions.length}</span>
          <span className="hrms-stat-trend hrms-text-muted">All Time</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Pending approval</span>
          <span className="hrms-stat-value" style={{ color: '#d97706' }}>{pendingCount}</span>
          <span className="hrms-stat-trend hrms-text-muted">Requires action</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Approved</span>
          <span className="hrms-stat-value" style={{ color: '#10b981' }}>{approvedCount}</span>
          <span className="hrms-stat-trend hrms-text-success">Completed</span>
        </div>
        <div className="hrms-card hrms-stat-card">
          <span className="hrms-stat-title">Avg. Salary Increase</span>
          <span className="hrms-stat-value hrms-text-primary">15%</span>
          <span className="hrms-stat-trend hrms-text-muted">Estimate</span>
        </div>
      </div>

      <div className="hrms-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="hrms-table-container">
          <table className="hrms-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Current Position</th>
                <th>New Position</th>
                <th>Effective Date</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading promotions...</td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No promotion records found.</td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="hrms-user-info">
                        <img src={getAvatarUrl(promo.profile_photo, promo.employee_name, promo.employee_id)} alt={promo.employee_name} className="hrms-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span className="hrms-font-medium" style={{ color: '#0f172a' }}>{promo.employee_name}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{promo.old_designation || 'Staff'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{promo.new_designation}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(promo.effective_date).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{promo.approved_by_name || '—'}</td>
                    <td>
                      <span className={`hrms-badge ${promo.status === 'Approved' ? 'hrms-badge-active' : promo.status === 'Rejected' ? 'hrms-badge-inactive' : 'hrms-badge-pending'}`}>
                        {promo.status}
                      </span>
                    </td>
                    <td>
                      {promo.status === 'Pending' ? (
                        canEdit('employees', 'promotions') ? (
                          <button
                            className="hrms-primary-btn"
                            onClick={() => handleApprove(promo.id)}
                            style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={12} /> Approve
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Pending</span>
                        )
                      ) : (
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                          <MoreVertical size={18} />
                        </button>
                      )}
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
