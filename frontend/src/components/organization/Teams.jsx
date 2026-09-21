import React, { useState, useMemo, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canCreate, canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  Users,
  UserCheck,
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
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Layers,
  Code,
  Megaphone,
  Monitor,
  Heart,
  Zap
} from 'lucide-react';

const emptyForm = {
  name: '',
  code: '',
  department: '',
  departmentId: null,
  teamLead: '',
  teamLeadId: null,
  teamMemberIds: [],
  teamMemberNames: [],
  members: 0,
  status: 'Active',
  description: ''
};

const getTeamStyles = (name) => {
  const styles = [
    { IconComp: Monitor, bg: '#EEF2FF', color: '#2563EB' },
    { IconComp: Layers, bg: '#F0FDF4', color: '#16A34A' },
    { IconComp: Zap, bg: '#FFF7ED', color: '#EA580C' },
    { IconComp: Briefcase, bg: '#F5F3FF', color: '#7C3AED' },
    { IconComp: Heart, bg: '#FDF2F8', color: '#DB2777' },
    { IconComp: Megaphone, bg: '#FEF3C7', color: '#D97706' },
    { IconComp: Users, bg: '#ECFDF5', color: '#059669' },
    { IconComp: Code, bg: '#FFF1F2', color: '#E11D48' }
  ];
  const idx = (name || '').length % styles.length;
  return styles[idx];
};

const CustomSelect = ({ label, required, value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <button type="button" onClick={() => setOpen(!open)} className="w-full h-12 flex items-center justify-between px-4 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 transition-colors">
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${value === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const isDeptMatch = (empDept, selectedDept, empDeptId, allDepartments = []) => {
  if (!selectedDept) return false;
  const clean = (s) => (s || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
  
  const cleanEmpDept = clean(empDept);
  const cleanSelectedDept = clean(selectedDept);
  
  if (cleanEmpDept && cleanSelectedDept) {
    if (cleanEmpDept === cleanSelectedDept || cleanEmpDept.includes(cleanSelectedDept) || cleanSelectedDept.includes(cleanEmpDept)) {
      return true;
    }
  }

  if (Array.isArray(allDepartments) && allDepartments.length > 0) {
    const targetDept = allDepartments.find(d => {
      const dName = clean(d.name || d.dept_name);
      const dCode = (d.code || '').trim().toLowerCase();
      const sel = (selectedDept || '').trim().toLowerCase();
      return (dName && (dName === cleanSelectedDept || sel.includes(dName))) ||
             (dCode && (sel.includes(`(${dCode})`) || sel.includes(dCode)));
    });

    if (targetDept) {
      if (empDeptId && String(empDeptId) === String(targetDept.id)) return true;
      const targetNameClean = clean(targetDept.name || targetDept.dept_name);
      if (cleanEmpDept && targetNameClean && (cleanEmpDept === targetNameClean || cleanEmpDept.includes(targetNameClean) || targetNameClean.includes(cleanEmpDept))) {
        return true;
      }
    }
  }

  return false;
};

/* Searchable Single-Select for Team Lead (Shows Only Team Leaders for Selected Department) */
function TeamLeadSelect({ selectedDepartment, value, selectedId, onChange, employees, departments = [], loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Active employees in selected department ONLY
  const departmentEmployees = useMemo(() => {
    if (!selectedDepartment) return [];
    const activeEmps = employees.filter(emp => emp.status === 'Active');
    return activeEmps.filter(emp => {
      const empDept = emp.dept_name || emp.department || emp.department_name || '';
      return isDeptMatch(empDept, selectedDepartment, emp.department_id, departments);
    });
  }, [employees, selectedDepartment, departments]);

  // Filter ONLY employees in selected department with Team Leader / Lead / Manager designations
  const teamLeadersOnly = useMemo(() => {
    if (!selectedDepartment) return [];
    const leadsOnly = departmentEmployees.filter(emp => {
      const role = (emp.role_name || emp.designation || emp.designation_name || emp.jobTitle || '').toLowerCase().trim();
      return (
        role.includes('leader') ||
        role.includes('lead') ||
        role.includes('manager') ||
        role.includes('head') ||
        role.includes('supervisor') ||
        role.includes('director') ||
        role.includes('chief') ||
        role.includes('admin')
      );
    });
    return leadsOnly.length > 0 ? leadsOnly : departmentEmployees;
  }, [departmentEmployees, selectedDepartment]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return teamLeadersOnly;
    const q = search.toLowerCase();
    return teamLeadersOnly.filter(emp => {
      const empIdCode = `emp00${emp.id}`.toLowerCase();
      const empName = (emp.name || '').toLowerCase();
      const empRole = (emp.role_name || emp.designation || emp.designation_name || '').toLowerCase();
      return empName.includes(q) || empRole.includes(q) || empIdCode.includes(q) || String(emp.id).includes(q);
    });
  }, [teamLeadersOnly, search]);

  const selectedEmp = useMemo(() => {
    if (selectedId !== null && selectedId !== undefined) {
      const match = employees.find(e => String(e.id) === String(selectedId));
      if (match) return match;
    }
    if (value) {
      return employees.find(e => (e.name || '').toLowerCase().trim() === (value || '').toLowerCase().trim());
    }
    return null;
  }, [selectedId, value, employees]);

  const handleSelect = (emp) => {
    onChange(emp);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">Team Lead</label>

      {/* Accordion / Inline Single-Select Container */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 flex items-center justify-between px-4 text-sm bg-white hover:bg-slate-50 transition-colors text-left"
        >
          {selectedEmp ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                {selectedEmp.name ? selectedEmp.name[0].toUpperCase() : '👤'}
              </div>
              <span className="text-slate-900 font-semibold truncate">{selectedEmp.name}</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium ml-1">
                {selectedEmp.role_name || selectedEmp.designation || selectedEmp.designation_name || 'Team Leader'}
              </span>
            </div>
          ) : value ? (
            <span className="text-slate-900 font-semibold">{value}</span>
          ) : !selectedDepartment ? (
            <span className="text-slate-400 font-medium">Select department first</span>
          ) : (
            <span className="text-slate-400">Search team lead...</span>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-3">
            {!selectedDepartment ? (
              <div className="p-3.5 text-center text-xs text-amber-800 bg-amber-50 rounded-lg font-medium border border-amber-200/80">
                ⚠️ Please select a department first to choose a team lead.
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Search team lead..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '38px',
                      paddingRight: '12px',
                      paddingTop: '9px',
                      paddingBottom: '9px',
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                    }}
                  />
                </div>

                {/* Employee List */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 bg-white border border-slate-200/80 rounded-lg">
                  {loading ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Loading department employees...</div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">No leads found in {selectedDepartment}</div>
                  ) : (
                    filteredLeads.map((emp) => {
                      const isSelected = selectedEmp && String(selectedEmp.id) === String(emp.id);
                      const designationText = emp.role_name || emp.designation || emp.designation_name || 'Team Leader';
                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleSelect(emp)}
                          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-blue-50/80 border border-blue-100' : 'border border-transparent'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {emp.name ? emp.name[0].toUpperCase() : '👤'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-slate-900 truncate">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {designationText} • {emp.dept_name || emp.department || selectedDepartment}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Searchable Multi-Select for Team Members (Shows ONLY Employees of Selected Department) */
function TeamMembersSelect({ selectedDepartment, selectedMemberIds, onChange, employees, departments = [], loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const departmentEmployees = useMemo(() => {
    if (!selectedDepartment) return [];
    const activeEmps = employees.filter(emp => emp.status === 'Active');
    return activeEmps.filter(emp => {
      const empDept = emp.dept_name || emp.department || emp.department_name || '';
      return isDeptMatch(empDept, selectedDepartment, emp.department_id, departments);
    });
  }, [employees, selectedDepartment, departments]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return departmentEmployees;
    const q = search.toLowerCase();
    return departmentEmployees.filter(emp => {
      const empIdCode = `emp00${emp.id}`.toLowerCase();
      const empName = (emp.name || '').toLowerCase();
      const empRole = (emp.role_name || emp.designation || '').toLowerCase();
      return empName.includes(q) || empRole.includes(q) || empIdCode.includes(q) || String(emp.id).includes(q);
    });
  }, [departmentEmployees, search]);

  const isMemberSelected = (empId) => {
    return (selectedMemberIds || []).some(id => String(id) === String(empId));
  };

  const selectedMemberEmps = useMemo(() => {
    return employees.filter(e => isMemberSelected(e.id));
  }, [employees, selectedMemberIds]);

  const toggleMember = (empId) => {
    let nextIds;
    if (isMemberSelected(empId)) {
      nextIds = (selectedMemberIds || []).filter(id => String(id) !== String(empId));
    } else {
      nextIds = [...(selectedMemberIds || []), empId];
    }
    const selectedEmps = employees.filter(e => nextIds.some(id => String(id) === String(e.id)));
    onChange(nextIds, selectedEmps);
  };

  const removeMember = (empId) => {
    const nextIds = (selectedMemberIds || []).filter(id => String(id) !== String(empId));
    const selectedEmps = employees.filter(e => nextIds.some(id => String(id) === String(e.id)));
    onChange(nextIds, selectedEmps);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">Team Members</label>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
          {(selectedMemberIds || []).length} {(selectedMemberIds || []).length === 1 ? 'Member' : 'Members'}
        </span>
      </div>

      {/* Selected Member Chips */}
      {selectedMemberEmps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-xl bg-slate-50/50 max-h-28 overflow-y-auto">
          {selectedMemberEmps.map((emp) => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-sm"
            >
              <span>{emp.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMember(emp.id);
                }}
                className="hover:bg-blue-100 rounded p-0.5 transition-colors text-blue-500 hover:text-blue-800"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Accordion / Inline Multi-Select Card */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 flex items-center justify-between px-4 text-sm bg-white hover:bg-slate-50 transition-colors text-left"
        >
          <span className={(selectedMemberIds || []).length === 0 ? "text-slate-400" : "text-slate-900 font-semibold"}>
            {(selectedMemberIds || []).length === 0
              ? 'Select team members...'
              : `${(selectedMemberIds || []).length} team members selected`}
          </span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  fontSize: '13px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                }}
              />
            </div>

            {/* Employee Checkbox List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 bg-white border border-slate-200/80 rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">Loading department employees...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No active employees found
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = isMemberSelected(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleMember(emp.id)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-blue-50/80 border border-blue-100/80' : 'border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {emp.name ? emp.name[0].toUpperCase() : '👤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {emp.role_name || emp.designation || 'Employee'} • {emp.dept_name || emp.department || 'General'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Teams = () => {
  const { addToast } = useToast();
  const [teams, setTeams] = useState([]);
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
  const [formErrors, setFormErrors] = useState({});
  const [departmentsList, setDepartmentsList] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const itemsPerPage = 8;

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/organization/teams');
      if (Array.isArray(data)) {
        setTeams(data);
      }
      const depts = await apiFetch('/organization/departments');
      if (Array.isArray(depts)) {
        setAllDepartments(depts);
        setDepartmentsList(depts.map(d => d.name || d.dept_name));
      }
    } catch (e) {
      console.error("Failed to load teams:", e);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const emps = await apiFetch('/employees?status=Active');
      if (Array.isArray(emps)) {
        setAllEmployees(emps);
      }
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
    setLoadingEmployees(false);
  };

  useEffect(() => {
    loadTeams();
    loadEmployees();
  }, []);

  const departmentOptions = useMemo(() => {
    const list = new Set([...departmentsList, ...teams.map(t => t.department).filter(Boolean)]);
    if (list.size === 0) return ['Technology', 'Sales', 'Human Resources', 'Marketing'];
    return Array.from(list);
  }, [departmentsList, teams]);

  const statistics = useMemo(() => ({
    total: teams.length,
    active: teams.filter(t => t.status === 'Active').length,
    members: teams.reduce((sum, t) => sum + (parseInt(t.members) || 0), 0),
    leads: new Set(teams.map(t => t.teamLead).filter(Boolean)).size
  }), [teams]);

  const filteredData = useMemo(() => {
    return teams.filter(t => {
      const matchSearch = (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchDept = deptFilter === 'All' || t.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [teams, searchTerm, statusFilter, deptFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDepartmentChange = (newDept) => {
    const deptObj = allDepartments.find(d => (d.name || d.dept_name) === newDept || `${d.name} (${d.code})` === newDept);

    // Check if current team lead belongs to new department
    const currentLead = allEmployees.find(e => String(e.id) === String(formData.teamLeadId) || (e.name || '').toLowerCase().trim() === (formData.teamLead || '').toLowerCase().trim());
    const leadDept = currentLead?.dept_name || currentLead?.department || currentLead?.department_name || '';
    const keepLead = currentLead && isDeptMatch(leadDept, newDept, currentLead.department_id, allDepartments);

    const validMemberEmps = allEmployees.filter(emp => {
      const isSelected = (formData.teamMemberIds || []).some(id => String(id) === String(emp.id));
      const empDept = emp.dept_name || emp.department || emp.department_name || '';
      return isSelected && emp.status === 'Active' && isDeptMatch(empDept, newDept, emp.department_id, allDepartments);
    });
    const validIds = validMemberEmps.map(e => e.id);

    setFormData(prev => ({
      ...prev,
      department: newDept,
      departmentId: deptObj ? deptObj.id : prev.departmentId,
      teamLead: keepLead ? prev.teamLead : '',
      teamLeadId: keepLead ? prev.teamLeadId : null,
      teamMemberIds: validIds,
      teamMemberNames: validMemberEmps.map(e => e.name),
      members: validIds.length
    }));
    if (formErrors.department) setFormErrors(prev => ({ ...prev, department: null }));
  };

  const handleAdd = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Team Name is required';
    if (!formData.code?.trim()) errors.code = 'Team Code is required';
    if (!formData.department?.trim()) errors.department = 'Department is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/organization/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          department: formData.department.trim(),
          departmentId: formData.departmentId,
          teamLead: formData.teamLead,
          teamLeadId: formData.teamLeadId,
          members: (formData.teamMemberIds || []).length || (parseInt(formData.members) || 1),
          teamMemberIds: formData.teamMemberIds,
          status: formData.status,
          description: formData.description
        })
      });

      if (res && res.error) {
        addToast(res.error, 'error');
        return;
      }

      addToast('Team created successfully!', 'success');
      await loadTeams();
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating team:", err);
      addToast(err?.message || 'Failed to create team', 'error');
    }
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormErrors({});

    const leadEmp = allEmployees.find(e => String(e.id) === String(item.team_lead_id) || (e.name || '').toLowerCase().trim() === (item.teamLead || '').toLowerCase().trim());
    const deptObj = allDepartments.find(d => (d.name || d.dept_name) === item.department || String(d.id) === String(item.department_id));

    let initialMemberIds = item.teamMemberIds || [];
    if (!initialMemberIds || initialMemberIds.length === 0) {
      const deptNorm = (item.department || '').toLowerCase().trim();
      const deptEmps = allEmployees.filter(e => (e.dept_name || e.department || e.department_name || '').toLowerCase().trim() === deptNorm);
      initialMemberIds = deptEmps.map(e => e.id);
    }

    const memberEmps = allEmployees.filter(e => initialMemberIds.some(id => String(id) === String(e.id)));

    setFormData({
      name: item.name || '',
      code: item.code || '',
      department: item.department || '',
      departmentId: deptObj ? deptObj.id : item.department_id || null,
      teamLead: item.teamLead || (leadEmp ? leadEmp.name : ''),
      teamLeadId: leadEmp ? leadEmp.id : item.team_lead_id || null,
      teamMemberIds: initialMemberIds,
      teamMemberNames: memberEmps.map(e => e.name),
      members: initialMemberIds.length,
      status: item.status || 'Active',
      description: item.description || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Team Name is required';
    if (!formData.code?.trim()) errors.code = 'Team Code is required';
    if (!formData.department?.trim()) errors.department = 'Department is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      const res = await apiFetch(`/organization/teams/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          department: formData.department.trim(),
          departmentId: formData.departmentId,
          teamLead: formData.teamLead,
          teamLeadId: formData.teamLeadId,
          members: (formData.teamMemberIds || []).length || (parseInt(formData.members) || 1),
          teamMemberIds: formData.teamMemberIds,
          status: formData.status,
          description: formData.description
        })
      });

      if (res && res.error) {
        addToast(res.error, 'error');
        return;
      }

      addToast('Team updated successfully!', 'success');
      await loadTeams();
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating team:", err);
      addToast(err?.message || 'Failed to update team', 'error');
    }
  };

  const handleOpenView = (item) => { setSelectedItem(item); setShowViewModal(true); };
  const handleOpenDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };
  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await apiFetch(`/organization/teams/${selectedItem.id}`, {
          method: 'DELETE'
        });
        addToast('Team deleted successfully', 'success');
        await loadTeams();
      } catch (err) {
        console.error("Error deleting team:", err);
        addToast('Failed to delete team', 'error');
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
                <Users size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
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
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>
                  Team Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="hrms-input"
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="Enter team name"
                  style={{ borderRadius: '10px', padding: '10px 14px', borderColor: formErrors.name ? '#EF4444' : '#CBD5E1' }}
                />
                {formErrors.name && <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div className="hrms-input-group">
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>
                  Team Code <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="hrms-input"
                  value={formData.code}
                  onChange={e => {
                    setFormData({ ...formData, code: e.target.value });
                    if (formErrors.code) setFormErrors(prev => ({ ...prev, code: null }));
                  }}
                  placeholder="Enter team code"
                  style={{ borderRadius: '10px', padding: '10px 14px', borderColor: formErrors.code ? '#EF4444' : '#CBD5E1' }}
                />
                {formErrors.code && <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>{formErrors.code}</span>}
              </div>

              {/* Department Dropdown */}
              <div className="hrms-input-group">
                <CustomSelect
                  label="Department"
                  required
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  placeholder="Select department"
                />
                {formErrors.department && <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>{formErrors.department}</span>}
              </div>

              {/* Dynamic Searchable Team Lead Selection */}
              <div className="hrms-input-group">
                <TeamLeadSelect
                  selectedDepartment={formData.department}
                  value={formData.teamLead}
                  selectedId={formData.teamLeadId}
                  employees={allEmployees}
                  departments={allDepartments}
                  loading={loadingEmployees}
                  onChange={(selectedEmp) => {
                    setFormData(prev => ({
                      ...prev,
                      teamLead: selectedEmp ? selectedEmp.name : '',
                      teamLeadId: selectedEmp ? selectedEmp.id : null
                    }));
                  }}
                />
              </div>

              {/* Dynamic Multi-Select Team Members Selection */}
              <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                <TeamMembersSelect
                  selectedDepartment={formData.department}
                  selectedMemberIds={formData.teamMemberIds || []}
                  employees={allEmployees}
                  departments={allDepartments}
                  loading={loadingEmployees}
                  onChange={(nextIds, selectedEmps) => {
                    setFormData(prev => ({
                      ...prev,
                      teamMemberIds: nextIds,
                      teamMemberNames: selectedEmps.map(e => e.name),
                      members: nextIds.length
                    }));
                  }}
                />
              </div>

              <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Status *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="teamStatus" checked={formData.status === 'Active'} onChange={() => setFormData({ ...formData, status: 'Active' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
                    Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <input type="radio" name="teamStatus" checked={formData.status === 'Inactive'} onChange={() => setFormData({ ...formData, status: 'Inactive' })} style={{ accentColor: '#2563EB', width: '16px', height: '16px' }} />
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#0A1629]">Teams</h1><p className="text-sm text-slate-500 mt-1">Manage all company teams and squads.</p></div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'teams') && (
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download size={16} /> Export</button>
          )}
          {canCreate('organization', 'teams') && (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"><Plus size={16} /> Add Team</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Teams', value: statistics.total, icon: Users, bg: '#EEF2FF', color: '#2563EB' },
          { label: 'Active Teams', value: statistics.active, icon: CheckCircle2, bg: '#ECFDF5', color: '#10B981' },
          { label: 'Team Members', value: statistics.members, icon: Users, bg: '#F5F3FF', color: '#8B5CF6' },
          { label: 'Team Leads', value: statistics.leads, icon: UserCheck, bg: '#FFF7ED', color: '#F97316' }
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
              placeholder="Search Team..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-slate-300 transition-colors shadow-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <AppDropdown
                value={statusFilter}
                onChange={v => { setStatusFilter(v); setCurrentPage(1); }}
                options={[{value:'All',label:'Status: All'},{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]}
                size="sm"
              />

            <AppDropdown
                value={deptFilter}
                onChange={v => { setDeptFilter(v); setCurrentPage(1); }}
                options={[{value:'All',label:'Department: All'}]}
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
              setDeptFilter('All');
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
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Teams Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">Create your first team.</p>
            {canCreate('organization', 'teams') && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm mb-4"
              >
                <Plus size={16} /> Add Team
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Team</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Code</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467]">Department</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Team Lead</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Members</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Created Date</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-4 text-[13px] font-semibold text-[#475467] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const styles = getTeamStyles(item.name);
                const IconComp = styles.IconComp;
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: styles.bg, color: styles.color }}><IconComp size={18} /></div>
                        <span className="font-semibold text-[#101828] text-sm whitespace-nowrap">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.code}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.department}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.teamLead || 'Unassigned'}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {item.members || 0} Members
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm whitespace-nowrap">{item.createdDate || '12 Jan 2026'}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenView(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Eye size={16} /></button>
                        {canEdit('organization', 'teams') && (
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
                        )}
                        {canDelete('organization', 'teams') && (
                          <button onClick={() => handleOpenDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {paginatedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"><ChevronLeft size={16} /></button>
              <span className="font-semibold text-slate-700">{currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {renderFormModal('Add Team', 'Create a new team and assign members.', showAddModal, () => setShowAddModal(false), handleSaveAdd, 'Save Team')}
      {renderFormModal('Edit Team', 'Update team details and member assignments.', showEditModal, () => setShowEditModal(false), handleSaveEdit, 'Update Team')}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content">
            <div className="p-8 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">{selectedItem.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedItem.code} • {selectedItem.department}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><p className="text-slate-400 font-medium">Team Lead</p><p className="text-slate-800 font-semibold mt-1">{selectedItem.teamLead || 'Unassigned'}</p></div>
                <div><p className="text-slate-400 font-medium">Department</p><p className="text-slate-800 font-semibold mt-1">{selectedItem.department}</p></div>
                <div><p className="text-slate-400 font-medium">Member Count</p><p className="text-slate-800 font-semibold mt-1">{selectedItem.members} Members</p></div>
                <div><p className="text-slate-400 font-medium">Status</p><p className="text-slate-800 font-semibold mt-1">{selectedItem.status}</p></div>
              </div>
              {selectedItem.description && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-slate-400 font-medium text-sm">Description</p>
                  <p className="text-slate-600 text-sm mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedItem.description}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end p-8 border-t border-slate-200 shrink-0">
              <button onClick={() => setShowViewModal(false)} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors">Close</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowDeleteModal(false)} />
          <div className="modal-centered-content max-w-md p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
            <h3 className="text-lg font-bold text-slate-800">Delete Team?</h3>
            <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-6 h-11 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Teams;
