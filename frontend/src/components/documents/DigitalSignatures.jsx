import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, FileText, CheckCircle, Clock, XCircle, AlertTriangle, X, PenLine, Send } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function DigitalSignatures() {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [signaturesList, setSignaturesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ employees: [], departments: [] });
  const [dashboard, setDashboard] = useState({
    kpis: { empDocsCount: 0, compDocsCount: 0, policiesCount: 0, publishedPolicies: 0, templatesCount: 0, signaturesCount: 0 },
    sigPie: []
  });
  const [formData, setFormData] = useState({
    doc_name: '',
    requested_to: '',
    expiry_date: '',
    status: 'Pending'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const metaRes = await apiFetch('/documents/meta');
      if (metaRes.success) setMeta(metaRes.data);
      const res = await apiFetch('/documents/signatures');
      if (res.success) setSignaturesList(res.data || []);
      const dbRes = await apiFetch('/documents/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load digital signatures data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.doc_name || !formData.requested_to) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    try {
      const res = await apiFetch('/documents/signatures', {
        method: 'POST',
        body: JSON.stringify({
          doc_name: formData.doc_name,
          requested_to: formData.requested_to,
          expiry_date: formData.expiry_date || null,
          status: formData.status,
          file: 'uploads/signatures/dummy_signature.png'
        })
      });
      if (res.success) {
        addToast('Signature request created successfully', 'success');
        setShowAddModal(false);
        setFormData({ doc_name: '', requested_to: '', expiry_date: '', status: 'Pending' });
        fetchData();
      } else {
        addToast(res.message || 'Failed to request signature', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const res = await apiFetch(`/documents/signatures/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Request deleted successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to delete request', 'error');
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
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Loading Digital Signatures...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Requests', value: dashboard.kpis.signaturesCount, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: FileText },
    { label: 'Completed', value: signaturesList.filter(s => s.status === 'Completed').length, iconBg: '#ECFDF5', iconColor: '#16A34A', icon: CheckCircle },
    { label: 'Pending', value: signaturesList.filter(s => s.status === 'Pending').length, iconBg: '#FEF3C7', iconColor: '#D97706', icon: Clock },
    { label: 'Declined', value: signaturesList.filter(s => s.status === 'Declined').length, iconBg: '#FEE2E2', iconColor: '#DC2626', icon: XCircle },
    { label: 'Expired', value: signaturesList.filter(s => s.status === 'Expired').length, iconBg: '#F1F5F9', iconColor: '#64748B', icon: AlertTriangle },
  ];

  const statusStyle = (s) => ({
    Completed: { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
    Pending:   { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
    Declined:  { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
    Expired:   { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Digital Signatures</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Manage digital signatures and document signing workflows</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasPermission('documents', 'doc_signatures', 'create') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
            >
              <Plus size={15} /> Request Signature
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

      {/* Main Layout: Table + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Signature Requests Table */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>Signature Requests</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>{signaturesList.length} {signaturesList.length === 1 ? 'request' : 'requests'} total</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E5E7EB' }}>
                  {['Document Name', 'Requested By', 'Requested To', 'Request Date', 'Expiry Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signaturesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <PenLine size={36} strokeWidth={1.5} color="#CBD5E1" />
                        No signature requests found
                      </div>
                    </td>
                  </tr>
                ) : signaturesList.map((r, i) => {
                  const s = statusStyle(r.status);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#EDE9FE,#DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PenLine size={14} color="#6D28D9" strokeWidth={2.2} />
                          </div>
                          {r.doc_name}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#DBEAFE,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: '#3B5BDB', flexShrink: 0 }}>
                            {(r.requested_by || 'U')[0].toUpperCase()}
                          </div>
                          {r.requested_by}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: '#065F46', flexShrink: 0 }}>
                            {(r.requested_to || 'U')[0].toUpperCase()}
                          </div>
                          {r.requested_to}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{r.expiry_date ? formatDate(r.expiry_date) : <span style={{ color: '#CBD5E1' }}>&#8212;</span>}</td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color, border: '1px solid ' + s.border }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        {hasPermission('documents', 'doc_signatures', 'delete') && (
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

        {/* Right: Signature Overview Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 20px 24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>Signature Overview</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>Distribution by status</p>
            </div>
            <div style={{ width: '100%', height: 180, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard.sigPie} cx="50%" cy="50%" innerRadius={52} outerRadius={72} dataKey="value" stroke="none">
                    {dashboard.sigPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{dashboard.kpis.signaturesCount}</span>
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: 500 }}>Total</span>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {[
                { label: 'Completed', color: '#16A34A', value: signaturesList.filter(s => s.status === 'Completed').length },
                { label: 'Pending', color: '#D97706', value: signaturesList.filter(s => s.status === 'Pending').length },
                { label: 'Declined', color: '#DC2626', value: signaturesList.filter(s => s.status === 'Declined').length },
                { label: 'Expired', color: '#94A3B8', value: signaturesList.filter(s => s.status === 'Expired').length },
              ].map(({ label, color, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Request Signature Modal */}
      {showAddModal && hasPermission('documents', 'doc_signatures', 'create') && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 520, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E40AF 0%,#1D4ED8 50%,#2563EB 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -14, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PenLine size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Request Digital Signature</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Initiate a signature flow on an agreement or contract</p>
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

              {/* Document Name */}
              <div>
                <label style={labelStyle}>Document Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text" required
                  value={formData.doc_name}
                  onChange={e => setFormData({ ...formData, doc_name: e.target.value })}
                  placeholder="e.g. NDA Agreement, Employment Contract"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Requested To */}
              <div>
                <label style={labelStyle}>Requested To (Employee Name) <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text" required
                  value={formData.requested_to}
                  onChange={e => setFormData({ ...formData, requested_to: e.target.value })}
                  placeholder="e.g. Priya Patel"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* Row: Expiry Date + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Expiry Date <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{value:'Pending',label:'Pending'},{value:'Completed',label:'Completed'},{value:'Declined',label:'Declined'},{value:'Expired',label:'Expired'}]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  The recipient will receive a signature request for <strong>"{formData.doc_name || 'this document'}"</strong>. They can sign digitally via their portal.
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
                  style={{ height: 44, padding: '0 24px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                ><Send size={15} /> Send Request</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default DigitalSignatures;
