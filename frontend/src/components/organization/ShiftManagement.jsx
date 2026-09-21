import React, { useState, useMemo, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  Clock,
  Users,
  Download,
  CheckCircle2,
  Calendar,
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
  Moon,
  Sunset,
  Sunrise,
  Coffee,
  Briefcase
} from 'lucide-react';

const DEFAULT_EMPLOYEE_RECORDS = [
  { id: 1, name: 'John Doe', code: 'EMP001' },
  { id: 2, name: 'Sarah Jenkins', code: 'EMP002' },
  { id: 3, name: 'Michael Chen', code: 'EMP003' },
  { id: 4, name: 'Alex Rivera', code: 'EMP004' },
  { id: 5, name: 'Emily Wong', code: 'EMP005' },
  { id: 6, name: 'David Kim', code: 'EMP006' },
  { id: 7, name: 'Lisa Ray', code: 'EMP007' },
  { id: 8, name: 'Robert Taylor', code: 'EMP008' }
];

const ALL_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultDayOffLabels = { Mon: 'Weekly Off', Tue: 'Weekly Off', Wed: 'Weekly Off', Thu: 'Weekly Off', Fri: 'Weekly Off', Sat: 'Weekly Off', Sun: 'Weekly Off' };

const emptyForm = { name: '', code: '', startTime: '', endTime: '', breakTime: '', graceTime: '', workingHours: '', status: 'Active', assignedEmployees: [], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], offLabel: 'Weekly Off', dayOffLabels: { ...defaultDayOffLabels } };

const getShiftStyles = (name) => {
  const nameLower = (name || '').toLowerCase();
  if (nameLower.includes('morning') || nameLower.includes('sunrise')) return { IconComp: Sunrise, bg: '#FEF3C7', color: '#D97706' };
  if (nameLower.includes('night')) return { IconComp: Moon, bg: '#EEF2FF', color: '#4F46E5' };
  if (nameLower.includes('evening') || nameLower.includes('sunset')) return { IconComp: Sunset, bg: '#FDF2F8', color: '#DB2777' };
  if (nameLower.includes('flex')) return { IconComp: Briefcase, bg: '#F5F3FF', color: '#7C3AED' };
  return { IconComp: Sun, bg: '#F0FDF4', color: '#16A34A' };
};

export const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employeeList, setEmployeeList] = useState(DEFAULT_EMPLOYEE_RECORDS);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const itemsPerPage = 8;

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/organization/shifts');
      if (Array.isArray(data)) {
        setShifts(data);
      }
    } catch (e) {
      console.error("Failed to load shifts:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadShifts();
    apiFetch('/employees').then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployeeList(data.map((e, idx) => ({
          id: e.id || idx + 1,
          name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || `Employee ${idx + 1}`,
          code: e.employee_code || e.employeeId || `EMP00${e.id || idx + 1}`
        })));
      }
    }).catch(() => { });
  }, []);

  const statistics = useMemo(() => {
    const activeShifts = shifts.filter(s => s.status === 'Active');
    let totalHrs = 0;
    let count = 0;
    activeShifts.forEach(s => {
      const hrs = parseFloat(s.workingHours);
      if (!isNaN(hrs)) { totalHrs += hrs; count++; }
    });
    return {
      total: shifts.length,
      active: activeShifts.length,
      employees: shifts.reduce((sum, s) => sum + (Array.isArray(s.assignedEmployees) ? s.assignedEmployees.length : (parseInt(s.employees) || 0)), 0),
      avgHours: count > 0 ? (totalHrs / count).toFixed(1) + ' hrs' : '0 hrs'
    };
  }, [shifts]);

  const filteredData = useMemo(() => {
    return shifts.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [shifts, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = () => { setFormData(emptyForm); setShowEmpDropdown(false); setShowAddModal(true); };
  const handleSaveAdd = async () => {
    if (!formData.name || !formData.code || !formData.startTime || !formData.endTime) return;
    try {
      const empCount = formData.assignedEmployees ? formData.assignedEmployees.length : 0;
      const payload = {
        ...formData,
        employees: empCount
      };
      await apiFetch('/organization/shifts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadShifts();
    } catch (err) {
      console.error("Error creating shift:", err);
    }
    setShowAddModal(false);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    const assigned = Array.isArray(item.assignedEmployees) ? item.assignedEmployees : (item.employees > 0 ? employeeList.slice(0, item.employees).map(e => e.id) : []);
    const days = Array.isArray(item.workingDays) && item.workingDays.length > 0 ? item.workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const initialDayOffLabels = item.dayOffLabels ? { ...defaultDayOffLabels, ...item.dayOffLabels } : { ...defaultDayOffLabels };
    setFormData({
      name: item.name,
      code: item.code,
      startTime: item.startTime,
      endTime: item.endTime,
      breakTime: item.breakTime,
      graceTime: item.graceTime,
      workingHours: item.workingHours,
      status: item.status,
      description: item.description,
      assignedEmployees: assigned,
      workingDays: days,
      offLabel: item.offLabel || 'Weekly Off',
      dayOffLabels: initialDayOffLabels
    });
    setShowEmpDropdown(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!formData.name || !formData.code || !formData.startTime || !formData.endTime) return;
    try {
      const empCount = formData.assignedEmployees ? formData.assignedEmployees.length : 0;
      const payload = {
        ...formData,
        employees: empCount
      };
      await apiFetch(`/organization/shifts/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await loadShifts();
    } catch (err) {
      console.error("Error updating shift:", err);
    }
    setShowEditModal(false);
  };

  const handleOpenView = (item) => { setSelectedItem(item); setShowViewModal(true); };
  const handleOpenDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };
  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await apiFetch(`/organization/shifts/${selectedItem.id}`, {
          method: 'DELETE'
        });
        await loadShifts();
      } catch (err) {
        console.error("Error deleting shift:", err);
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
          width: '720px',
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
                <Clock size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
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

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
            {/* Standard 2-Column Grid Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Shift Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter shift name" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Shift Code <span className="text-red-500">*</span></label>
                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Enter shift code" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                <input type="text" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} placeholder="e.g. 09:00 AM" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End Time <span className="text-red-500">*</span></label>
                <input type="text" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} placeholder="e.g. 06:00 PM" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Break Time</label>
                <input type="text" value={formData.breakTime} onChange={e => setFormData({ ...formData, breakTime: e.target.value })} placeholder="e.g. 60 mins" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Grace Time</label>
                <input type="text" value={formData.graceTime} onChange={e => setFormData({ ...formData, graceTime: e.target.value })} placeholder="e.g. 15 mins" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Working Hours</label>
                <input type="text" value={formData.workingHours} onChange={e => setFormData({ ...formData, workingHours: e.target.value })} placeholder="e.g. 9 hours" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="pt-0">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Status <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="shiftStatus" checked={formData.status === 'Active'} onChange={() => setFormData({ ...formData, status: 'Active' })} className="w-4 h-4 text-blue-600 cursor-pointer" />
                    <span className="text-sm font-semibold text-slate-700">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="shiftStatus" checked={formData.status === 'Inactive'} onChange={() => setFormData({ ...formData, status: 'Inactive' })} className="w-4 h-4 text-blue-600 cursor-pointer" />
                    <span className="text-sm font-semibold text-slate-700">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── WORKING DAYS SELECTION INPUT ── */}
            <div style={{ width: '100%', boxSizing: 'border-box', marginTop: '24px' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2 pt-1 w-full">
                {ALL_WEEKDAYS.map(day => {
                  const isSelected = (formData.workingDays || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const current = formData.workingDays || [];
                        const updated = isSelected ? current.filter(d => d !== day) : [...current, day];
                        setFormData({ ...formData, workingDays: updated });
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── PER-DAY NON-WORKING DAYS STATUS / COMMENTS (SPACIOUS UI) ── */}
            {ALL_WEEKDAYS.filter(day => !(formData.workingDays || []).includes(day)).length > 0 && (
              <div style={{ width: '100%', boxSizing: 'border-box', marginTop: '24px' }}>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Non-Working Days Status / Comments
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {ALL_WEEKDAYS.filter(day => !(formData.workingDays || []).includes(day)).map(day => (
                    <div key={day} className="w-full">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {day} Status
                      </label>
                      <input
                        type="text"
                        value={(formData.dayOffLabels && formData.dayOffLabels[day] !== undefined) ? formData.dayOffLabels[day] : 'Weekly Off'}
                        onChange={e => {
                          const updated = { ...(formData.dayOffLabels || defaultDayOffLabels), [day]: e.target.value };
                          setFormData({ ...formData, dayOffLabels: updated });
                        }}
                        placeholder={`e.g. Weekly Off, Power Shutdown`}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EMPLOYEES SELECTION INPUT (RESPONSIVE FLEX-WRAP CONTAINED) ── */}
            <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', marginTop: '24px' }}>
              <div className="flex items-center justify-between mb-2 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <label className="block text-sm font-semibold text-slate-700">
                  Employees
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                  style={{ flexShrink: 0 }}
                >
                  Select Employees <ChevronRight size={14} className={`transition-transform ${showEmpDropdown ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <div
                onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  minHeight: '52px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {(formData.assignedEmployees || []).length === 0 ? (
                  <span className="text-xs text-slate-400">No employees selected. Click "Select Employees" to add.</span>
                ) : (
                  (formData.assignedEmployees || []).map(empId => {
                    const emp = employeeList.find(e => e.id === empId);
                    if (!emp) return null;
                    return (
                      <div
                        key={empId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          maxWidth: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          flexShrink: 0
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                            minWidth: 0
                          }}
                        >
                          {emp.name} — {emp.code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = (formData.assignedEmployees || []).filter(id => id !== empId);
                            setFormData({ ...formData, assignedEmployees: updated });
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#1d4ed8',
                            padding: 0,
                            marginLeft: '4px',
                            flexShrink: 0
                          }}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Employee List */}
              {showEmpDropdown && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#ffffff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    zIndex: 50
                  }}
                >
                  {employeeList.map(emp => {
                    const isSelected = (formData.assignedEmployees || []).includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          const current = formData.assignedEmployees || [];
                          const updated = isSelected ? current.filter(id => id !== emp.id) : [...current, emp.id];
                          setFormData({ ...formData, assignedEmployees: updated });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          {emp.name} — {emp.code}
                        </span>
                        {isSelected && <CheckCircle2 size={16} style={{ color: '#2563eb', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}
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
        <div><h1 className="text-2xl font-bold text-[#0A1629]">Shift Management</h1><p className="text-sm text-slate-500 mt-1">Manage all company work shifts and timings.</p></div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'shift_management') && (
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download size={16} /> Export</button>
          )}
          {canCreate('organization', 'shift_management') && (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"><Plus size={16} /> Add Shift</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Shifts', value: statistics.total, icon: Clock, bg: '#EEF2FF', color: '#2563EB' },
          { label: 'Active Shifts', value: statistics.active, icon: CheckCircle2, bg: '#ECFDF5', color: '#10B981' },
          { label: 'Employees Assigned', value: statistics.employees, icon: Users, bg: '#F5F3FF', color: '#8B5CF6' },
          { label: 'Weekly Hours', value: statistics.avgHours, icon: Coffee, bg: '#FFF7ED', color: '#F97316' }
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
            <input
              type="text"
              placeholder="Search Shift..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-slate-300 transition-colors shadow-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <AppDropdown
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setCurrentPage(1); }}
              options={[{ value: 'All', label: 'Status: All' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
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
              setStatusFilter('All');
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
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Clock size={24} className="text-slate-400" /></div>
            <h3 className="text-lg font-semibold text-slate-700">No Shifts Found</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first shift.</p>
            {canCreate('organization', 'shift_management') && (
              <button onClick={handleAdd} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"><Plus size={16} /> Add Shift</button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Shift</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Code</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Start Time</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">End Time</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Working Hours</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Employees</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const styles = getShiftStyles(item.name);
                const IconComp = styles.IconComp;
                const empCount = Array.isArray(item.assignedEmployees) ? item.assignedEmployees.length : (parseInt(item.employees) || 0);

                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: styles.bg, color: styles.color }}><IconComp size={18} /></div><span className="font-semibold text-[#101828] text-sm whitespace-nowrap">{item.name}</span></div></td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.code}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.startTime}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.endTime}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.workingHours}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap"><div className="flex items-center gap-1.5"><Users size={16} className="text-slate-400" /><span>{empCount}</span></div></td>
                    <td className="py-4 px-4 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={item.status === 'Active' ? { backgroundColor: '#ECFDF5', color: '#047857' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>{item.status}</span></td>
                    <td className="py-4 px-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button onClick={() => handleOpenView(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Eye size={16} /></button>
                        {canEdit('organization', 'shift_management') && (
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
                        )}
                        {canDelete('organization', 'shift_management') && (
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
          <p className="text-sm text-slate-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} shifts</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronLeft size={18} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{page}</button>))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {renderFormModal('Add Shift', 'Create a new work shift, select working days, and assign employees.', showAddModal, () => setShowAddModal(false), handleSaveAdd, 'Save Shift')}
      {renderFormModal('Edit Shift', 'Update shift information, working days, and assigned employees.', showEditModal, () => setShowEditModal(false), handleSaveEdit, 'Update Shift')}
      {showViewModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content modal-centered-content-view">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Shift Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">View shift information.</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {[
                  ['Shift Name', selectedItem.name],
                  ['Shift Code', selectedItem.code],
                  ['Start Time', selectedItem.startTime],
                  ['End Time', selectedItem.endTime],
                  ['Break Time', selectedItem.breakTime || '—'],
                  ['Grace Time', selectedItem.graceTime || '—'],
                  ['Working Hours', selectedItem.workingHours],
                  ['Working Days', Array.isArray(selectedItem.workingDays) ? selectedItem.workingDays.join(', ') : 'Mon, Tue, Wed, Thu, Fri'],
                  ['Employees Assigned', Array.isArray(selectedItem.assignedEmployees) ? selectedItem.assignedEmployees.length : (parseInt(selectedItem.employees) || 0)],
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
            <h3 className="text-lg font-bold text-[#0A1629]">Delete Shift?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete "{selectedItem.name}"? This action will remove shift assignments from affected employees.
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
