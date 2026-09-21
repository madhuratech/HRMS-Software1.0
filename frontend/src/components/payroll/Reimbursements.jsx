import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../context/PermissionContext';
import { 
  Search, Plus, Receipt, CheckCircle2, XCircle, DollarSign, 
  Loader2, AlertCircle, Check, X, ShieldCheck 
} from 'lucide-react';

export default function Reimbursements() {
  const { addToast } = useToast();
  const { canCreate, canEdit } = usePermissions();
  const [claims, setClaims] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsData, empData] = await Promise.all([
        apiFetch('/payroll/reimbursements'),
        apiFetch('/employees?status=Active')
      ]);

      if (Array.isArray(claimsData)) setClaims(claimsData);
      else setClaims([]);

      if (Array.isArray(empData)) setActiveEmployees(empData);
      else if (empData && Array.isArray(empData.data)) setActiveEmployees(empData.data);
    } catch (err) {
      console.error("Failed to load claims:", err);
      addToast('Failed to load reimbursement claims', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!employeeId || !amount) {
      addToast('Please select an employee and specify the claim amount', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employee_id: employeeId,
        title: title.trim() || 'Business Expense Claim',
        amount: parseFloat(amount),
        date: claimDate,
        description: description.trim()
      };

      const res = await apiFetch('/payroll/reimbursements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast('Expense reimbursement claim added and approved for payroll!', 'success');
        setShowModal(false);
        setTitle('');
        setAmount('');
        setDescription('');
        loadData();
      } else {
        addToast(res.message || 'Failed to add claim', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error creating claim', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/payroll/reimbursements/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.success) {
        addToast(`Claim marked as ${newStatus}`, 'success');
        loadData();
      } else {
        addToast(res.message || 'Failed to update claim status', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  const totalAmount = claims.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  const approvedAmount = claims.filter(c => c.status === 'Approved').reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  const processedAmount = claims.filter(c => c.status === 'Processed').reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  const pendingCount = claims.filter(c => c.status === 'Pending').length;

  const kpiData = [
    { title: 'Total Claims Filed', value: `₹ ${totalAmount.toLocaleString('en-IN')}`, icon: <Receipt size={20} color="#2563EB" />, bgColor: '#EFF6FF' },
    { title: 'Approved for Payroll', value: `₹ ${approvedAmount.toLocaleString('en-IN')}`, icon: <CheckCircle2 size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Disbursed in Payslips', value: `₹ ${processedAmount.toLocaleString('en-IN')}`, icon: <ShieldCheck size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
    { title: 'Pending Approval', value: String(pendingCount), icon: <DollarSign size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
  ];

  const filteredClaims = claims.filter(c => {
    const q = search.toLowerCase();
    const name = (c.employee_name || '').toLowerCase();
    const code = (c.emp_code || '').toLowerCase();
    const t = (c.title || '').toLowerCase();
    const cat = (c.category_name || '').toLowerCase();
    return !search.trim() || name.includes(q) || code.includes(q) || t.includes(q) || cat.includes(q);
  });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>Expense Reimbursements</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Employee business expense claims and automated reimbursement via monthly payroll</p>
        </div>
        {canCreate('payroll', 'reimbursements') && (
          <button
            onClick={() => {
              setEmployeeId(activeEmployees[0]?.id || '');
              setShowModal(true);
            }}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          >
            <Plus size={16} /> Add Expense Claim
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
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee or claim title..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table Content */}
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 className="animate-spin text-blue-600" size={28} style={{ margin: '0 auto 8px' }} />
              <span>Loading reimbursement claims...</span>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <AlertCircle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No reimbursement claims found</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Click "Add Expense Claim" to submit a reimbursement.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Employee</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Claim Title</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Category</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Amount</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Claim Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Payroll Status</th>
                  {canEdit('payroll', 'reimbursements') && (
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'right' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      {row.employee_name}
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: '500' }}>{row.emp_code}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>{row.title}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>{row.category_name || 'General Expense'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#10B981' }}>
                      ₹ {parseFloat(row.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>
                      {row.date ? new Date(row.date).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: row.status === 'Processed' ? '#EFF6FF' : row.status === 'Approved' ? '#ECFDF5' : '#FFFBEB',
                        color: row.status === 'Processed' ? '#2563EB' : row.status === 'Approved' ? '#059669' : '#D97706',
                        border: row.status === 'Processed' ? '1px solid #BFDBFE' : row.status === 'Approved' ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                      }}>
                        {row.status === 'Processed' ? '✓ Processed in Payroll' : row.status || 'Pending'}
                      </span>
                    </td>
                    {canEdit('payroll', 'reimbursements') && (
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {row.status !== 'Processed' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {row.status !== 'Approved' && (
                              <button
                                onClick={() => handleUpdateStatus(row.id, 'Approved')}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <Check size={12} /> Approve
                              </button>
                            )}
                            {row.status !== 'Rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(row.id, 'Rejected')}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <X size={12} /> Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Add Reimbursement Claim */}
      {showModal && canCreate('payroll', 'reimbursements') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '540px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '24px 28px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <Receipt size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>Add Expense Claim</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>File employee reimbursement claims for approval & payout</p>
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
            <form onSubmit={handleCreateClaim} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#FFFFFF' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Select Employee <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <AppDropdown
                  value={employeeId}
                  onChange={v => setEmployeeId(v)}
                  options={[{value:'',label:'-- Choose Employee --'}, ...activeEmployees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.emp_code})` }))]}
                  size="sm"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Claim Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Client Dinner, Travel Fuel, Office Monitor"
                  style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Amount (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 2500"
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                    Claim Date
                  </label>
                  <input
                    type="date"
                    value={claimDate}
                    onChange={e => setClaimDate(e.target.value)}
                    style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '7px' }}>
                  Description / Business Purpose
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Flight travel for client onboarding meeting in Bangalore"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#1E293B', background: '#FAFBFC', outline: 'none', transition: 'all 0.2s', resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Info Notice Banner */}
              <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '12px', padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', fontWeight: '500', lineHeight: '1.4' }}>
                  Submitted claims will be reviewed and added to the employee's next payroll settlement.
                </p>
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
                  Submit & Approve
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
