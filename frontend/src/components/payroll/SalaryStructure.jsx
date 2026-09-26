import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import {
  Plus, Edit2, Trash2, Eye, Building2, CheckCircle2, Wallet, Users,
  ChevronLeft, ChevronRight, Loader2, X, UserCheck, AlertCircle, ArrowRight
} from 'lucide-react';
import { hasPermission } from '../../lib/permissions';

export default function SalaryStructure() {
  const { addToast } = useToast();
  const [structures, setStructures] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create Form State
  const [structName, setStructName] = useState('');
  const [structCode, setStructCode] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [totalCtc, setTotalCtc] = useState('');
  const [selectedComponents, setSelectedComponents] = useState([]);

  // Edit Form State
  const [editingStructure, setEditingStructure] = useState(null);
  const [editStructName, setEditStructName] = useState('');
  const [editStructCode, setEditStructCode] = useState('');
  const [editFrequency, setEditFrequency] = useState('Monthly');
  const [editTotalCtc, setEditTotalCtc] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editComponents, setEditComponents] = useState([]);

  // Delete State
  const [deletingStructure, setDeletingStructure] = useState(null);

  // Assign Form State
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignStructId, setAssignStructId] = useState('');
  const [customGross, setCustomGross] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [structData, compData, empData] = await Promise.all([
        apiFetch('/payroll/structures'),
        apiFetch('/payroll/components'),
        apiFetch('/employees?status=Active')
      ]);

      if (Array.isArray(structData)) setStructures(structData);
      else setStructures([]);

      if (Array.isArray(compData)) setAvailableComponents(compData);
      else setAvailableComponents([]);

      if (Array.isArray(empData)) setActiveEmployees(empData);
      else if (empData && Array.isArray(empData.data)) setActiveEmployees(empData.data);
    } catch (err) {
      console.error("Failed to load structures data:", err);
      addToast('Failed to load salary structure records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openCreateModal = async () => {
    setStructName('');
    setStructCode('');
    setFrequency('Monthly');
    setTotalCtc('');
    let comps = availableComponents;
    if (!comps || comps.length === 0) {
      try {
        const compData = await apiFetch('/payroll/components');
        if (Array.isArray(compData)) {
          comps = compData;
          setAvailableComponents(compData);
        }
      } catch (err) {
        console.error("Failed to load components:", err);
      }
    }
    // Preselect active components
    setSelectedComponents((comps || []).map(c => ({
      component_id: c.id,
      component_name: c.name,
      component_type: c.type,
      calc_type: c.calc_type || 'percentage',
      value: c.percentage_value || c.default_amount || 0,
      percentage_basis: c.percentage_basis || 'basic',
      enabled: true
    })));
    setShowCreateModal(true);
  };

  const openEditModal = async (structure) => {
    setEditingStructure(structure);
    setEditStructName(structure.name || '');
    setEditStructCode(structure.code || '');
    setEditFrequency(structure.frequency || 'Monthly');
    setEditTotalCtc(structure.total_ctc || '');
    setEditStatus(structure.status || 'Active');

    try {
      const res = await apiFetch(`/payroll/structures/${structure.id}`);
      const structDetail = res?.data || res;
      const assignedComps = structDetail?.components || [];

      const mapped = availableComponents.map(c => {
        const existing = assignedComps.find(ac => ac.component_id === c.id);
        return {
          component_id: c.id,
          component_name: c.name,
          component_type: c.type,
          calc_type: existing ? existing.calc_type : (c.calc_type || 'percentage'),
          value: existing ? (existing.value || 0) : (c.percentage_value || c.default_amount || 0),
          percentage_basis: existing ? existing.percentage_basis : (c.percentage_basis || 'basic'),
          enabled: !!existing
        };
      });
      setEditComponents(mapped);
    } catch (err) {
      setEditComponents(availableComponents.map(c => ({
        component_id: c.id,
        component_name: c.name,
        component_type: c.type,
        calc_type: c.calc_type || 'percentage',
        value: c.percentage_value || c.default_amount || 0,
        percentage_basis: c.percentage_basis || 'basic',
        enabled: true
      })));
    }
    setShowEditModal(true);
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (!structName.trim()) {
      addToast('Structure name is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const enabledComps = selectedComponents.filter(c => c.enabled);
      const payload = {
        name: structName.trim(),
        code: structCode.trim() || undefined,
        frequency,
        total_ctc: parseFloat(totalCtc) || 0,
        status: 'Active',
        components: enabledComps
      };

      const res = await apiFetch('/payroll/structures', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast('Salary structure created successfully', 'success');
        setShowCreateModal(false);
        loadAllData();
      } else {
        addToast(res.message || res.error || 'Failed to create structure', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error creating structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStructure = async (e) => {
    e.preventDefault();
    if (!editStructName.trim()) {
      addToast('Structure name is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const enabledComps = editComponents.filter(c => c.enabled);
      const payload = {
        name: editStructName.trim(),
        code: editStructCode.trim() || undefined,
        frequency: editFrequency,
        total_ctc: parseFloat(editTotalCtc) || 0,
        status: editStatus,
        components: enabledComps
      };

      const res = await apiFetch(`/payroll/structures/${editingStructure.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast('Salary structure updated successfully', 'success');
        setShowEditModal(false);
        setEditingStructure(null);
        loadAllData();
      } else {
        addToast(res.message || res.error || 'Failed to update structure', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error updating structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (structure) => {
    setDeletingStructure(structure);
    setShowDeleteModal(true);
  };

  const handleDeleteStructure = async () => {
    if (!deletingStructure) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/payroll/structures/${deletingStructure.id}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        addToast('Salary structure deleted successfully', 'success');
        setShowDeleteModal(false);
        setDeletingStructure(null);
        loadAllData();
      } else {
        addToast(res.message || 'Failed to delete structure', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStructure = async (e) => {
    e.preventDefault();
    if (!assignEmpId || !assignStructId) {
      addToast('Please select both an employee and a salary structure', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employee_id: assignEmpId,
        structure_id: assignStructId,
        effective_from: effectiveFrom || null,
        custom_gross: customGross ? parseFloat(customGross) : null
      };

      const res = await apiFetch('/payroll/structures/assign', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast('Salary structure assigned to employee successfully!', 'success');
        setShowAssignModal(false);
        loadAllData();
      } else {
        addToast(res.message || 'Failed to assign structure', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error assigning structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = async () => {
    setAssignEmpId('');
    setCustomGross('');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);

    let sList = structures;
    let eList = activeEmployees;

    if (!sList || sList.length === 0 || !eList || eList.length === 0) {
      try {
        const [structData, empData] = await Promise.all([
          apiFetch('/payroll/structures'),
          apiFetch('/employees?status=Active')
        ]);
        if (Array.isArray(structData)) {
          sList = structData;
          setStructures(structData);
        } else if (structData?.data && Array.isArray(structData.data)) {
          sList = structData.data;
          setStructures(structData.data);
        }
        if (Array.isArray(empData)) {
          eList = empData;
          setActiveEmployees(empData);
        } else if (empData?.data && Array.isArray(empData.data)) {
          eList = empData.data;
          setActiveEmployees(empData.data);
        } else if (empData?.employees && Array.isArray(empData.employees)) {
          eList = empData.employees;
          setActiveEmployees(empData.employees);
        }
      } catch (err) {
        console.error("Failed to load assign modal dependencies:", err);
      }
    }

    setAssignStructId(sList && sList.length > 0 ? String(sList[0].id) : '');
    setShowAssignModal(true);
  };

  const handleEmployeeSelect = (empId) => {
    setAssignEmpId(empId);
    const emp = activeEmployees.find(e => String(e.id) === String(empId));
    if (emp && emp.salary) {
      setCustomGross(emp.salary);
    }
  };

  const totalStructures = structures.length;
  const activeStructures = structures.filter(s => s.status === 'Active').length;
  const totalEmployeesMapped = structures.reduce((acc, curr) => acc + (Number(curr.employees) || 0), 0);
  const totalAmount = structures.reduce((acc, curr) => acc + (Number(curr.total_ctc) || 0), 0);
  const avgCtc = totalStructures > 0 ? (totalAmount / totalStructures) : 0;
  const avgCtcFormatted = avgCtc > 0 ? `₹ ${(avgCtc / 100000).toFixed(1)}L` : '₹ 0';

  const kpiData = [
    { title: 'Total Structures', value: String(totalStructures), icon: <Building2 size={24} color="#2563EB" />, bgColor: '#EFF6FF' },
    { title: 'Active Structures', value: String(activeStructures), icon: <CheckCircle2 size={24} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Average CTC', value: avgCtcFormatted, icon: <Wallet size={24} color="#8B5CF6" />, bgColor: '#F5F3FF' },
    { title: 'Employees Mapped', value: String(totalEmployeesMapped), icon: <Users size={24} color="#2563EB" />, bgColor: '#EFF6FF' },
  ];

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    border: '1px solid #F1F5F9',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  };

  const selectedEmployee = activeEmployees.find(emp => String(emp.id) === String(assignEmpId));
  const selectedStructure = structures.find(str => String(str.id) === String(assignStructId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0', background: '#F8FAFC', minHeight: '100%', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>Salary Structures</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Create organizational compensation plans and assign structures to employees</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasPermission('payroll', 'salary_structure', 'create') && (
            <>
              <button
                onClick={openAssignModal}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                <UserCheck size={16} /> Assign to Employee
              </button>
              <button
                onClick={openCreateModal}
                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
              >
                <Plus size={16} /> Add Structure
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {kpiData.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.title}</div>
              <div style={{ fontSize: '20px', color: '#1E293B', fontWeight: '800' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 className="animate-spin text-blue-600" size={28} style={{ margin: '0 auto 8px' }} />
              <span>Loading salary structures...</span>
            </div>
          ) : structures.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <AlertCircle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No salary structures found in database</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Click "Add Structure" to create your first compensation template.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Structure Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Code</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Base Monthly CTC</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Frequency</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Active Employees</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{row.name}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{row.code || `STR-${row.id}`}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#2563EB' }}>
                      ₹ {Number(row.total_ctc || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{row.frequency || 'Monthly'}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: '#10B981', fontWeight: '700' }}>
                      {row.employees || 0} Employee(s)
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: row.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                        color: row.status === 'Active' ? '#10B981' : '#EF4444',
                        border: row.status === 'Active' ? '1px solid #A7F3D0' : '1px solid #FECACA'
                      }}>
                        {row.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {hasPermission('payroll', 'salary_structure', 'edit') && (
                          <button
                            onClick={() => openEditModal(row)}
                            title="Edit Structure"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                        {hasPermission('payroll', 'salary_structure', 'delete') && (
                          <button
                            onClick={() => openDeleteModal(row)}
                            title="Delete Structure"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#EF4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Create Salary Structure */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '740px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

            {/* Header matching Reference Image */}
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #3B82F6 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '40px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.16)', border: '1.5px solid rgba(255, 255, 255, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <Wallet size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>Create Salary Structure</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>Define compensation package, base CTC, and salary components</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid rgba(255, 255, 255, 0.28)', background: 'rgba(255, 255, 255, 0.16)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body: 2-Column Grid */}
            <form onSubmit={handleCreateStructure} style={{ padding: '26px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 20px' }}>

                {/* Row 1: Structure Name & Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Structure Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={structName}
                    onChange={e => setStructName(e.target.value)}
                    placeholder="e.g. Senior Software Engineer Band 4"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Structure Code
                  </label>
                  <input
                    type="text"
                    value={structCode}
                    onChange={e => setStructCode(e.target.value)}
                    placeholder="e.g. ENG-SDE-04 (auto-generated if empty)"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Row 2: Monthly CTC & Frequency */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Monthly Base CTC (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={totalCtc}
                    onChange={e => setTotalCtc(e.target.value)}
                    placeholder="e.g. 75000"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Pay Frequency <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={frequency}
                    onChange={v => setFrequency(v)}
                    options={[
                      { value: 'Monthly', label: 'Monthly' },
                      { value: 'Bi-Weekly', label: 'Bi-Weekly' },
                      { value: 'Annual', label: 'Annual' }
                    ]}
                    size="md"
                  />
                </div>

                {/* Row 3: Projected Annual CTC & Structure Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Projected Annual CTC
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#2563EB', fontWeight: '700', boxSizing: 'border-box' }}>
                    {totalCtc && parseFloat(totalCtc) > 0 ? `₹ ${Number(parseFloat(totalCtc) * (frequency === 'Annual' ? 1 : frequency === 'Bi-Weekly' ? 26 : 12)).toLocaleString('en-IN')} / Year` : '₹ 0 / Year'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Structure Status
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#059669', fontWeight: '700', boxSizing: 'border-box' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                    Active Structure
                  </div>
                </div>

              </div>

              {/* Row 4: Components Table */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                    Attach Salary Components to Structure
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                    {selectedComponents.filter(c => c.enabled).length} of {selectedComponents.length} components selected
                  </span>
                </div>

                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', background: '#FFFFFF' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '45px', color: '#64748B', fontWeight: '700' }}>Include</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: '700' }}>Component</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '110px', color: '#64748B', fontWeight: '700' }}>Type</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '130px', color: '#64748B', fontWeight: '700' }}>Mode</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '130px', color: '#64748B', fontWeight: '700' }}>Value / %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedComponents.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                            Loading salary components...
                          </td>
                        </tr>
                      ) : (
                        selectedComponents.map((comp, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: comp.enabled ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={comp.enabled}
                                onChange={e => {
                                  const copy = [...selectedComponents];
                                  copy[idx].enabled = e.target.checked;
                                  setSelectedComponents(copy);
                                }}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                              />
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: '600', color: comp.enabled ? '#1E293B' : '#94A3B8' }}>
                              {comp.component_name}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: comp.component_type === 'Earning' ? '#ECFDF5' : '#FEF2F2',
                                color: comp.component_type === 'Earning' ? '#059669' : '#DC2626',
                                border: comp.component_type === 'Earning' ? '1px solid #A7F3D0' : '1px solid #FECACA'
                              }}>
                                {comp.component_type}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748B', textTransform: 'capitalize', fontWeight: '500' }}>
                              {comp.calc_type || 'percentage'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  disabled={!comp.enabled}
                                  value={comp.value}
                                  onChange={e => {
                                    const copy = [...selectedComponents];
                                    copy[idx].value = parseFloat(e.target.value) || 0;
                                    setSelectedComponents(copy);
                                  }}
                                  style={{
                                    width: '85px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #CBD5E1',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    textAlign: 'right',
                                    background: comp.enabled ? '#FFFFFF' : '#F1F5F9',
                                    color: comp.enabled ? '#0F172A' : '#94A3B8',
                                    outline: 'none'
                                  }}
                                />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                                  {comp.calc_type === 'fixed' ? '₹' : '%'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '11px 22px', borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '11px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Salary Structure
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 2: Assign Structure to Employee */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '680px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

            {/* Header matching Reference Image */}
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #3B82F6 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '40px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.16)', border: '1.5px solid rgba(255, 255, 255, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <UserCheck size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>Assign Salary Structure</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>Assign an organizational compensation plan to an employee</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid rgba(255, 255, 255, 0.28)', background: 'rgba(255, 255, 255, 0.16)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body: 2-Column Grid matching Reference Image */}
            <form onSubmit={handleAssignStructure} style={{ padding: '26px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 20px' }}>

                {/* Row 1: Employee Name & Employee ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Employee Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={assignEmpId}
                    onChange={handleEmployeeSelect}
                    options={[
                      { value: '', label: '-- Select Active Employee --' },
                      ...activeEmployees.map(emp => ({
                        value: String(emp.id),
                        label: emp.name,
                        sublabel: `${emp.employee_code || emp.emp_code || (emp.id ? `EMP${String(emp.id).padStart(4, '0')}` : '')}${emp.designation ? ` • ${emp.designation}` : ''}`
                      }))
                    ]}
                    placeholder="Search or select employee..."
                    searchable={true}
                    size="md"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Employee ID
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: selectedEmployee ? '#1E293B' : '#94A3B8', fontWeight: selectedEmployee ? '700' : '500', boxSizing: 'border-box' }}>
                    {selectedEmployee ? (selectedEmployee.employee_code || selectedEmployee.emp_code || (selectedEmployee.id ? `EMP${String(selectedEmployee.id).padStart(4, '0')}` : '')) : 'Select an employee...'}
                  </div>
                </div>

                {/* Row 2: Department / Designation & Current Base Salary */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Department / Designation
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: selectedEmployee ? '#334155' : '#94A3B8', fontWeight: '600', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedEmployee ? (selectedEmployee.department_name || selectedEmployee.department || selectedEmployee.designation || 'General Staff') : 'Select an employee...'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Current Base Salary
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#2563EB', fontWeight: '700', boxSizing: 'border-box' }}>
                    {selectedEmployee ? (selectedEmployee.salary ? `₹ ${Number(selectedEmployee.salary).toLocaleString('en-IN')} / month` : 'Not Configured') : '—'}
                  </div>
                </div>

                {/* Row 3: Salary Structure & Standard Structure CTC */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Salary Structure <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={assignStructId}
                    onChange={v => setAssignStructId(v)}
                    options={[
                      { value: '', label: '-- Select Salary Structure --' },
                      ...structures.map(s => ({
                        value: String(s.id),
                        label: s.name,
                        sublabel: `${s.code || `STR-${s.id}`} • ₹${Number(s.total_ctc || 0).toLocaleString('en-IN')}`
                      }))
                    ]}
                    placeholder="Select Salary Structure..."
                    searchable={true}
                    size="md"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Standard Structure CTC
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#059669', fontWeight: '700', boxSizing: 'border-box' }}>
                    {selectedStructure ? `₹ ${Number(selectedStructure.total_ctc || 0).toLocaleString('en-IN')} (${selectedStructure.frequency || 'Monthly'})` : 'Select a structure...'}
                  </div>
                </div>

                {/* Row 4: Effective Date & Custom Monthly Gross Override */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Effective From Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={e => setEffectiveFrom(e.target.value)}
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Custom Monthly Gross Override (₹)
                  </label>
                  <input
                    type="number"
                    value={customGross}
                    onChange={e => setCustomGross(e.target.value)}
                    placeholder="e.g. 65000 (optional override)"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{ padding: '11px 22px', borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '11px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Assign Structure
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 3: Edit Salary Structure */}
      {showEditModal && editingStructure && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '740px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

            {/* Header matching Reference Image */}
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #3B82F6 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '40px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.16)', border: '1.5px solid rgba(255, 255, 255, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <Edit2 size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>Edit Salary Structure</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>Modify compensation terms and component allocations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid rgba(255, 255, 255, 0.28)', background: 'rgba(255, 255, 255, 0.16)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body: 2-Column Grid */}
            <form onSubmit={handleUpdateStructure} style={{ padding: '26px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 20px' }}>

                {/* Row 1: Structure Name & Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Structure Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editStructName}
                    onChange={e => setEditStructName(e.target.value)}
                    placeholder="e.g. Executive Senior Level"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Structure Code
                  </label>
                  <input
                    type="text"
                    value={editStructCode}
                    onChange={e => setEditStructCode(e.target.value)}
                    placeholder="STR-001"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Row 2: Monthly CTC & Frequency */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Monthly Base CTC (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editTotalCtc}
                    onChange={e => setEditTotalCtc(e.target.value)}
                    placeholder="e.g. 50000"
                    style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '13.5px', fontWeight: '500', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Pay Frequency <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={editFrequency}
                    onChange={v => setEditFrequency(v)}
                    options={[
                      { value: 'Monthly', label: 'Monthly' },
                      { value: 'Bi-Weekly', label: 'Bi-Weekly' },
                      { value: 'Annual', label: 'Annual' }
                    ]}
                    size="md"
                  />
                </div>

                {/* Row 3: Projected Annual CTC & Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Projected Annual CTC
                  </label>
                  <div style={{ width: '100%', height: '46px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#2563EB', fontWeight: '700', boxSizing: 'border-box' }}>
                    {editTotalCtc && parseFloat(editTotalCtc) > 0 ? `₹ ${Number(parseFloat(editTotalCtc) * (editFrequency === 'Annual' ? 1 : editFrequency === 'Bi-Weekly' ? 26 : 12)).toLocaleString('en-IN')} / Year` : '₹ 0 / Year'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '7px' }}>
                    Status <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={editStatus}
                    onChange={v => setEditStatus(v)}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                    size="md"
                  />
                </div>

              </div>

              {/* Row 4: Components Table */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                    Attached Salary Components
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                    {editComponents.filter(c => c.enabled).length} of {editComponents.length} components selected
                  </span>
                </div>

                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', background: '#FFFFFF' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '45px', color: '#64748B', fontWeight: '700' }}>Include</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: '700' }}>Component</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '110px', color: '#64748B', fontWeight: '700' }}>Type</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '130px', color: '#64748B', fontWeight: '700' }}>Mode</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', width: '130px', color: '#64748B', fontWeight: '700' }}>Value / %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editComponents.map((comp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: comp.enabled ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={comp.enabled}
                              onChange={e => {
                                const copy = [...editComponents];
                                copy[idx].enabled = e.target.checked;
                                setEditComponents(copy);
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: comp.enabled ? '#1E293B' : '#94A3B8' }}>
                            {comp.component_name}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: comp.component_type === 'Earning' ? '#ECFDF5' : '#FEF2F2',
                              color: comp.component_type === 'Earning' ? '#059669' : '#DC2626',
                              border: comp.component_type === 'Earning' ? '1px solid #A7F3D0' : '1px solid #FECACA'
                            }}>
                              {comp.component_type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B', textTransform: 'capitalize', fontWeight: '500' }}>
                            {comp.calc_type || 'percentage'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                disabled={!comp.enabled}
                                value={comp.value}
                                onChange={e => {
                                  const copy = [...editComponents];
                                  copy[idx].value = parseFloat(e.target.value) || 0;
                                  setEditComponents(copy);
                                }}
                                style={{
                                  width: '85px',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #CBD5E1',
                                  fontSize: '12.5px',
                                  fontWeight: '600',
                                  textAlign: 'right',
                                  background: comp.enabled ? '#FFFFFF' : '#F1F5F9',
                                  color: comp.enabled ? '#0F172A' : '#94A3B8',
                                  outline: 'none'
                                }}
                              />
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                                {comp.calc_type === 'fixed' ? '₹' : '%'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '11px 22px', borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '11px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Update Salary Structure
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation */}
      {showDeleteModal && deletingStructure && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '460px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 55%, #EF4444 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', border: '1.5px solid rgba(255, 255, 255, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={20} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>Delete Salary Structure</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)' }}>Permanent removal confirmation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingStructure(null);
                }}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1.5px solid rgba(255, 255, 255, 0.28)', background: 'rgba(255, 255, 255, 0.16)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                Are you sure you want to delete <strong style={{ color: '#1E293B' }}>"{deletingStructure.name}"</strong> ({deletingStructure.code || `STR-${deletingStructure.id}`})? Any employees mapped to this structure will be unassigned.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingStructure(null);
                  }}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStructure}
                  disabled={saving}
                  style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Confirm Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
