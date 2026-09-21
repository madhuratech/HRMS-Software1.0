import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Upload, FileText, CheckCircle, Clock, XCircle, X, CloudUpload } from 'lucide-react';
import { apiFetch, formatDate, getAuthToken } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function EmployeeDocuments() {
  const { addToast } = useToast();
  const [selectedType, setSelectedType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docList, setDocList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ employees: [], departments: [] });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [dashboard, setDashboard] = useState({
    kpis: { empDocsCount: 0, compDocsCount: 0, policiesCount: 0, publishedPolicies: 0, templatesCount: 0, signaturesCount: 0 }
  });
  const [formData, setFormData] = useState({
    employee_id: '',
    document_type: 'Identity Proof',
    document_name: '',
    expiry_date: '',
    status: 'Pending'
  });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const metaRes = await apiFetch('/documents/meta');
      if (metaRes.success) setMeta(metaRes.data);
      let url = `/documents/employee?document_type=${selectedType}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const docRes = await apiFetch(url);
      if (docRes.success) setDocList(docRes.data || []);
      const dbRes = await apiFetch('/documents/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load employee documents data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedType, search, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.document_name || !selectedFile) {
      addToast('Please fill all required fields including file upload', 'error');
      return;
    }
    try {
      const data = new FormData();
      data.append('employee_id', formData.employee_id);
      data.append('document_type', formData.document_type);
      data.append('document_name', formData.document_name);
      if (formData.expiry_date) data.append('expiry_date', formData.expiry_date);
      data.append('status', formData.status);
      data.append('file', selectedFile);
      const response = await fetch('/app/documents/employee', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: data
      });
      const res = await response.json();
      if (res.success) {
        addToast('Document uploaded successfully', 'success');
        setShowUploadModal(false);
        setFormData({ employee_id: '', document_type: 'Identity Proof', document_name: '', expiry_date: '', status: 'Pending' });
        setSelectedFile(null);
        fetchData();
      } else {
        addToast(res.message || 'Failed to upload document', 'error');
      }
    } catch (err) {
      addToast('Error uploading file', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await apiFetch(`/documents/employee/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Document deleted successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to delete document', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Loading Employee Documents...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Employee Docs', value: dashboard.kpis.empDocsCount, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: FileText },
    { label: 'Verified Documents', value: docList.filter(d => d.status === 'Verified').length, iconBg: '#ECFDF5', iconColor: '#16A34A', icon: CheckCircle },
    { label: 'Pending Verification', value: docList.filter(d => d.status === 'Pending').length, iconBg: '#FEF3C7', iconColor: '#D97706', icon: Clock },
    { label: 'Rejected / Expired', value: docList.filter(d => d.status === 'Rejected' || d.status === 'Expired').length, iconBg: '#FEE2E2', iconColor: '#DC2626', icon: XCircle },
  ];

  const tabs = [
    { id: 'all', label: 'All Documents' },
    { id: 'Identity Proof', label: 'Identity Proof' },
    { id: 'Address Proof', label: 'Address Proof' },
    { id: 'Educational', label: 'Educational' },
    { id: 'Experience', label: 'Experience' },
    { id: 'Other Documents', label: 'Other' },
  ];

  const statusStyle = (s) => ({
    Verified: { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
    Pending:  { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
    Rejected: { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
    Expired:  { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Employee Documents</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Track, verify and manage employee verification documents</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: 40, paddingLeft: 36, paddingRight: 14, border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFF', color: '#1E293B', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
            />
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          {hasPermission('documents', 'doc_employee', 'create') && (
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
            >
              <Upload size={15} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {kpis.map(({ label, value, iconBg, iconColor, icon: Icon }) => (
          <div key={label}
            style={{ background: '#FFF', borderRadius: 14, padding: '16px 18px', flex: '1 1 0', minWidth: 160, boxShadow: '0 1px 6px rgba(15,23,42,0.07)', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.18s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(15,23,42,0.07)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={iconColor} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSelectedType(t.id)} style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: selectedType === t.id ? 'none' : '1.5px solid #E2E8F0', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', background: selectedType === t.id ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#FFF', color: selectedType === t.id ? '#FFF' : '#475569', boxShadow: selectedType === t.id ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E5E7EB' }}>
                {['Employee', 'Designation', 'Document Type', 'Document Name', 'Uploaded Date', 'Expiry Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <FileText size={36} strokeWidth={1.5} color="#CBD5E1" />
                      No documents found
                    </div>
                  </td>
                </tr>
              ) : docList.map((r, i) => {
                const s = statusStyle(r.status);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#DBEAFE,#EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>
                          {(r.employee_name || 'U')[0].toUpperCase()}
                        </div>
                        {r.employee_name}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{r.employee_role || 'Unassigned'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#F1F5F9', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, color: '#475569' }}>{r.document_type}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#2563EB', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.document_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{r.expiry_date ? formatDate(r.expiry_date) : <span style={{ color: '#CBD5E1' }}>&#8212;</span>}</td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color, border: '1px solid ' + s.border }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {r.file && (() => {
                          const fileUrl = r.file.startsWith('/') ? r.file : '/' + r.file;
                          return (
                            <>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>View</a>
                              <a href={fileUrl} download style={{ textDecoration: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#16A34A', border: '1px solid #BBF7D0' }}>Download</a>
                            </>
                          );
                        })()}
                        {hasPermission('documents', 'doc_employee', 'delete') && (
                          <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: '1px solid #FECACA', color: '#EF4444', cursor: 'pointer', padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 7 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && hasPermission('documents', 'doc_employee', 'create') && (
        <>
          <div onClick={() => setShowUploadModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 580, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E3A8A 0%,#2563EB 60%,#3B82F6 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', top: 10, right: 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloudUpload size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Upload Employee Document</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Map a verification document to an employee</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Employee <span style={{ color: '#EF4444' }}>*</span></label>
                  <AppDropdown value={formData.employee_id} onChange={v => setFormData({ ...formData, employee_id: v })} options={[{ value: '', label: 'Select Employee' }, ...(meta.employees || []).map(emp => ({ value: emp.id, label: emp.name }))]} size="sm" />
                </div>
                <div>
                  <label style={labelStyle}>Document Type <span style={{ color: '#EF4444' }}>*</span></label>
                  <AppDropdown value={formData.document_type} onChange={v => setFormData({ ...formData, document_type: v })} options={[{value:'Identity Proof',label:'Identity Proof'},{value:'Address Proof',label:'Address Proof'},{value:'Educational',label:'Educational Proof'},{value:'Experience',label:'Experience Proof'},{value:'Other Documents',label:'Other Documents'}]} size="sm" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Document Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" required value={formData.document_name} onChange={e => setFormData({ ...formData, document_name: e.target.value })} placeholder="e.g. Aadhaar Card, Passport, Degree Certificate" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Upload File <span style={{ color: '#EF4444' }}>*</span></label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{ border: dragOver ? '2px dashed #2563EB' : selectedFile ? '2px dashed #16A34A' : '2px dashed #CBD5E1', borderRadius: 14, padding: '22px 18px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(37,99,235,0.04)' : selectedFile ? '#F0FDF4' : '#FAFBFC', transition: 'all 0.2s' }}
                >
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
                  {selectedFile ? (
                    <div>
                      <div style={{ marginBottom: 6, color: '#16A34A', display: 'flex', justifyContent: 'center' }}><CheckCircle size={28} /></div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{selectedFile.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{(selectedFile.size / 1024).toFixed(1)} KB &middot; Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 6, color: '#94A3B8', display: 'flex', justifyContent: 'center' }}><CloudUpload size={28} /></div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Drag &amp; drop or <span style={{ color: '#2563EB', textDecoration: 'underline' }}>browse files</span></div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>PDF, DOCX, JPG, PNG supported</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Expiry Date <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span></label>
                  <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <AppDropdown value={formData.status} onChange={v => setFormData({ ...formData, status: v })} options={[{value:'Pending',label:'Pending'},{value:'Verified',label:'Verified'},{value:'Rejected',label:'Rejected'}]} size="sm" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9' }}>
                <button type="button" onClick={() => setShowUploadModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; }}
                >Cancel</button>
                <button type="submit"
                  style={{ height: 44, padding: '0 28px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.40)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.4)'; }}
                ><Upload size={15} /> Upload Document</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default EmployeeDocuments;
