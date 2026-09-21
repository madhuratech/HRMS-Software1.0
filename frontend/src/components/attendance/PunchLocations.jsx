import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import {
  Search, Plus, Edit2, Trash2, Eye, MapPin, Check, X, ShieldAlert,
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { canCreate } from '../../lib/permissions';
import GeofenceMap from './GeofenceMap';

export default function PunchLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    latitude: 12.9716,
    longitude: 77.5946,
    radius: 100,
    address: '',
    description: '',
    status: 'Active'
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/attendance/punch-locations?search=${search}&status=${statusFilter}&page=${page}&limit=${limit}`);
      if (res.success) {
        setLocations(res.locations || []);
        setTotal(res.total || 0);
      } else {
        showToast(res.message || 'Failed to load locations', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend API', 'error');
    }
    setLoading(false);
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      branch: '',
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 100,
      address: '',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = (loc) => {
    setModalMode('edit');
    setSelectedLocation(loc);
    setFormData({
      name: loc.name,
      branch: loc.branch || '',
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      radius: parseInt(loc.radius),
      address: loc.address || '',
      description: loc.description || '',
      status: loc.status
    });
    setShowModal(true);
  };

  const openViewModal = (loc) => {
    setModalMode('view');
    setSelectedLocation(loc);
    setFormData({
      name: loc.name,
      branch: loc.branch || '',
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      radius: parseInt(loc.radius),
      address: loc.address || '',
      description: loc.description || '',
      status: loc.status
    });
    setShowModal(true);
  };

  const handleMapChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.latitude || !formData.longitude || !formData.radius) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      let res;
      if (modalMode === 'add') {
        res = await apiFetch('/attendance/punch-locations', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      } else {
        res = await apiFetch(`/attendance/punch-locations/${selectedLocation.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      }

      if (res.success) {
        showToast(
          modalMode === 'add'
            ? 'Punch location added successfully'
            : 'Punch location updated successfully'
        );
        setShowModal(false);
        loadLocations();
      } else {
        showToast(res.message || 'Failed to save location', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this punch location? This cannot be undone.')) {
      return;
    }

    try {
      const res = await apiFetch(`/attendance/punch-locations/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showToast('Punch location deleted successfully');
        loadLocations();
      } else {
        showToast(res.message || 'Failed to delete location', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    }
  };

  const handleToggleStatus = async (loc) => {
    const newStatus = loc.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await apiFetch(`/attendance/punch-locations/${loc.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        showToast(`Location status updated to ${newStatus}`);
        loadLocations();
      } else {
        showToast(res.message || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: '#FFF', padding: '12px 24px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header and Action toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Punch Locations (Geofencing)</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure office geofences to validate employee punches</p>
        </div>

        {canCreate('attendance', 'punch_locations') && (
          <button
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Location
          </button>
        )}
      </div>

      {/* Filters Card */}
      <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by name, branch, or address..."
            value={search}
            onChange={handleSearchChange}
            style={{ width: '100%', height: 38, padding: '0 12px 0 38px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}
          />
        </div>

        <div style={{ width: 160 }}>
          <AppDropdown value={statusFilter} onChange={handleStatusFilterChange} options={[{value:'',label:'All Status'},{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} size="sm" />
        </div>
      </div>

      {/* Locations Table */}
      <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Location Name</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Branch</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Coordinates</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Radius</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Address</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading locations...</td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No office punch locations found.</td>
                </tr>
              ) : (
                locations.map(loc => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{loc.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>{loc.branch || 'N/A'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#4B5563', fontFamily: 'monospace' }}>
                      {parseFloat(loc.latitude).toFixed(5)}, {parseFloat(loc.longitude).toFixed(5)}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                        {loc.radius}m
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {loc.address || '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleToggleStatus(loc)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                          borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                          background: loc.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                          color: loc.status === 'Active' ? '#059669' : '#DC2626'
                        }}
                      >
                        {loc.status === 'Active' ? <Check size={12} /> : <X size={12} />}
                        {loc.status}
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => openViewModal(loc)}
                          title="View location map"
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => openEditModal(loc)}
                          title="Edit details"
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          title="Delete Location"
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Showing Page {page} of {totalPages} ({total} locations)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFF', color: page === 1 ? '#C7D2FE' : '#4B5563', cursor: page === 1 ? 'default' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFF', color: page === totalPages ? '#C7D2FE' : '#4B5563', cursor: page === totalPages ? 'default' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Add / Edit / View Geofence */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#FFF', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.8)', width: '90%', maxWidth: 940, height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)' }}>
            
            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '20px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'grid', placeItems: 'center', placeContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', flexShrink: 0, lineHeight: 0, padding: 0 }}>
                  <MapPin size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {modalMode === 'add' && 'Create Geofence Location'}
                    {modalMode === 'edit' && 'Edit Geofence Location'}
                    {modalMode === 'view' && `View ${formData.name}`}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Define GPS boundaries and allowed punch radius for attendance
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

            {/* Modal Body */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden' }}>
              
              {/* Form Side */}
              <form onSubmit={handleFormSubmit} style={{ padding: '24px 28px', borderRight: '1px solid #E2E8F0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Location Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'view'}
                    placeholder="e.g. Headquarters"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Branch / Division</label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    placeholder="e.g. Bangalore Corporate"
                    value={formData.branch}
                    onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                    style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Latitude <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.latitude}
                      onChange={e => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Longitude <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.longitude}
                      onChange={e => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Allowed Radius (Meters) <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="25"
                      disabled={modalMode === 'view'}
                      value={formData.radius}
                      onChange={e => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                      style={{ flex: 1, accentColor: '#2563EB' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BFDBFE', minWidth: '60px', textAlign: 'center' }}>
                      {formData.radius}m
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Address</label>
                  <textarea
                    disabled={modalMode === 'view'}
                    placeholder="Physical address of the office..."
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', minHeight: '60px', padding: '10px 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', resize: 'vertical', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>Description</label>
                  <textarea
                    disabled={modalMode === 'view'}
                    placeholder="Short description/notes..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', minHeight: '60px', padding: '10px 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', resize: 'vertical', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>

                {modalMode !== 'view' && (
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{ flex: 1, height: '42px', borderRadius: '11px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, height: '42px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)'}
                    >
                      <CheckCircle2 size={16} />
                      Save Location
                    </button>
                  </div>
                )}
              </form>

              {/* Map Side */}
              <div style={{ padding: 16, background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} style={{ color: '#2563EB' }} />
                  {modalMode === 'view' ? 'Geofence representation on map' : 'Click on map or drag marker to capture Latitude & Longitude'}
                </div>
                <div style={{ flex: 1, background: '#FFF', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <GeofenceMap
                    lat={formData.latitude}
                    lng={formData.longitude}
                    radius={formData.radius}
                    onChange={handleMapChange}
                    readonly={modalMode === 'view'}
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
