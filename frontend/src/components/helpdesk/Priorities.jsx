import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit, canDelete } from '../../lib/permissions';
import { Search, Plus, Edit2, Trash2, X, Loader2, Zap, RefreshCw, Check } from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Red (Urgent)', value: '#EF4444' },
  { label: 'Orange (High)', value: '#F97316' },
  { label: 'Amber (Medium)', value: '#F59E0B' },
  { label: 'Green (Low)', value: '#10B981' },
  { label: 'Blue (Standard)', value: '#2563EB' },
  { label: 'Purple (Special)', value: '#8B5CF6' },
  { label: 'Pink (Critical)', value: '#EC4899' },
  { label: 'Slate (Default)', value: '#64748B' }
];

const TIME_PRESETS = [
  '30 Mins', '1 Hour', '2 Hours', '4 Hours', '8 Hours', '24 Hours', '48 Hours'
];

export function Priorities() {
  const { addToast } = useToast();
  const [prioritiesList, setPrioritiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    responseTime: '4 Hours',
    color: '#2563EB',
    status: 'Active'
  });

  const fetchPriorities = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/tickets/priorities');
      if (Array.isArray(data)) {
        setPrioritiesList(data);
      }
    } catch (err) {
      console.error("Failed to load priorities:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch('/tickets/priorities', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description,
          responseTime: formData.responseTime,
          color: formData.color,
          status: formData.status
        })
      });
      await fetchPriorities();
      setShowAddModal(false);
      setFormData({ name: '', description: '', responseTime: '4 Hours', color: '#2563EB', status: 'Active' });
      addToast('Priority created successfully!', 'success');
    } catch (err) {
      addToast(err.message || "Failed to create priority", 'error');
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPriority || !formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/tickets/priorities/${editingPriority.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description,
          responseTime: formData.responseTime,
          color: formData.color,
          status: formData.status
        })
      });
      await fetchPriorities();
      setEditingPriority(null);
      setFormData({ name: '', description: '', responseTime: '4 Hours', color: '#2563EB', status: 'Active' });
      addToast('Priority updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || "Failed to update priority", 'error');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete priority "${name}"?`)) return;
    try {
      await apiFetch(`/tickets/priorities/${id}`, { method: 'DELETE' });
      await fetchPriorities();
      addToast('Priority deleted successfully', 'success');
    } catch (err) {
      addToast(err.message || "Failed to delete priority", 'error');
    }
  };

  const openEditModal = (p) => {
    setEditingPriority(p);
    setFormData({
      name: p.name || '',
      description: p.desc || p.description || '',
      responseTime: p.responseTime || '4 Hours',
      color: p.color || '#2563EB',
      status: p.status || 'Active'
    });
  };

  const filteredPriorities = prioritiesList.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.desc && p.desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPriorities.length / itemsPerPage) || 1;
  const paginatedPriorities = filteredPriorities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Priorities</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure ticket SLA targets and urgency classifications</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search priorities..."
              style={{
                height: 38, paddingLeft: 34, paddingRight: 14,
                background: '#FFF', border: '1px solid #E5E7EB',
                borderRadius: 8, fontSize: 13, color: '#111827',
                outline: 'none', width: 220,
              }}
            />
          </div>

          <button
            onClick={fetchPriorities}
            title="Refresh"
            style={{
              height: 38, padding: '0 12px', background: '#FFF', border: '1px solid #E5E7EB',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Primary Action Button */}
          {canCreate('helpdesk', 'helpdesk_priorities') && (
            <button 
              onClick={() => {
                setFormData({ name: '', description: '', responseTime: '4 Hours', color: '#2563EB', status: 'Active' });
                setShowAddModal(true);
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
                background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              }}
            >
              <Plus size={16} /> Add Priority
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN DATA TABLE: Priorities ── */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Priority Name', 'Description', 'Target SLA / Response Time', 'Color Badge', 'Active Tickets', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                    <Loader2 className="animate-spin inline-block mr-2" size={18} /> Loading priorities...
                  </td>
                </tr>
              ) : paginatedPriorities.length > 0 ? (
                paginatedPriorities.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color || '#2563EB', flexShrink: 0 }} />
                        {r.name}
                      </div>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280' }}>{r.desc}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.responseTime}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: r.color }} />
                        <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{r.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#2563EB', whiteSpace: 'nowrap' }}>
                      {r.ticketCount || 0}
                    </td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Active' ? '#ECFDF5' : '#F1F5F9',
                        color: r.status === 'Active' ? '#059669' : '#64748B',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, color: '#6B7280' }}>
                        {canEdit('helpdesk', 'helpdesk_priorities') && (
                          <button 
                            onClick={() => openEditModal(r)}
                            title="Edit Priority"
                            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 4 }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete('helpdesk', 'helpdesk_priorities') && (
                          <button 
                            onClick={() => handleDelete(r.id, r.name)}
                            title="Delete Priority"
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No priorities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Showing {filteredPriorities.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPriorities.length)} of {filteredPriorities.length} entries
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    background: page === currentPage ? '#2563EB' : '#FFF',
                    color: page === currentPage ? '#FFF' : '#374151',
                    fontSize: 12, fontWeight: page === currentPage ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT PRIORITY MODAL ── */}
      {(showAddModal || editingPriority) && (
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
            width: '640px',
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
            {/* Header */}
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
                top: '-30px',
                right: '-30px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
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
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <Zap size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    {editingPriority ? 'Edit Priority Level' : 'Add Priority Level'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Configure response target SLAs and priority badges.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingPriority(null); }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={editingPriority ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                
                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Priority Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Critical P1" 
                    className="hrms-input"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      padding: '0 14px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="hrms-input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', display: 'block', margin: 0 }}>
                      Target Response / Resolution Time <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>Quick SLA Presets</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {TIME_PRESETS.map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, responseTime: preset })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: formData.responseTime === preset ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          border: formData.responseTime === preset ? '1px solid #2563EB' : '1px solid #E2E8F0',
                          background: formData.responseTime === preset ? '#EFF6FF' : '#F8FAFC',
                          color: formData.responseTime === preset ? '#2563EB' : '#475569'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={formData.responseTime} 
                    onChange={e => setFormData({ ...formData, responseTime: e.target.value })} 
                    placeholder="e.g. 4 Hours, 30 Minutes" 
                    className="hrms-input"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      padding: '0 14px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Color Badge
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={formData.color} 
                        onChange={e => setFormData({ ...formData, color: e.target.value })} 
                        style={{ width: '36px', height: '36px', padding: '1px', borderRadius: '8px', border: '1px solid #CBD5E1', cursor: 'pointer', background: '#FFF' }}
                      />
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>{formData.color}</span>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: '#E2E8F0' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                      {PRESET_COLORS.map(c => (
                        <button
                          type="button"
                          key={c.value}
                          onClick={() => setFormData({ ...formData, color: c.value })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            background: c.value,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: formData.color.toLowerCase() === c.value.toLowerCase() ? '0 0 0 2px #FFF, 0 0 0 4px #2563EB' : 'none',
                            cursor: 'pointer',
                            border: 'none'
                          }}
                          title={c.label}
                        >
                          {formData.color.toLowerCase() === c.value.toLowerCase() && (
                            <Check size={13} color="#FFF" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Description
                  </label>
                  <textarea 
                    rows={2} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Criteria for categorizing tickets into this priority..." 
                    className="hrms-input"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Status
                  </label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                    size="md"
                  />
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 28px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPriority(null); }}
                  className="hrms-secondary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: '600',
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
                    color: '#475569',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hrms-btn-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 24px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                    color: '#FFF',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingPriority ? 'Save Changes' : 'Create Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Priorities;
