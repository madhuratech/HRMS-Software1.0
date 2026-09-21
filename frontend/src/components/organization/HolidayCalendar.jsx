import React, { useState, useMemo, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  CalendarDays,
  CalendarHeart,
  Flag,
  Download,
  Search,
  Filter,
  Grid,
  RotateCw,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Star,
  Sparkles
} from 'lucide-react';

const INITIAL_HOLIDAYS = [];

const HOLIDAY_TYPES = ['National', 'Regional', 'Optional', 'Restricted', 'Festival'];
const BRANCHES = ['All Branches', 'Chennai Head Office', 'Bangalore Tech Park', 'Mumbai Office', 'Hyderabad Center', 'Delhi NCR Office', 'Pune Development Hub', 'Kolkata Office', 'Coimbatore Branch', 'North India Branches', 'South India Branches'];

const emptyForm = { name: '', date: '', type: '', description: '', status: 'Active' };

const getHolidayStyles = (type) => {
  if (type === 'National') return { IconComp: Flag, bg: '#EEF2FF', color: '#2563EB' };
  if (type === 'Regional') return { IconComp: Star, bg: '#F0FDF4', color: '#16A34A' };
  if (type === 'Optional') return { IconComp: Sparkles, bg: '#FFF7ED', color: '#EA580C' };
  return { IconComp: Sun, bg: '#F1F5F9', color: '#475569' };
};

const CustomSelect = ({ label, required, value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white hover:border-slate-300 transition-colors">
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronRight size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${value === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const itemsPerPage = 8;

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/organization/holidays');
      if (Array.isArray(data)) {
        setHolidays(data);
      }
    } catch (e) {
      console.error("Failed to load holidays:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = holidays.filter(h => {
      const hDate = new Date(h.date);
      return hDate >= today && h.status === 'Active';
    });
    return {
      total: holidays.length,
      public: holidays.filter(h => h.type === 'National' || h.type === 'Public').length,
      optional: holidays.filter(h => h.type === 'Optional' || h.type === 'Regional').length,
      upcoming: upcoming.length
    };
  }, [holidays]);

  const filteredData = useMemo(() => {
    return holidays.filter(h => {
      const matchSearch = (h.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'All' || h.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [holidays, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = () => { setFormData(emptyForm); setShowAddModal(true); };
  const handleSaveAdd = async () => {
    if (!formData.name || !formData.date || !formData.type) return;
    try {
      await apiFetch('/organization/holidays', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await loadHolidays();
    } catch (err) {
      console.error("Error creating holiday:", err);
    }
    setShowAddModal(false);
  };
  const handleOpenEdit = (item) => { setSelectedItem(item); setFormData({ name: item.name, date: item.date, type: item.type, description: item.description, status: item.status }); setShowEditModal(true); };
  const handleSaveEdit = async () => {
    if (!formData.name || !formData.date || !formData.type) return;
    try {
      await apiFetch(`/organization/holidays/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      await loadHolidays();
    } catch (err) {
      console.error("Error updating holiday:", err);
    }
    setShowEditModal(false);
  };
  const handleOpenView = (item) => { setSelectedItem(item); setShowViewModal(true); };
  const handleOpenDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };
  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await apiFetch(`/organization/holidays/${selectedItem.id}`, {
          method: 'DELETE'
        });
        await loadHolidays();
      } catch (err) {
        console.error("Error deleting holiday:", err);
      }
    }
    setShowDeleteModal(false);
  };

  const renderFormModal = (title, subtitle, show, onClose, onSave, saveLabel) => {
    if (!show) return null;
    return (
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
                <CalendarDays size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                  {title}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
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
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Holiday Name *</label>
                <input type="text" className="hrms-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter holiday name" style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Holiday Date *</label>
                <input type="text" className="hrms-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} placeholder="e.g. 15 Aug 2026" style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Holiday Type *</label>
                <AppDropdown
                  value={formData.type}
                  onChange={v => setFormData({ ...formData, type: v })}
                  options={HOLIDAY_TYPES}
                  placeholder="Select Holiday Type"
                  size="sm"
                />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Status *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="holidayStatus" checked={formData.status === 'Active'} onChange={() => setFormData({ ...formData, status: 'Active' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                    Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="holidayStatus" checked={formData.status === 'Inactive'} onChange={() => setFormData({ ...formData, status: 'Inactive' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                    Inactive
                  </label>
                </div>
              </div>
              <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Description</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter holiday description..."
                  rows="3"
                  className="hrms-input"
                  style={{ height: 'auto', resize: 'vertical', borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                />
              </div>
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
            flexShrink: 0
          }}>
            <button
              type="button"
              className="hrms-secondary-btn"
              onClick={onClose}
              style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="hrms-btn-primary"
              onClick={onSave}
              style={{ borderRadius: '10px', padding: '9px 22px', fontWeight: '600', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#FFF' }}
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#0A1629]">Holiday Calendar</h1><p className="text-sm text-slate-500 mt-1">Manage company holidays and observances.</p></div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'holiday_calendar') && (
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download size={16} /> Export</button>
          )}
          {canCreate('organization', 'holiday_calendar') && (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"><Plus size={16} /> Add Holiday</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Holidays', value: statistics.total, icon: CalendarDays, bg: '#EEF2FF', color: '#2563EB' },
          { label: 'Upcoming Holidays', value: statistics.upcoming, icon: CalendarHeart, bg: '#FFF7ED', color: '#F97316' },
          { label: 'Public Holidays', value: statistics.public, icon: Flag, bg: '#ECFDF5', color: '#10B981' },
          { label: 'Optional Holidays', value: statistics.optional, icon: Star, bg: '#F5F3FF', color: '#8B5CF6' }
        ].map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-16 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.bg, color: card.color }}><card.icon size={22} /></div>
            <div><p className="text-[13px] font-semibold text-slate-500 leading-tight">{card.label}</p><p className="text-[28px] font-bold text-[#0a1629] mt-1 leading-none">{card.value}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Holiday..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <AppDropdown
              value={typeFilter}
              onChange={v => { setTypeFilter(v); setCurrentPage(1); }}
              options={[{ value: 'All', label: 'Type: All' }]}
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
            <Filter size={16} /> Filters
          </button>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <Grid size={16} />
          </button>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('All');
              setCurrentPage(1);
            }}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto">
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><CalendarDays size={24} className="text-slate-400" /></div>
            <h3 className="text-lg font-semibold text-slate-700">No Holidays Found</h3>
            <p className="text-sm text-slate-500 mt-1">Add a new holiday to the calendar.</p>
            {canCreate('organization', 'holiday_calendar') && (
              <button onClick={handleAdd} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"><Plus size={16} /> Add Holiday</button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Holiday</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Date</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Type</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Description</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const styles = getHolidayStyles(item.type);
                const IconComp = styles.IconComp;
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: styles.bg, color: styles.color }}><IconComp size={18} /></div><span className="font-semibold text-[#101828] text-sm whitespace-nowrap">{item.name}</span></div></td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.date}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.type}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm min-w-[200px] truncate max-w-[300px]">{item.description}</td>
                    <td className="py-4 px-4 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={item.status === 'Active' ? { backgroundColor: '#ECFDF5', color: '#047857' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>{item.status}</span></td>
                    <td className="py-4 px-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button onClick={() => handleOpenView(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Eye size={16} /></button>
                        {canEdit('organization', 'holiday_calendar') && (
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
                        )}
                        {canDelete('organization', 'holiday_calendar') && (
                          <button onClick={() => handleOpenDelete(item)} className="p-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} holidays</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronLeft size={18} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{page}</button>))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {renderFormModal('Add Holiday', 'Create a new holiday.', showAddModal, () => setShowAddModal(false), handleSaveAdd, 'Save Holiday')}
      {renderFormModal('Edit Holiday', 'Update holiday information.', showEditModal, () => setShowEditModal(false), handleSaveEdit, 'Update Holiday')}

      {showViewModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content modal-centered-content-view">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Holiday Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">View holiday information.</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {[
                  ['Holiday Name', selectedItem.name],
                  ['Holiday Date', selectedItem.date],
                  ['Holiday Type', selectedItem.type],
                  ['Status', selectedItem.status]
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
                    {label === 'Status' ? (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={value === 'Active' ? { backgroundColor: '#ECFDF5', color: '#047857' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}
                      >
                        {value}
                      </span>
                    ) : (
                      <p className="text-sm font-semibold text-[#0A1629]">{value}</p>
                    )}
                  </div>
                ))}
              </div>
              {selectedItem.description && (
                <div className="mt-4 bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-600">{selectedItem.description}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showDeleteModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowDeleteModal(false)} />
          <div className="modal-centered-content modal-centered-content-delete">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0A1629]">Delete Holiday?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete "{selectedItem.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
