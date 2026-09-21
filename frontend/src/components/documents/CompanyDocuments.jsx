import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Upload, FileText, CheckCircle, Folder, HardDrive, X, CloudUpload, Building2 } from 'lucide-react';
import { apiFetch, formatDate, getAuthToken } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function CompanyDocuments() {
  const { addToast } = useToast();
  const [selectedCat, setSelectedCat] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docList, setDocList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ employees: [], departments: [], companies: [] });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [dashboard, setDashboard] = useState({
    kpis: { empDocsCount: 0, compDocsCount: 0, policiesCount: 0, publishedPolicies: 0, templatesCount: 0, signaturesCount: 0 }
  });
  const [formData, setFormData] = useState({
    company_id: '',
    document_name: '',
    document_category: 'Legal',
    status: 'Active'
  });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const metaRes = await apiFetch('/documents/meta');
      if (metaRes.success) setMeta(metaRes.data);
      let url = `/documents/company?category=${selectedCat}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const docRes = await apiFetch(url);
      if (docRes.success) setDocList(docRes.data || []);
      const dbRes = await apiFetch('/documents/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load company documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCat, search, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.company_id || !formData.document_name || !selectedFile) {
      addToast('Please fill all required fields including file upload', 'error');
      return;
    }
    try {
      const data = new FormData();
      data.append('company_id', formData.company_id);
      data.append('document_name', formData.document_name);
      data.append('document_category', formData.document_category);
      data.append('status', formData.status);
      data.append('file', selectedFile);
      const response = await fetch('/app/documents/company', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: data
      });
      const res = await response.json();
      if (res.success) {
        addToast('Company document uploaded successfully.', 'success');
        setShowUploadModal(false);
        setFormData({ company_id: '', document_name: '', document_category: 'Legal', status: 'Active' });
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
      const res = await apiFetch(`/documents/company/${id}`, { method: 'DELETE' });
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
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Loading Company Documents...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Company Docs', value: dashboard.kpis.compDocsCount, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: HardDrive },
    { label: 'Legal Documents', value: docList.filter(d => d.document_category === 'Legal').length, iconBg: '#ECFDF5', iconColor: '#16A34A', icon: CheckCircle },
    { label: 'Financial Records', value: docList.filter(d => d.document_category === 'Finance').length, iconBg: '#FEF3C7', iconColor: '#D97706', icon: Folder },
    { label: 'Compliance & Ops', value: docList.filter(d => d.document_category === 'Compliance' || d.document_category === 'Operations').length, iconBg: '#FEE2E2', iconColor: '#DC2626', icon: FileText },
  ];

  const tabs = [
    { id: 'all', label: 'All Categories' },
    { id: 'Legal', label: 'Legal' },
    { id: 'Finance', label: 'Finance' },
    { id: 'Operations', label: 'Operations' },
    { id: 'Compliance', label: 'Compliance' },
    { id: 'Reports', label: 'Reports' },
  ];

  const catColors = {
    Legal:      { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    Finance:    { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
    Operations: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    Compliance: { bg: '#FFF1F2', color: '#B91C1C', border: '#FECACA' },
    Reports:    { bg: '#FAF5FF', color: '#7C3AED', border: '#E9D5FF' },
  };

  const statusStyle = (s) => s === 'Active'
    ? { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' }
    : { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' };

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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Company Documents</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Manage shared assets, legal records, and company folders</p>
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
          {hasPermission('documents', 'doc_company', 'create') && (
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
          <button key={t.id} onClick={() => setSelectedCat(t.id)} style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: selectedCat === t.id ? 'none' : '1.5px solid #E2E8F0', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', background: selectedCat === t.id ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#FFF', color: selectedCat === t.id ? '#FFF' : '#475569', boxShadow: selectedCat === t.id ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
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
                {['Company Name', 'Document Name', 'Category', 'Uploaded Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <HardDrive size={36} strokeWidth={1.5} color="#CBD5E1" />
                      No documents found
                    </div>
                  </td>
                </tr>
              ) : docList.map((r, i) => {
                const s = statusStyle(r.status);
                const cat = catColors[r.document_category] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg,#DBEAFE,#C7D2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={15} color="#3B5BDB" strokeWidth={2.2} />
                        </div>
                        {r.company_name || 'All Companies'}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.document_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      <span style={{ background: cat.bg, borderRadius: 7, padding: '3px 10px', fontSize: 11.5, fontWeight: 700, color: cat.color, border: '1px solid ' + cat.border }}>
                        {r.document_category}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color, border: '1px solid ' + s.border }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {r.document_path && (() => {
                          const fileUrl = r.document_path.startsWith('/') ? r.document_path : '/' + r.document_path;
                          return (
                            <>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>View</a>
                              <a href={fileUrl} download style={{ textDecoration: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#16A34A', border: '1px solid #BBF7D0' }}>Download</a>
                            </>
                          );
                        })()}
                        {hasPermission('documents', 'doc_company', 'delete') && (
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
      {showUploadModal && hasPermission('documents', 'doc_company', 'create') && (
        <>
          <div onClick={() => setShowUploadModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 560, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E3A8A 0%,#2563EB 60%,#3B82F6 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -10, left: 40, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloudUpload size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Upload Company Document</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Upload a shared resource or legal document</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Row 1: Company + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Company <span style={{ color: '#EF4444' }}>*</span></label>
                  <AppDropdown
                    value={formData.company_id}
                    onChange={v => setFormData({ ...formData, company_id: v })}
                    options={[{ value: '', label: 'Select Company' }, ...(meta.companies || []).map(c => ({ value: c.id, label: c.name }))]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category <span style={{ color: '#EF4444' }}>*</span></label>
                  <AppDropdown
                    value={formData.document_category}
                    onChange={v => setFormData({ ...formData, document_category: v })}
                    options={[{value:'Legal',label:'Legal'},{value:'Finance',label:'Finance'},{value:'Operations',label:'Operations'},{value:'Compliance',label:'Compliance'},{value:'Reports',label:'Reports'}]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Document Name */}
              <div>
                <label style={labelStyle}>Document Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text" required
                  value={formData.document_name}
                  onChange={e => setFormData({ ...formData, document_name: e.target.value })}
                  placeholder="e.g. GST Certificate, MOA, Balance Sheet"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>

              {/* File Upload Zone */}
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
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>PDF, DOCX, XLSX, JPG, PNG supported</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <AppDropdown
                  value={formData.status}
                  onChange={v => setFormData({ ...formData, status: v })}
                  options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]}
                  size="sm"
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9', marginTop: 4 }}>
                <button type="button" onClick={() => setShowUploadModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer', transition: 'background 0.15s' }}
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

export default CompanyDocuments;
