import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../context/PermissionContext';
import {
  Search, Plus, Layers, TrendingUp, TrendingDown, Landmark,
  Edit2, Trash2, X, CheckCircle2, AlertCircle, Loader2, DollarSign, Percent, ShieldCheck
} from 'lucide-react';

export default function SalaryComponents() {
  const { addToast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Earning'); // 'Earning' | 'Deduction' | 'Contribution'
  const [calcType, setCalcType] = useState('fixed'); // 'fixed' | 'percentage' | 'formula'
  const [percentageValue, setPercentageValue] = useState(0);
  const [percentageBasis, setPercentageBasis] = useState('basic'); // 'basic' | 'gross'
  const [defaultAmount, setDefaultAmount] = useState(0);
  const [taxable, setTaxable] = useState('Yes');
  const [isStatutory, setIsStatutory] = useState(false);
  const [status, setStatus] = useState('Active');

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/payroll/components');
      if (Array.isArray(data)) setComponents(data);
      else setComponents([]);
    } catch (err) {
      console.error("Failed to load components:", err);
      addToast('Failed to load salary components', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const openCreateModal = () => {
    if (!canCreate('payroll', 'salary_components')) {
      addToast('You do not have permission to add salary components', 'error');
      return;
    }
    setModalMode('create');
    setEditingId(null);
    setName('');
    setType('Earning');
    setCalcType('fixed');
    setPercentageValue(0);
    setPercentageBasis('basic');
    setDefaultAmount(0);
    setTaxable('Yes');
    setIsStatutory(false);
    setStatus('Active');
    setShowModal(true);
  };

  const openEditModal = (comp) => {
    if (!canEdit('payroll', 'salary_components')) {
      addToast('You do not have permission to edit salary components', 'error');
      return;
    }
    setModalMode('edit');
    setEditingId(comp.id);
    setName(comp.name || '');
    setType(comp.type || 'Earning');
    setCalcType(comp.calc_type || 'fixed');
    setPercentageValue(comp.percentage_value || 0);
    setPercentageBasis(comp.percentage_basis || 'basic');
    setDefaultAmount(comp.default_amount || 0);
    setTaxable(comp.taxable || 'Yes');
    setIsStatutory(Boolean(comp.is_statutory));
    setStatus(comp.status || 'Active');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Component name is required', 'warning');
      return;
    }

    if (modalMode === 'create' && !canCreate('payroll', 'salary_components')) {
      addToast('Permission Denied: You do not have permission to create salary components.', 'error');
      return;
    }
    if (modalMode === 'edit' && !canEdit('payroll', 'salary_components')) {
      addToast('Permission Denied: You do not have permission to edit salary components.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        calc_type: calcType,
        percentage_value: parseFloat(percentageValue) || 0,
        percentage_basis: percentageBasis,
        default_amount: parseFloat(defaultAmount) || 0,
        taxable,
        is_statutory: isStatutory ? 1 : 0,
        status
      };

      if (modalMode === 'create') {
        const res = await apiFetch('/payroll/components', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res && res.success) {
          addToast('Salary component created successfully', 'success');
          setShowModal(false);
          fetchComponents();
        } else {
          addToast(res.message || 'Failed to create component', 'error');
        }
      } else {
        const res = await apiFetch(`/payroll/components/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res && res.success) {
          addToast('Salary component updated successfully', 'success');
          setShowModal(false);
          fetchComponents();
        } else {
          addToast(res.message || 'Failed to update component', 'error');
        }
      }
    } catch (err) {
      addToast(err.message || 'Error saving component', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete('payroll', 'salary_components')) {
      addToast('Permission Denied: You do not have permission to delete salary components.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this salary component?')) return;
    try {
      const res = await apiFetch(`/payroll/components/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        addToast('Component deleted successfully', 'success');
        fetchComponents();
      } else {
        addToast(res.message || 'Failed to delete component', 'error');
      }
    } catch (err) {
      addToast('Error deleting component', 'error');
    }
  };

  const filteredComponents = components.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !search.trim() || (c.name && c.name.toLowerCase().includes(q));
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalComp = components.length;
  const earningsCount = components.filter(c => c.type === 'Earning').length;
  const deductionsCount = components.filter(c => c.type === 'Deduction').length;
  const statutoryCount = components.filter(c => c.is_statutory).length;

  const kpiData = [
    { title: 'Total Components', value: String(totalComp), icon: <Layers size={20} color="#2563EB" />, bgColor: '#EFF6FF' },
    { title: 'Earnings Types', value: String(earningsCount), icon: <TrendingUp size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Deductions Types', value: String(deductionsCount), icon: <TrendingDown size={20} color="#EF4444" />, bgColor: '#FEF2F2' },
    { title: 'Statutory Rules', value: String(statutoryCount), icon: <ShieldCheck size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
  ];

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>Salary Components</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Configure fixed and percentage-based earnings and deduction rules</p>
        </div>
        {canCreate('payroll', 'salary_components') && (
          <button
            onClick={openCreateModal}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          >
            <Plus size={16} /> Add Component
          </button>
        )}
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

      {/* Main Table Container */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>

        {/* Table Toolbar */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search component name..."
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
              />
            </div>

            <AppDropdown
              value={typeFilter}
              onChange={v => setTypeFilter(v)}
              options={[{ value: 'All', label: 'All Types' }, { value: 'Earning', label: 'Earnings' }, { value: 'Deduction', label: 'Deductions' }, { value: 'Contribution', label: 'Contributions' }]}
              size="sm"
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 className="animate-spin text-blue-600" size={28} style={{ margin: '0 auto 8px' }} />
              <span>Loading salary components...</span>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <AlertCircle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No salary components configured</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Click "Add Component" to create your first earning or deduction rule.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Component Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Type</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Calculation Mode</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Configured Value</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Taxable</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Status</th>
                  {(canEdit('payroll', 'salary_components') || canDelete('payroll', 'salary_components')) && (
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'right' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {row.name}
                        {row.is_statutory ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                            Statutory
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: row.type === 'Earning' ? '#ECFDF5' : row.type === 'Deduction' ? '#FEF2F2' : '#FFFBEB',
                        color: row.type === 'Earning' ? '#059669' : row.type === 'Deduction' ? '#DC2626' : '#D97706'
                      }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', textTransform: 'capitalize' }}>
                      {row.calc_type === 'percentage' ? `Percentage of ${row.percentage_basis || 'Basic'}` : row.calc_type || 'Fixed Amount'}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      {row.calc_type === 'percentage'
                        ? `${row.percentage_value || 0}% of ${row.percentage_basis || 'Basic'}`
                        : `₹ ${parseFloat(row.default_amount || 0).toLocaleString('en-IN')}`
                      }
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>{row.taxable || 'Yes'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: row.status === 'Active' ? '#ECFDF5' : '#F1F5F9',
                        color: row.status === 'Active' ? '#059669' : '#64748B',
                        border: row.status === 'Active' ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
                      }}>
                        {row.status || 'Active'}
                      </span>
                    </td>
                    {(canEdit('payroll', 'salary_components') || canDelete('payroll', 'salary_components')) && (
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {canEdit('payroll', 'salary_components') && (
                            <button
                              onClick={() => openEditModal(row)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#2563EB', cursor: 'pointer' }}
                              title="Edit Component"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete('payroll', 'salary_components') && (
                            <button
                              onClick={() => handleDelete(row.id)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}
                              title="Delete Component"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Component */}
      {showModal && (modalMode === 'edit' ? canEdit('payroll', 'salary_components') : canCreate('payroll', 'salary_components')) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '540px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>

            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '24px 28px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <Layers size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {modalMode === 'create' ? 'Add Salary Component' : 'Edit Salary Component'}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Configure earning, deduction, or statutory component details
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowModal(false)} 
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#FFFFFF' }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Component Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Basic Salary, Conveyance Allowance, Special Bonus"
                  style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Type <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={type}
                    onChange={v => setType(v)}
                    options={[{ value: 'Earning', label: 'Earning' }, { value: 'Deduction', label: 'Deduction' }, { value: 'Contribution', label: 'Contribution' }]}
                    size="sm"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Calculation Mode <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={calcType}
                    onChange={v => setCalcType(v)}
                    options={[{ value: 'fixed', label: 'Fixed Amount (₹)' }, { value: 'percentage', label: 'Percentage (%)' }, { value: 'formula', label: 'Formula / Balance Remainder' }]}
                    size="sm"
                  />
                </div>
              </div>

              {calcType === 'percentage' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                      Percentage Value (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={percentageValue}
                      onChange={e => setPercentageValue(e.target.value)}
                      placeholder="e.g. 50, 40, 12"
                      style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FFF', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                      Calculated On
                    </label>
                    <AppDropdown
                      value={percentageBasis}
                      onChange={v => setPercentageBasis(v)}
                      options={[{ value: 'basic', label: 'Basic Salary' }, { value: 'gross', label: 'Gross / Base Salary' }]}
                      size="sm"
                    />
                  </div>
                </div>
              )}

              {calcType === 'fixed' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Default Fixed Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={defaultAmount}
                    onChange={e => setDefaultAmount(e.target.value)}
                    placeholder="e.g. 200, 1500"
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Taxable Under IT
                  </label>
                  <AppDropdown
                    value={taxable}
                    onChange={v => setTaxable(v)}
                    options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }, { value: 'Partial', label: 'Partial' }]}
                    size="sm"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="statutoryCheck"
                    checked={isStatutory}
                    onChange={e => setIsStatutory(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                  />
                  <label htmlFor="statutoryCheck" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Statutory Component (PF/ESI/PT)
                  </label>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ height: '44px', padding: '0 20px', borderRadius: '11px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ height: '44px', padding: '0 26px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)'}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {modalMode === 'create' ? 'Create Component' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
