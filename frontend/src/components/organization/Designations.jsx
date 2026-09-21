import React, { useState, useMemo, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import AppDropdown from '../ui/AppDropdown';
import { canCreate, canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  Award,
  Users,
  Download,
  CheckCircle2,
  XCircle,
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
  Calendar,
  Briefcase,
  Shield,
  Code,
  TrendingUp,
  Star,
  Target,
  Zap,
  Layers
} from 'lucide-react';

const INITIAL_DESIGNATIONS = [];

const DEPARTMENTS = ['Management', 'Technology', 'Human Resources', 'Finance', 'Sales', 'Marketing', 'Design', 'Support'];
const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

const emptyForm = {
  name: '', code: '', department: '', reportsTo: '', grade: '', level: '', status: 'Active', description: ''
};

const getDesigStyles = (name) => {
  const map = {
    'Chief Executive Officer': { IconComp: Star, bg: '#EEF2FF', color: '#2563EB' },
    'Chief Technology Officer': { IconComp: Code, bg: '#F0FDF4', color: '#16A34A' },
    'Human Resources Manager': { IconComp: Users, bg: '#FFF7ED', color: '#EA580C' },
    'Finance Manager': { IconComp: TrendingUp, bg: '#FDF2F8', color: '#DB2777' },
    'Senior Developer': { IconComp: Zap, bg: '#FEF3C7', color: '#D97706' },
    'UI/UX Designer': { IconComp: Target, bg: '#F5F3FF', color: '#7C3AED' },
    'Sales Manager': { IconComp: Briefcase, bg: '#ECFDF5', color: '#059669' },
    'Marketing Executive': { IconComp: TrendingUp, bg: '#FFF1F2', color: '#E11D48' },
  };
  return map[name] || { IconComp: Award, bg: '#F1F5F9', color: '#475569' };
};



export const Designations = () => {
  const [designations, setDesignations] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const itemsPerPage = 8;

  const loadDesignations = async () => {
    setLoading(true);
    try {
      const [desigData, deptData, empData] = await Promise.all([
        apiFetch('/organization/designations'),
        apiFetch('/organization/departments'),
        apiFetch('/employees?status=Active')
      ]);
      if (Array.isArray(desigData)) {
        setDesignations(desigData);
      }
      if (Array.isArray(deptData)) {
        const fetchedDepts = deptData.map(d => d.name || d.dept_name).filter(Boolean);
        setDepartmentsList(fetchedDepts);
      }
      if (Array.isArray(empData)) {
        setEmployeesList(empData);
      }
    } catch (e) {
      console.error("Failed to load designations:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDesignations();
  }, []);

  const reportsToOptions = useMemo(() => {
    const list = [
      { value: 'None', label: 'None (Top Level / Direct)' }
    ];
    if (Array.isArray(employeesList) && employeesList.length > 0) {
      employeesList.forEach(emp => {
        const role = emp.role_name || emp.designation || '';
        const dept = emp.dept_name || emp.department || '';
        const sub = [role, dept].filter(Boolean).join(' • ');
        list.push({
          value: emp.name,
          label: `${emp.name}${sub ? ` (${sub})` : ''}`
        });
      });
    }
    return list;
  }, [employeesList]);

  const statistics = useMemo(() => ({
    total: designations.length,
    active: designations.filter(d => d.status === 'Active').length,
    employees: designations.reduce((sum, d) => sum + (Number(d.employees) || 0), 0),
    levels: new Set(designations.map(d => d.level)).size
  }), [designations]);

  const filteredData = useMemo(() => {
    return designations.filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (d.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchDept = deptFilter === 'All' || d.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [designations, searchTerm, statusFilter, deptFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = () => { setFormData(emptyForm); setShowAddModal(true); };
  const handleSaveAdd = async () => {
    if (!formData.name || !formData.code) return;
    try {
      await apiFetch('/organization/designations', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await loadDesignations();
    } catch (err) {
      console.error("Error creating designation:", err);
    }
    setShowAddModal(false);
  };
  const handleOpenEdit = (item) => { setSelectedItem(item); setFormData({ name: item.name, code: item.code, department: item.department, reportsTo: item.reportsTo, grade: item.grade, level: item.level, status: item.status, description: item.description }); setShowEditModal(true); };
  const handleSaveEdit = async () => {
    if (!formData.name || !formData.code) return;
    try {
      await apiFetch(`/organization/designations/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      await loadDesignations();
    } catch (err) {
      console.error("Error updating designation:", err);
    }
    setShowEditModal(false);
  };
  const handleOpenView = (item) => { setSelectedItem(item); setShowViewModal(true); };
  const handleOpenDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };
  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await apiFetch(`/organization/designations/${selectedItem.id}`, {
          method: 'DELETE'
        });
        await loadDesignations();
      } catch (err) {
        console.error("Error deleting designation:", err);
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
                <Award size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
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
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Designation Name *</label>
                <input type="text" className="hrms-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter designation name" style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Designation Code *</label>
                <input type="text" className="hrms-input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Enter designation code" style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Department *</label>
                <AppDropdown
                  value={formData.department}
                  onChange={v => setFormData({ ...formData, department: v })}
                  options={departmentsList.length > 0 ? departmentsList : DEPARTMENTS}
                  placeholder="Select Department"
                  size="sm"
                />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Reports To</label>
                <AppDropdown
                  value={formData.reportsTo}
                  onChange={v => setFormData({ ...formData, reportsTo: v })}
                  options={reportsToOptions}
                  placeholder="Select Manager / Lead"
                  size="sm"
                />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Grade</label>
                <AppDropdown
                  value={formData.grade}
                  onChange={v => setFormData({ ...formData, grade: v })}
                  options={GRADES}
                  placeholder="Select Grade"
                  size="sm"
                />
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Level</label>
                <AppDropdown
                  value={formData.level}
                  onChange={v => setFormData({ ...formData, level: v })}
                  options={['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive', 'Director']}
                  placeholder="Select Level"
                  size="sm"
                />
              </div>
              <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Status *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="status" checked={formData.status === 'Active'} onChange={() => setFormData({ ...formData, status: 'Active' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                    Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="status" checked={formData.status === 'Inactive'} onChange={() => setFormData({ ...formData, status: 'Inactive' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                    Inactive
                  </label>
                </div>
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1629]">Designations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all company designations.</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'designations') && (
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} /> Export
            </button>
          )}
          {canCreate('organization', 'designations') && (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Designation
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-16 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: '#2563EB' }}>
            <Award size={22} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-500 leading-tight">Total Designations</p>
            <p className="text-[28px] font-bold text-[#0a1629] mt-1 leading-none">{statistics.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-16 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-500 leading-tight">Active Designations</p>
            <p className="text-[28px] font-bold text-[#0a1629] mt-1 leading-none">{statistics.active}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-16 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
            <Users size={22} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-500 leading-tight">Employees Assigned</p>
            <p className="text-[28px] font-bold text-[#0a1629] mt-1 leading-none">{statistics.employees}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-16 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF7ED', color: '#F97316' }}>
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-500 leading-tight">Inactive Designations</p>
            <p className="text-[28px] font-bold text-[#0a1629] mt-1 leading-none">{statistics.inactive}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Designation..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <div style={{ minWidth: 150 }}>
              <AppDropdown
                value={statusFilter}
                onChange={v => { setStatusFilter(v || 'All'); setCurrentPage(1); }}
                options={['All', 'Active', 'Inactive']}
                placeholder="Status: All"
                size="sm"
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <AppDropdown
                value={deptFilter}
                onChange={v => { setDeptFilter(v || 'All'); setCurrentPage(1); }}
                options={['All', ...(departmentsList.length > 0 ? departmentsList : DEPARTMENTS)]}
                placeholder="Department: All"
                size="sm"
              />
            </div>
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
              setDeptFilter('All');
              setCurrentPage(1);
            }}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto">
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Award size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Designations Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">Create your first designation.</p>
            {canCreate('organization', 'designations') && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm mb-4"
              >
                <Plus size={16} /> Add Designation
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Designation</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Code</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467]">Department</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Employees</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Created Date</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const styles = getDesigStyles(item.name);
                const IconComp = styles.IconComp;
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: styles.bg, color: styles.color }}><IconComp size={18} /></div>
                        <span className="font-semibold text-[#101828] text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.code}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{item.department}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Users size={16} className="text-slate-400" /><span>{item.employees}</span></div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400" /><span>{item.createdDate}</span></div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={item.status === 'Active' ? { backgroundColor: '#ECFDF5', color: '#047857' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>{item.status}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button onClick={() => handleOpenView(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Eye size={16} /></button>
                        {canEdit('organization', 'designations') && (
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
                        )}
                        {canDelete('organization', 'designations') && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} designations</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronLeft size={18} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {renderFormModal('Add Designation', 'Create a new designation for your organization.', showAddModal, () => setShowAddModal(false), handleSaveAdd, 'Save Designation')}

      {/* Edit Modal */}
      {renderFormModal('Edit Designation', 'Update designation information.', showEditModal, () => setShowEditModal(false), handleSaveEdit, 'Update Designation')}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content modal-centered-content-view">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Designation Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">View designation information.</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {[
                  ['Designation Name', selectedItem.name],
                  ['Designation Code', selectedItem.code],
                  ['Department', selectedItem.department],
                  ['Reports To', selectedItem.reportsTo || '—'],
                  ['Grade', selectedItem.grade || '—'],
                  ['Employees', selectedItem.employees],
                  ['Status', selectedItem.status],
                  ['Created Date', selectedItem.createdDate]
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
                    {label === 'Status' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={value === 'Active' ? { backgroundColor: '#ECFDF5', color: '#047857' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>{value}</span>
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

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowDeleteModal(false)} />
          <div className="modal-centered-content modal-centered-content-delete">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-[#0A1629]">Delete Designation?</h3>
            <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete "{selectedItem.name}"? This action cannot be undone.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
