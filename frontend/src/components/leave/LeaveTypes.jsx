import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, User, Activity, ShieldCheck, Briefcase, Baby, BookOpen, Users, X, Loader2, ShieldAlert, CheckCircle2, Layers, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { usePermissions } from '../../context/PermissionContext';
import { useToast } from '../ui/Toast';

const LEAVE_ICONS = [
  <Briefcase size={18} color="#3b82f6" />,
  <Activity size={18} color="#3b82f6" />,
  <User size={18} color="#3b82f6" />,
  <Baby size={18} color="#3b82f6" />,
  <Users size={18} color="#3b82f6" />,
  <ShieldCheck size={18} color="#3b82f6" />,
  <BookOpen size={18} color="#3b82f6" />
];

const getLeaveIcon = (code, index) => {
  const upper = String(code || '').toUpperCase();
  if (upper === 'CL') return <User size={18} color="#3b82f6" />;
  if (upper === 'SL') return <Activity size={18} color="#3b82f6" />;
  if (upper === 'EL') return <Briefcase size={18} color="#3b82f6" />;
  if (upper === 'ML') return <Baby size={18} color="#3b82f6" />;
  if (upper === 'PL') return <Users size={18} color="#3b82f6" />;
  if (upper === 'BL') return <ShieldCheck size={18} color="#3b82f6" />;
  if (upper === 'COMP') return <BookOpen size={18} color="#3b82f6" />;
  return LEAVE_ICONS[index % LEAVE_ICONS.length];
};

export default function LeaveTypes() {
  const { canView, canCreate, canUpdate, canDelete, loadingPermissions } = usePermissions();
  const { addToast } = useToast();

  const isAllowedView = canView('leave', 'leave_types');
  const isAllowedCreate = canCreate('leave', 'leave_types');
  const isAllowedUpdate = canUpdate('leave', 'leave_types');
  const isAllowedDelete = canDelete('leave', 'leave_types');

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    desc: '',
    maxDays: '',
    carryForward: false,
    requiresApproval: true,
    paidLeave: true,
    status: 'Active'
  });

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/leaves/types');
      const list = Array.isArray(res) ? res : (res?.data || res?.records || []);
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((lt, i) => ({
          id: lt.id,
          name: lt.name || lt.type_name || 'Leave Type',
          code: lt.code || 'LV',
          desc: lt.description || lt.desc || '-',
          max: lt.max_days !== undefined ? lt.max_days : (lt.days_allowed !== undefined ? lt.days_allowed : (lt.maxDays !== undefined ? lt.maxDays : 12)),
          forward: (lt.carry_forward === true || lt.carry_forward === 1 || lt.forward === 'Yes') ? 'Yes' : 'No',
          status: lt.status || 'Active',
          requiresApproval: lt.requires_approval !== undefined ? Boolean(lt.requires_approval) : true,
          paidLeave: lt.is_paid !== undefined ? Boolean(lt.is_paid) : true,
          icon: getLeaveIcon(lt.code, i),
          iconBg: '#eff6ff'
        }));
        setLeaveTypes(formatted);
      } else {
        setLeaveTypes([]);
      }
    } catch (err) {
      console.error("Failed to load leave types from API:", err);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAllowedView) {
      fetchLeaveTypes();
    } else {
      setLeaveTypes([]);
      setLoading(false);
    }
  }, [isAllowedView, fetchLeaveTypes]);

  const handleOpenCreate = () => {
    if (!isAllowedCreate) {
      addToast("Permission Denied: You do not have permission to add leave types.", "error");
      return;
    }
    setEditingId(null);
    setFormError('');
    setIsSubmitting(false);
    setFormData({
      name: '',
      code: '',
      desc: '',
      maxDays: '',
      carryForward: false,
      requiresApproval: true,
      paidLeave: true,
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (type) => {
    if (!isAllowedUpdate) {
      addToast("Permission Denied: You do not have permission to edit leave types.", "error");
      return;
    }
    setEditingId(type.id);
    setFormError('');
    setIsSubmitting(false);
    setFormData({
      name: type.name || '',
      code: type.code || '',
      desc: (type.desc && type.desc !== '-') ? type.desc : '',
      maxDays: type.max !== undefined ? String(type.max) : '',
      carryForward: type.forward === 'Yes',
      requiresApproval: type.requiresApproval !== undefined ? type.requiresApproval : true,
      paidLeave: type.paidLeave !== undefined ? type.paidLeave : true,
      status: type.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.name ? formData.name.trim() : '';
    const cleanCode = formData.code ? formData.code.trim().toUpperCase() : '';
    const days = parseInt(formData.maxDays, 10);

    if (!cleanName) {
      const msg = "Leave Type Name is required.";
      setFormError(msg);
      addToast(msg, "error");
      return;
    }
    if (!cleanCode) {
      const msg = "Leave Code is required.";
      setFormError(msg);
      addToast(msg, "error");
      return;
    }
    if (isNaN(days) || days < 0) {
      const msg = "Please enter a valid Maximum Days number.";
      setFormError(msg);
      addToast(msg, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (!isAllowedUpdate) {
          addToast("Permission Denied: You do not have permission to edit leave types.", "error");
          setIsSubmitting(false);
          return;
        }
        const payload = {
          ...formData,
          name: cleanName,
          code: cleanCode,
          maxDays: days
        };
        const res = await apiFetch(`/leaves/types/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res && (res.success || !res.error)) {
          addToast(res.message || "Leave type updated successfully!", "success");
          setShowModal(false);
          setEditingId(null);
          await fetchLeaveTypes();
        } else {
          const errMsg = res?.message || res?.error || "Failed to update leave type.";
          setFormError(errMsg);
          addToast(errMsg, "error");
        }
      } else {
        if (!isAllowedCreate) {
          addToast("Permission Denied: You do not have permission to create leave types.", "error");
          setIsSubmitting(false);
          return;
        }
        const payload = {
          ...formData,
          name: cleanName,
          code: cleanCode,
          maxDays: days
        };
        const res = await apiFetch('/leaves/types', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res && (res.success || res.id)) {
          addToast(res.message || "Leave type added successfully!", "success");
          setShowModal(false);
          setFormData({
            name: '',
            code: '',
            desc: '',
            maxDays: '',
            carryForward: false,
            requiresApproval: true,
            paidLeave: true,
            status: 'Active'
          });
          await fetchLeaveTypes();
        } else {
          const errMsg = res?.message || res?.error || "Failed to create leave type.";
          setFormError(errMsg);
          addToast(errMsg, "error");
        }
      }
    } catch (err) {
      console.error("Failed to save leave type:", err);
      const errMsg = err.message || "An unexpected error occurred.";
      setFormError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAllowedDelete) {
      addToast("Permission Denied: You do not have permission to delete leave types.", "error");
      return;
    }
    if (window.confirm("Are you sure you want to delete this leave type?")) {
      try {
        const res = await apiFetch(`/leaves/types/${id}`, { method: 'DELETE' });
        if (res && (res.success || !res.error)) {
          addToast(res.message || "Leave type deleted successfully", "success");
          setLeaveTypes(prev => prev.filter(t => t.id !== id));
        } else {
          addToast(res?.message || res?.error || "Failed to delete leave type", "error");
        }
      } catch (err) {
        console.error("Failed to delete leave type:", err);
        addToast(err.message || "Failed to delete leave type", "error");
      }
    }
  };

  if (loadingPermissions) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#64748b' }}>
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span>Verifying access permissions...</span>
      </div>
    );
  }

  if (!isAllowedView) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>Access Denied</h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>You do not have permission to view Leave Types. Please contact your administrator.</p>
      </div>
    );
  }

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', padding: '24px', width: '100%' }}>
      {isAllowedCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            onClick={handleOpenCreate}
            style={{
              background: '#2952E3',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Add Leave Type
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9' }}>Leave Type</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9' }}>Description</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'center', whiteSpace: 'nowrap' }}>Short Code</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'center', whiteSpace: 'nowrap' }}>Max Days</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'center', whiteSpace: 'nowrap' }}>Carry Forward</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Status</th>
                  {(isAllowedUpdate || isAllowedDelete) && (
                    <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={(isAllowedUpdate || isAllowedDelete) ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading Leave Types…
                    </td>
                  </tr>
                ) : leaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={(isAllowedUpdate || isAllowedDelete) ? 7 : 6} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Layers size={36} color="#94a3b8" />
                        <span style={{ fontWeight: '600', color: '#334155', fontSize: '15px' }}>No leave types configured</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No leave categories found. Click &quot;Add Leave Type&quot; above to create one.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaveTypes.map((type, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === leaveTypes.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: type.iconBg || '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {type.icon || <Briefcase size={18} color="#3b82f6" />}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>{type.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b', whiteSpace: 'normal', maxWidth: '280px' }}>{type.desc}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>{type.code}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>{type.max}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>{type.forward}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: type.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                          color: type.status === 'Active' ? '#10b981' : '#ef4444',
                          border: `1px solid ${type.status === 'Active' ? '#d1fae5' : '#fee2e2'}`
                        }}>
                          {type.status}
                        </span>
                      </td>
                      {(isAllowedUpdate || isAllowedDelete) && (
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {isAllowedUpdate && (
                              <button
                                onClick={() => handleOpenEdit(type)}
                                title="Edit Leave Type"
                                style={{
                                  background: '#eff6ff',
                                  border: '1px solid #dbeafe',
                                  borderRadius: '6px',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#3b82f6',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            {isAllowedDelete && (
                              <button
                                onClick={() => handleDelete(type.id)}
                                title="Delete Leave Type"
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  borderRadius: '6px',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (editingId ? isAllowedUpdate : isAllowedCreate) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '640px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '20px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'grid', placeItems: 'center', placeContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', flexShrink: 0, lineHeight: 0, padding: 0 }}>
                  <Layers size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {editingId ? 'Edit Leave Type' : 'Add Leave Type'}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {editingId ? 'Update existing leave category policy parameters' : 'Configure a new leave category and policy parameters'}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', placeContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s', flexShrink: 0, marginLeft: 'auto', lineHeight: 0, padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF', overflowY: 'auto', flex: 1 }}>

              {formError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  color: '#DC2626',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: '500' }}>{formError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Leave Type Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Casual Leave" 
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Leave Code <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.code} 
                    onChange={e => setFormData({ ...formData, code: e.target.value })} 
                    placeholder="e.g. CL" 
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Maximum Days Allowed <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formData.maxDays} 
                    onChange={e => setFormData({ ...formData, maxDays: e.target.value })} 
                    placeholder="e.g. 12" 
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Carry Forward</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, carryForward: opt.val })}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '11px',
                          border: formData.carryForward === opt.val ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                          background: formData.carryForward === opt.val ? '#EFF6FF' : '#FAFBFC',
                          color: formData.carryForward === opt.val ? '#1D4ED8' : '#64748B',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Requires Approval</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, requiresApproval: opt.val })}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '11px',
                          border: formData.requiresApproval === opt.val ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                          background: formData.requiresApproval === opt.val ? '#EFF6FF' : '#FAFBFC',
                          color: formData.requiresApproval === opt.val ? '#1D4ED8' : '#64748B',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Paid Leave</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, paidLeave: opt.val })}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '11px',
                          border: formData.paidLeave === opt.val ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                          background: formData.paidLeave === opt.val ? '#EFF6FF' : '#FAFBFC',
                          color: formData.paidLeave === opt.val ? '#1D4ED8' : '#64748B',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Description</label>
                <textarea 
                  value={formData.desc} 
                  onChange={e => setFormData({ ...formData, desc: e.target.value })} 
                  placeholder="Enter leave description..." 
                  style={{ width: '100%', height: '80px', padding: '12px 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', resize: 'none', boxSizing: 'border-box' }} 
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Status <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Active', 'Inactive'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st })}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '9999px',
                        border: formData.status === st ? (st === 'Active' ? '1.5px solid #10B981' : '1.5px solid #64748B') : '1.5px solid #E2E8F0',
                        background: formData.status === st ? (st === 'Active' ? '#ECFDF5' : '#F1F5F9') : '#FAFBFC',
                        color: formData.status === st ? (st === 'Active' ? '#047857' : '#334155') : '#64748B',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setFormError('');
                  }} 
                  style={{ height: '44px', padding: '0 20px', borderRadius: '11px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    height: '44px',
                    padding: '0 26px',
                    borderRadius: '11px',
                    border: 'none',
                    background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)'; }}
                  onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)'; }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{editingId ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{editingId ? 'Update Leave Type' : 'Save Leave Type'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
