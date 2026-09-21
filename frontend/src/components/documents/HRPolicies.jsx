import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Archive, X, ShieldCheck, BookOpen } from 'lucide-react';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function HRPolicies() {
  const { addToast } = useToast();
  const [selectedCat, setSelectedCat] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [policiesList, setPoliciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    kpis: { empDocsCount: 0, compDocsCount: 0, policiesCount: 0, publishedPolicies: 0, templatesCount: 0, signaturesCount: 0 }
  });
  const [formData, setFormData] = useState({
    policy_name: '',
    category: 'HR Policies',
    version: '1.0',
    effective_date: '',
    file: '',
    status: 'Draft'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/documents/policies?category=${selectedCat}&`;
      const res = await apiFetch(url);
      if (res.success) setPoliciesList(res.data || []);
      const dbRes = await apiFetch('/documents/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load HR Policies', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCat, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.policy_name) {
      addToast('Please enter policy name', 'error');
      return;
    }
    try {
      const res = await apiFetch('/documents/policies', {
        method: 'POST',
        body: JSON.stringify({
          policy_name: formData.policy_name,
          category: formData.category,
          version: formData.version,
          effective_date: formData.effective_date || null,
          file: formData.file || 'uploads/docs/dummy_policy.pdf',
          status: formData.status
        })
      });
      if (res.success) {
        addToast('Policy saved successfully', 'success');
        setShowAddModal(false);
        setFormData({ policy_name: '', category: 'HR Policies', version: '1.0', effective_date: '', file: '', status: 'Draft' });
        fetchData();
      } else {
        addToast(res.message || 'Failed to save policy', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      const res = await apiFetch(`/documents/policies/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Policy deleted successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to delete policy', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Loading HR Policies...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Policies', value: dashboard.kpis.policiesCount, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: FileText },
    { label: 'Published', value: dashboard.kpis.publishedPolicies, iconBg: '#ECFDF5', iconColor: '#16A34A', icon: CheckCircle },
    { label: 'Draft', value: policiesList.filter(p => p.status === 'Draft').length, iconBg: '#FEF3C7', iconColor: '#D97706', icon: Clock },
    { label: 'Under Review', value: policiesList.filter(p => p.status === 'Under Review').length, iconBg: '#EDE9FE', iconColor: '#4F46E5', icon: AlertCircle },
    { label: 'Archived', value: policiesList.filter(p => p.status === 'Archived').length, iconBg: '#F1F5F9', iconColor: '#64748B', icon: Archive },
  ];

  const sideCategories = [
    { id: 'all', label: 'All Categories', icon: BookOpen },
    { id: 'HR Policies', label: 'HR Policies', icon: ShieldCheck },
    { id: 'Leave Policies', label: 'Leave Policies', icon: Clock },
    { id: 'Work Policies', label: 'Work Policies', icon: FileText },
    { id: 'Code of Conduct', label: 'Code of Conduct', icon: CheckCircle },
  ];

  const statusStyle = (s) => ({
    Published:    { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
    Draft:        { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
    'Under Review': { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    Archived:     { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  }[s] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' });

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#374151',
    marginBottom: 7, letterSpacing: '0.2px',
  };

  const inputStyle = {
    width: '100%', height: 44, padding: '0 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 11,
    fontSize: 13, color: '#1E293B', background: '#FAFBFC',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>HR Policies</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Manage and publish HR policies for your organization</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasPermission('documents', 'doc_policies', 'create') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
            >
              <Plus size={15} /> Add Policy
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {kpis.map(({ label, value, iconBg, iconColor, icon: Icon }) => (
          <div key={label}
            style={{ background: '#FFF', borderRadius: 14, padding: '16px 18px', flex: '1 1 0', minWidth: 130, boxShadow: '0 1px 6px rgba(15,23,42,0.07)', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12, transition: 'box-shadow 0.18s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(15,23,42,0.07)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={iconColor} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#6B7280', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout: Sidebar + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left Sidebar */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 14px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12, paddingLeft: 6 }}>Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sideCategories.map(({ id, label, icon: CatIcon }) => {
              const active = selectedCat === id;
              return (
                <button key={id} onClick={() => setSelectedCat(id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'linear-gradient(135deg,#EFF6FF,#E0E7FF)' : 'transparent', color: active ? '#2563EB' : '#4B5563', border: active ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.14s', textAlign: 'left' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <CatIcon size={14} strokeWidth={2.3} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Policies Table */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>Policies List</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>{policiesList.length} {policiesList.length === 1 ? 'policy' : 'policies'} found</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E5E7EB' }}>
                  {['Policy Name', 'Category', 'Version', 'Effective Date', 'Last Updated', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policiesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <FileText size={36} strokeWidth={1.5} color="#CBD5E1" />
                        No policies found
                      </div>
                    </td>
                  </tr>
                ) : policiesList.map((r, i) => {
                  const s = statusStyle(r.status);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#EDE9FE,#DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={14} color="#4F46E5" strokeWidth={2.2} />
                          </div>
                          {r.policy_name}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#EFF6FF', borderRadius: 7, padding: '3px 10px', fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{r.category}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#F8FAFC', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, color: '#64748B', border: '1px solid #E2E8F0' }}>v{r.version}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{r.effective_date ? formatDate(r.effective_date) : <span style={{ color: '#CBD5E1' }}>&#8212;</span>}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(r.updated_at)}</td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color, border: '1px solid ' + s.border }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        {hasPermission('documents', 'doc_policies', 'delete') && (
                          <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: '1px solid #FECACA', color: '#EF4444', cursor: 'pointer', padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 7 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >Delete</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Policy Modal */}
      {showAddModal && hasPermission('documents', 'doc_policies', 'create') && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 560, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E3A8A 0%,#2563EB 55%,#6366F1 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -14, left: 50, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Add HR Policy</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Submit a new policy for review or publication</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Policy Name */}
              <div>
                <label style={labelStyle}>Policy Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text" required
                  value={formData.policy_name}
                  onChange={e => setFormData({ ...formData, policy_name: e.target.value })}
                  placeholder="e.g. Remote Work Policy, Leave Encashment Policy"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Category + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Category <span style={{ color: '#EF4444' }}>*</span></label>
                  <AppDropdown
                    value={formData.category}
                    onChange={v => setFormData({ ...formData, category: v })}
                    options={[{value:'HR Policies',label:'HR Policies'},{value:'Leave Policies',label:'Leave Policies'},{value:'Work Policies',label:'Work Policies'},{value:'Code of Conduct',label:'Code of Conduct'},{value:'Compensation',label:'Compensation'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{value:'Draft',label:'Draft'},{value:'Under Review',label:'Under Review'},{value:'Published',label:'Published'},{value:'Archived',label:'Archived'}]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Row: Version + Effective Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Version <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g. 1.0, 2.1"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Effective Date <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              {/* Status Preview Strip */}
              <div style={{ background: 'linear-gradient(135deg,#F8FAFC,#EFF6FF)', borderRadius: 12, padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: formData.status === 'Published' ? '#16A34A' : formData.status === 'Under Review' ? '#6D28D9' : formData.status === 'Archived' ? '#64748B' : '#D97706', flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                  This policy will be saved as <strong style={{ color: '#0F172A' }}>{formData.status}</strong> under <strong style={{ color: '#0F172A' }}>{formData.category}</strong>
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9', marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; }}
                >Cancel</button>
                <button type="submit"
                  style={{ height: 44, padding: '0 28px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.40)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.4)'; }}
                ><ShieldCheck size={15} /> Save Policy</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default HRPolicies;
