import React, { useState, useMemo, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import AppDropdown from '../ui/AppDropdown';
import { canCreate, canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  Building2,
  Users,
  Download,
  CheckCircle2,
  UserCheck,
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
  Mail,
  Phone,
  Calendar,
  User
} from 'lucide-react';

const emptyForm = {
  name: '',
  code: '',
  headName: '',
  headAvatar: '',
  headRole: '',
  parentDepartment: '',
  email: '',
  phone: '',
  description: '',
  status: 'Active'
};

const getDeptStyles = (deptName) => {
  switch (deptName) {
    case 'Human Resources':
      return { bg: '#EEF2FF', color: '#2563EB' };
    case 'Finance':
      return { bg: '#ECFDF5', color: '#10B981' };
    case 'Development':
      return { bg: '#F5F3FF', color: '#8B5CF6' };
    case 'Quality Assurance':
      return { bg: '#FFF7ED', color: '#F97316' };
    case 'UI/UX Design':
      return { bg: '#FFF1F2', color: '#F43F5E' };
    case 'Marketing':
      return { bg: '#ECFEFF', color: '#0891B2' };
    case 'Sales':
      return { bg: '#F0F9FF', color: '#0284C7' };
    default:
      return { bg: '#F8FAFC', color: '#64748B' };
  }
};

export function Departments() {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/organization/departments');
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDepartments();
    apiFetch('/employees?status=Active')
      .then(data => {
        if (Array.isArray(data)) setEmployeesList(data);
      })
      .catch(err => console.error('Failed to load employees:', err));
  }, []);

  const isAnyModalOpen = isAddEditModalOpen || isViewModalOpen || isDeleteModalOpen;

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (isAnyModalOpen) {
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      if (mainEl) mainEl.style.overflow = '';
    }
    return () => {
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddEditModalOpen(false);
        setIsViewModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    if (isAnyModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen]);

  // Statistics
  const statistics = useMemo(() => {
    const total = departments.length;
    const active = departments.filter(d => d.status === 'Active').length;
    const employees = departments.reduce((acc, d) => acc + (Number(d.employees) || 0), 0);
    const heads = new Set(departments.map(d => d.headName).filter(Boolean)).size;

    return { total, active, employees, heads };
  }, [departments]);

  const getHeadAvatarUrl = (dept) => {
    if (!dept || !dept.headName || dept.headName === 'Unassigned') return null;
    const emp = employeesList.find(e => e.name?.toLowerCase() === dept.headName?.toLowerCase());
    const photo = emp?.profile_photo || emp?.avatar || emp?.photo || dept.headAvatar;
    if (photo && photo.trim() !== '' && !photo.includes('undefined')) return photo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(dept.headName)}&background=2563eb&color=fff&bold=true`;
  };

  const getHeadRole = (dept) => {
    if (!dept || !dept.headName || dept.headName === 'Unassigned') return 'Unassigned';
    const emp = employeesList.find(e => e.name?.toLowerCase() === dept.headName?.toLowerCase());
    return emp?.designation || emp?.role || emp?.jobTitle || dept.headRole || 'Department Manager';
  };

  // Filters & Search
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchSearch = (dept.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (dept.code || '').toLowerCase().includes(search.toLowerCase()) ||
        (dept.headName || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || dept.status === statusFilter;
      const matchBranch = branchFilter === 'All' || dept.branch === branchFilter;

      return matchSearch && matchStatus && matchBranch;
    });
  }, [departments, search, statusFilter, branchFilter]);

  // Pagination
  const pageSize = 8;
  const totalPages = Math.ceil(filteredDepartments.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenAddModal = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setSelectedDept(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setFormData({
      name: dept.name,
      code: dept.code,
      headName: dept.headName || '',
      parentDepartment: dept.parentDepartment || '',
      email: dept.email || '',
      phone: dept.phone || '',
      status: dept.status || 'Active',
      description: dept.description || ''
    });
    setFormErrors({});
    setSelectedDept(dept);
    setIsAddEditModalOpen(true);
  };

  const handleOpenViewModal = (dept) => {
    setSelectedDept(dept);
    setIsViewModalOpen(true);
  };

  const handleOpenDeleteModal = (dept) => {
    setSelectedDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSaveDepartment = async () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) errors.name = 'Department Name is required';
    if (!formData.code || !formData.code.trim()) errors.code = 'Department Code is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (selectedDept) {
        // Edit mode
        await apiFetch(`/organization/departments/${selectedDept.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        addToast('Department updated successfully!', 'success');
      } else {
        // Add mode
        await apiFetch('/organization/departments', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        addToast('Department created successfully!', 'success');
      }
      await loadDepartments();
      setIsAddEditModalOpen(false);
    } catch (err) {
      console.error('Error saving department:', err);
      addToast('Failed to save department', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedDept) {
      try {
        await apiFetch(`/organization/departments/${selectedDept.id}`, {
          method: 'DELETE'
        });
        addToast('Department deleted successfully!', 'success');
        await loadDepartments();
      } catch (err) {
        console.error('Error deleting department:', err);
        addToast('Failed to delete department', 'error');
      }
    }
    setIsDeleteModalOpen(false);
  };

  const handleExportData = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(departments, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'departments.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 relative min-h-full pb-12">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage company organizational units, hierarchy, and department heads.</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'departments') && (
            <button
              onClick={handleExportData}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white shadow-sm"
            >
              <Download size={16} /> Export
            </button>
          )}
          {canCreate('organization', 'departments') && (
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: '#2563EB' }}>
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Departments</p>
            <p className="text-2xl font-bold text-[#0a1629] mt-0.5">{statistics.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Departments</p>
            <p className="text-2xl font-bold text-[#0a1629] mt-0.5">{statistics.active}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Employees Assigned</p>
            <p className="text-2xl font-bold text-[#0a1629] mt-0.5">{statistics.employees}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF7ED', color: '#F97316' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Department Heads</p>
            <p className="text-2xl font-bold text-[#0a1629] mt-0.5">{statistics.heads}</p>
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
              placeholder="Search department, code, or head..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <div style={{ minWidth: 150 }}>
              <AppDropdown
                value={statusFilter}
                onChange={v => setStatusFilter(v || 'All')}
                options={['All', 'Active', 'Inactive']}
                placeholder="Status: All"
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setBranchFilter('All');
            }}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            title="Reset Filters"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-500 shadow-sm">
          Loading departments...
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Departments Found</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm">
            {search || statusFilter !== 'All'
              ? 'No departments match your current filter criteria. Try resetting your search.'
              : 'Create your first organizational department to get started.'}
          </p>
          {canCreate('organization', 'departments') && (
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={16} /> Add Department
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-[12px] font-semibold text-slate-500">Department</th>
                  <th className="text-left py-4 px-6 text-[12px] font-semibold text-slate-500 whitespace-nowrap">Code</th>
                  <th className="text-left py-4 px-6 text-[12px] font-semibold text-slate-500 whitespace-nowrap">Department Head</th>
                  <th className="text-left py-4 px-6 text-[12px] font-semibold text-slate-500 whitespace-nowrap">Employees</th>
                  <th className="text-left py-4 px-6 text-[12px] font-semibold text-slate-500 whitespace-nowrap">Status</th>
                  <th className="text-center py-4 px-6 text-[12px] font-semibold text-slate-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((dept) => {
                  const styles = getDeptStyles(dept.name);
                  return (
                    <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: styles.bg, color: styles.color }}
                          >
                            <Building2 size={18} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">{dept.name}</span>
                            {dept.parentDepartment && (
                              <span className="text-xs text-slate-400 block">Parent: {dept.parentDepartment}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-sm font-mono whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium text-xs">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {dept.headName && dept.headName !== 'Unassigned' ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={getHeadAvatarUrl(dept)}
                              alt={dept.headName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dept.headName)}&background=2563eb&color=fff&bold=true`;
                              }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-none whitespace-nowrap">{dept.headName}</p>
                              <p className="text-xs text-slate-400 mt-1 leading-none whitespace-nowrap">{getHeadRole(dept)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-semibold flex-shrink-0">
                              <Users size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-500 leading-none">Unassigned</p>
                              <p className="text-xs text-slate-400 mt-1 leading-none">No Head</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Users size={16} className="text-slate-400" />
                          <span>{dept.employees || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            dept.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenViewModal(dept)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Department"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit('organization', 'departments') && (
                            <button
                              onClick={() => handleOpenEditModal(dept)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Department"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete('organization', 'departments') && (
                            <button
                              onClick={() => handleOpenDeleteModal(dept)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDepartments.length)} of {filteredDepartments.length} departments
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[34px] h-[34px] px-2 rounded-lg border text-sm font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isAddEditModalOpen && (
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
            width: '680px',
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
                  <Building2 size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    {selectedDept ? 'Edit Department' : 'Add Department'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    {selectedDept ? 'Modify department configuration and assignments.' : 'Create a new company department and assign a department head.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
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
            <form onSubmit={(e) => { e.preventDefault(); handleSaveDepartment(); }} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>
                    Department Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Human Resources"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="hrms-input"
                    style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                  />
                  {formErrors.name && <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>
                    Department Code <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HR-001"
                    value={formData.code}
                    onChange={(e) => handleFormChange('code', e.target.value)}
                    className="hrms-input"
                    style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1', fontFamily: 'monospace' }}
                  />
                  {formErrors.code && <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>{formErrors.code}</span>}
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Department Head</label>
                  <AppDropdown
                    value={formData.headName || 'Unassigned'}
                    onChange={(val) => {
                      const isUnassigned = val === 'Unassigned' || !val;
                      const selectedEmp = employeesList.find(e => e.name === val);
                      setFormData(prev => ({
                        ...prev,
                        headName: isUnassigned ? '' : val,
                        headAvatar: isUnassigned ? '' : (selectedEmp?.profile_photo || selectedEmp?.avatar || selectedEmp?.photo || ''),
                        headRole: isUnassigned ? '' : (selectedEmp?.designation || selectedEmp?.role || selectedEmp?.jobTitle || 'Department Manager')
                      }));
                    }}
                    options={[
                      { value: 'Unassigned', label: 'Unassigned (No Head)' },
                      ...employeesList.map(e => ({
                        value: e.name,
                        label: `${e.name} ${e.designation || e.role ? `(${e.designation || e.role})` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Parent Department</label>
                  <AppDropdown
                    value={formData.parentDepartment || 'None'}
                    onChange={(val) => handleFormChange('parentDepartment', val === 'None' ? '' : val)}
                    options={[
                      { value: 'None', label: 'None (Top Level)' },
                      ...departments.filter(d => !selectedDept || d.id !== selectedDept.id).map(d => ({
                        value: d.name,
                        label: d.name
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Department Email</label>
                  <input
                    type="email"
                    placeholder="e.g. hr@company.com"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="hrms-input"
                    style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Department Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="hrms-input"
                    style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                  />
                </div>

                <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Status *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                      <input type="radio" name="deptStatus" checked={formData.status === 'Active'} onChange={() => handleFormChange('status', 'Active')} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                      Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                      <input type="radio" name="deptStatus" checked={formData.status === 'Inactive'} onChange={() => handleFormChange('status', 'Inactive')} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                      Inactive
                    </label>
                  </div>
                </div>

                <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Description</label>
                  <textarea
                    placeholder="Brief description of the department's role and responsibilities..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    style={{ height: '80px', borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1', resize: 'none' }}
                    className="hrms-input"
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={() => setIsAddEditModalOpen(false)}
                  style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hrms-btn-primary"
                  style={{ borderRadius: '10px', padding: '9px 22px', fontWeight: '600', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#FFF' }}
                >
                  {selectedDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Department Details Modal */}
      {isViewModalOpen && selectedDept && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setIsViewModalOpen(false)} />
          <div className="modal-centered-content" style={{ width: '800px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0A1629]">{selectedDept.name}</h2>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{selectedDept.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Department Head</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
                    <User size={16} className="text-blue-500" />
                    {selectedDept.headName || 'Unassigned'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Parent Department</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    {selectedDept.parentDepartment || 'None (Top Level)'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Employees Assigned</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Users size={16} className="text-emerald-500" />
                    {selectedDept.employees || 0} Employees
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedDept.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedDept.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Department Email</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    {selectedDept.email || '—'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Department Phone</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    {selectedDept.phone || '—'}
                  </div>
                </div>
              </div>
              {selectedDept.description && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-400">Description</span>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{selectedDept.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-8 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-base font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDept && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="modal-centered-content modal-centered-content-delete">
            <span className="text-4xl mb-4">⚠️</span>
            <h3 className="text-lg font-bold text-slate-800">Delete Department?</h3>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Are you sure you want to delete the department <strong>{selectedDept.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 w-full">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-6 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default Departments;
