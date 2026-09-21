import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, Eye, Download, FileText, CheckCircle, Clock, FolderPlus, X, Upload, FileCode, Paperclip, AlertCircle } from 'lucide-react';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export function Templates() {
  const { addToast } = useToast();
  const [selectedCat, setSelectedCat] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTemplate, setViewTemplate] = useState(null);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [templatesList, setTemplatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [dashboard, setDashboard] = useState({
    kpis: { empDocsCount: 0, compDocsCount: 0, policiesCount: 0, publishedPolicies: 0, templatesCount: 0, signaturesCount: 0 }
  });

  const [formData, setFormData] = useState({
    template_name: '',
    category: 'Offer Letters',
    description: '',
    template_source_type: 'editor', // 'editor' | 'file'
    content: '',
    status: 'Active',
    file: null,
    existingFileName: ''
  });

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'Offer Letters', label: 'Offer Letters' },
    { id: 'HR Letters', label: 'HR Letters' },
    { id: 'Appointment Letters', label: 'Appointment Letters' },
    { id: 'Contracts', label: 'Contracts' },
    { id: 'Certificates', label: 'Certificates' },
    { id: 'Other', label: 'Other' }
  ];

  const categoryOptions = [
    { value: 'Offer Letters', label: 'Offer Letters' },
    { value: 'HR Letters', label: 'HR Letters' },
    { value: 'Appointment Letters', label: 'Appointment Letters' },
    { value: 'Contracts', label: 'Contracts' },
    { value: 'Certificates', label: 'Certificates' },
    { value: 'Other', label: 'Other' }
  ];

  const dynamicVariables = [
    { tag: '{{candidate_name}}', label: 'Candidate Name' },
    { tag: '{{job_title}}', label: 'Job Title' },
    { tag: '{{department}}', label: 'Department' },
    { tag: '{{ctc}}', label: 'Annual CTC' },
    { tag: '{{joining_date}}', label: 'Joining Date' },
    { tag: '{{offer_date}}', label: 'Offer Date' },
    { tag: '{{reporting_manager}}', label: 'Reporting Manager' },
    { tag: '{{employment_type}}', label: 'Employment Type' },
    { tag: '{{candidate_email}}', label: 'Candidate Email' },
    { tag: '{{candidate_phone}}', label: 'Candidate Phone' },
    { tag: '{{company_name}}', label: 'Company Name' },
    { tag: '{{company_address}}', label: 'Company Address' },
    { tag: '{{hr_name}}', label: 'HR Name' }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/documents/templates?category=${encodeURIComponent(selectedCat)}&`;
      const res = await apiFetch(url);
      if (res.success) setTemplatesList(res.data || []);

      const dbRes = await apiFetch('/documents/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load document templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCat, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insertVariable = (variableTag) => {
    setFormData(prev => ({
      ...prev,
      content: (prev.content || '') + ' ' + variableTag
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['.docx', '.pdf', '.doc'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      addToast('Invalid file format. Please upload .docx or .pdf files.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit.', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      file: file,
      existingFileName: file.name
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.template_name.trim()) {
      addToast('Please enter template name', 'error');
      return;
    }

    if (formData.template_source_type === 'file' && !formData.file && !formData.existingFileName) {
      addToast('Please upload a template file (.docx or .pdf)', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editTemplateId ? `/documents/templates/${editTemplateId}` : '/documents/templates';
      const method = editTemplateId ? 'PUT' : 'POST';

      const payload = new FormData();
      payload.append('template_name', formData.template_name.trim());
      payload.append('category', formData.category);
      payload.append('description', formData.description || '');
      payload.append('template_source_type', formData.template_source_type);
      payload.append('status', formData.status);
      if (formData.content) {
        payload.append('content', formData.content);
      }
      if (formData.file) {
        payload.append('file', formData.file);
      }

      const res = await apiFetch(url, {
        method,
        body: payload
      });

      if (res.success) {
        addToast(editTemplateId ? 'Template updated successfully' : 'Template created successfully', 'success');
        setShowAddModal(false);
        setEditTemplateId(null);
        setFormData({
          template_name: '',
          category: 'Offer Letters',
          description: '',
          template_source_type: 'editor',
          content: '',
          status: 'Active',
          file: null,
          existingFileName: ''
        });
        fetchData();
      } else {
        addToast(res.message || 'Failed to save template', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template) => {
    setEditTemplateId(template.id);
    setFormData({
      template_name: template.template_name || '',
      category: template.category || 'Offer Letters',
      description: template.description || '',
      template_source_type: template.template_source_type || 'editor',
      content: template.content || '',
      status: template.status || 'Active',
      file: null,
      existingFileName: template.original_file_name || ''
    });
    setShowAddModal(true);
  };

  const handleView = (template) => {
    setViewTemplate(template);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await apiFetch(`/documents/templates/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Template deleted successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Failed to delete template', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    }
  };

  const openCreateModal = () => {
    setEditTemplateId(null);
    setFormData({
      template_name: '',
      category: 'Offer Letters',
      description: '',
      template_source_type: 'editor',
      content: '',
      status: 'Active',
      file: null,
      existingFileName: ''
    });
    setShowAddModal(true);
  };

  if (loading && templatesList.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Loading Templates...</span>
        </div>
      </div>
    );
  }

  const KpiCard = ({ label, value, iconBg, iconColor, icon: Icon }) => (
    <div
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
  );

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Master Templates</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Create and manage master document templates for Offer Letters and official correspondence</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasPermission('documents', 'doc_templates', 'create') && (
            <button onClick={openCreateModal}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
            >
              <Plus size={15} /> Create Template
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Templates" value={templatesList.length} iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Active Templates" value={templatesList.filter(t => t.status === 'Active').length} iconBg="#ECFDF5" iconColor="#16A34A" icon={CheckCircle} />
        <KpiCard label="Offer Letter Templates" value={templatesList.filter(t => t.category === 'Offer Letters').length} iconBg="#FEF3C7" iconColor="#D97706" icon={FileCode} />
        <KpiCard label="File-based Templates" value={templatesList.filter(t => t.template_source_type === 'file').length} iconBg="#EDE9FE" iconColor="#9333EA" icon={Paperclip} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left Panel: Template Categories */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 14px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12, paddingLeft: 6 }}>Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {categories.map((c) => {
              const active = selectedCat === c.id;
              const count = c.id === 'all' ? templatesList.length : templatesList.filter(t => t.category === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'linear-gradient(135deg,#EFF6FF,#E0E7FF)' : 'transparent', color: active ? '#2563EB' : '#4B5563', border: active ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.14s', textAlign: 'left' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#2563EB' : '#94A3B8', background: active ? '#DBEAFE' : '#F1F5F9', borderRadius: 20, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Main Table */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>
                {selectedCat === 'all' ? 'All Templates' : `${selectedCat} Templates`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>{templatesList.length} {templatesList.length === 1 ? 'template' : 'templates'} found</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E5E7EB' }}>
                  {['Template Name', 'Category', 'Source', 'Created At', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templatesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <FolderPlus size={36} strokeWidth={1.5} color="#CBD5E1" />
                        No templates found for "{selectedCat}"
                      </div>
                    </td>
                  </tr>
                ) : templatesList.map((r, i) => {
                  const isActive = r.status === 'Active';
                  const isFile = r.template_source_type === 'file';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: isFile ? 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' : 'linear-gradient(135deg,#DBEAFE,#C7D2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            {isFile ? <Paperclip size={14} color="#7C3AED" strokeWidth={2.2} /> : <FileText size={14} color="#3B5BDB" strokeWidth={2.2} />}
                          </div>
                          <div>
                            <div>{r.template_name}</div>
                            {r.description && <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, marginTop: 1 }}>{r.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#EFF6FF', borderRadius: 7, padding: '3px 10px', fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{r.category}</span>
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: isFile ? '#FAF5FF' : '#F8FAFC', color: isFile ? '#7C3AED' : '#475569', border: isFile ? '1px solid #DDD6FE' : '1px solid #E2E8F0' }}>
                          {isFile ? <Paperclip size={12} /> : <FileText size={12} />}
                          {isFile ? (r.original_file_name ? r.original_file_name.split('.').pop().toUpperCase() : 'FILE') : 'Editor'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: isActive ? '#DCFCE7' : '#FEF9C3', color: isActive ? '#15803D' : '#A16207', border: `1px solid ${isActive ? '#BBF7D0' : '#FDE68A'}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : '#D97706', display: 'inline-block' }} />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => handleView(r)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                          >View</button>
                          {r.file_path && (
                            <a href={`/${r.file_path.replace(/^\//, '')}`} download={r.original_file_name || 'template'} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#FAF5FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>Download</a>
                          )}
                          {hasPermission('documents', 'doc_templates', 'edit') && (
                            <button onClick={() => handleEdit(r)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#D1FAE5'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; }}
                            >Edit</button>
                          )}
                          {hasPermission('documents', 'doc_templates', 'delete') && (
                            <button onClick={() => handleDelete(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'none', color: '#EF4444', border: '1px solid #FECACA', cursor: 'pointer' }}
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

      </div>

      {/* Create / Edit Template Modal — Premium Redesign */}
      {showAddModal && (editTemplateId ? hasPermission('documents', 'doc_templates', 'edit') : hasPermission('documents', 'doc_templates', 'create')) && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowAddModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(10,22,41,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal Shell */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}>
            <div style={{
              width: '780px', maxWidth: '95vw', maxHeight: '92vh',
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 32px 80px rgba(10,22,41,0.22), 0 0 0 1px rgba(255,255,255,0.12)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>

              {/* Gradient Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
                padding: '24px 28px 20px',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative circles */}
                <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
                <div style={{ position:'absolute', bottom:-20, right:60, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{
                      width:44, height:44, borderRadius:12,
                      background:'rgba(255,255,255,0.18)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      backdropFilter:'blur(4px)',
                      flexShrink:0,
                    }}>
                      <FileText size={22} color="#FFFFFF" />
                    </div>
                    <div>
                      <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.3px' }}>
                        {editTemplateId ? 'Edit Master Template' : 'Create Master Template'}
                      </h2>
                      <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                        Design or upload reusable templates for offer letters and corporate documents
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{
                      width:32, height:32, borderRadius:8, border:'none',
                      background:'rgba(255,255,255,0.15)', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      flexShrink:0, transition:'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                  >
                    <X size={16} color="#FFFFFF" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

                {/* ── Source Type Cards ── */}
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                    Template Source Type <span style={{ color:'#EF4444' }}>*</span>
                  </label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {/* Editor Card */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, template_source_type: 'editor' }))}
                      style={{
                        padding:'14px 16px', borderRadius:14, textAlign:'left',
                        border: formData.template_source_type === 'editor' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                        background: formData.template_source_type === 'editor'
                          ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                          : '#FAFAFA',
                        cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                        boxShadow: formData.template_source_type === 'editor' ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                        transition:'all 0.2s',
                      }}
                    >
                      <div style={{
                        width:38, height:38, borderRadius:10, flexShrink:0,
                        background: formData.template_source_type === 'editor' ? '#2563EB' : '#E2E8F0',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <FileText size={18} color={formData.template_source_type === 'editor' ? '#FFF' : '#94A3B8'} />
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: formData.template_source_type === 'editor' ? '#1E40AF' : '#334155' }}>
                          Create with Editor
                        </div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>Write text with dynamic variables</div>
                      </div>
                    </button>

                    {/* File Upload Card */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, template_source_type: 'file' }))}
                      style={{
                        padding:'14px 16px', borderRadius:14, textAlign:'left',
                        border: formData.template_source_type === 'file' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                        background: formData.template_source_type === 'file'
                          ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                          : '#FAFAFA',
                        cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                        boxShadow: formData.template_source_type === 'file' ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                        transition:'all 0.2s',
                      }}
                    >
                      <div style={{
                        width:38, height:38, borderRadius:10, flexShrink:0,
                        background: formData.template_source_type === 'file' ? '#2563EB' : '#E2E8F0',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <Upload size={18} color={formData.template_source_type === 'file' ? '#FFF' : '#94A3B8'} />
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: formData.template_source_type === 'file' ? '#1E40AF' : '#334155' }}>
                          Upload Template File
                        </div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>Upload .docx or .pdf template</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ── Template Name & Category ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>
                      Template Name <span style={{ color:'#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.template_name}
                      onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                      placeholder="e.g. Senior Developer Offer Letter"
                      style={{
                        width:'100%', height:44, padding:'0 14px',
                        border:'1.5px solid #E2E8F0', borderRadius:10,
                        fontSize:13, color:'#1E293B', outline:'none',
                        background:'#FAFAFA', boxSizing:'border-box',
                        transition:'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background='#FFF'; }}
                      onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; e.target.style.background='#FAFAFA'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>
                      Category <span style={{ color:'#EF4444' }}>*</span>
                    </label>
                    <AppDropdown
                      value={formData.category}
                      onChange={v => setFormData({ ...formData, category: v })}
                      options={categoryOptions}
                      size="sm"
                    />
                  </div>
                </div>

                {/* ── Description ── */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>
                    Description <span style={{ fontSize:11, fontWeight:500, color:'#94A3B8' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief note about when to use this template..."
                    style={{
                      width:'100%', height:44, padding:'0 14px',
                      border:'1.5px solid #E2E8F0', borderRadius:10,
                      fontSize:13, color:'#1E293B', outline:'none',
                      background:'#FAFAFA', boxSizing:'border-box',
                      transition:'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background='#FFF'; }}
                    onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; e.target.style.background='#FAFAFA'; }}
                  />
                </div>

                {/* ── File Upload Zone ── */}
                {formData.template_source_type === 'file' && (
                  <div style={{
                    background:'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                    border:'2px dashed #93C5FD', borderRadius:14, padding:'28px 20px',
                  }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
                      <div style={{
                        width:52, height:52, borderRadius:14, background:'#2563EB',
                        display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12,
                        boxShadow:'0 4px 14px rgba(37,99,235,0.35)',
                      }}>
                        <Upload size={24} color="#FFFFFF" />
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1E293B', marginBottom:4 }}>
                        Select Template File
                      </div>
                      <div style={{ fontSize:12, color:'#64748B', marginBottom:16, lineHeight:1.5 }}>
                        DOCX (recommended for dynamic variables) or PDF · Max 10 MB
                      </div>
                      <input ref={fileInputRef} type="file" accept=".docx,.pdf,.doc" onChange={handleFileChange} style={{ display:'none' }} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        style={{
                          padding:'9px 22px', background:'#2563EB', color:'#FFF',
                          borderRadius:9, fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                          boxShadow:'0 4px 12px rgba(37,99,235,0.35)', transition:'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='#1D4ED8'; e.currentTarget.style.transform='translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#2563EB'; e.currentTarget.style.transform='none'; }}
                      >
                        Browse File
                      </button>
                    </div>

                    {(formData.file || formData.existingFileName) && (
                      <div style={{
                        marginTop:16, padding:'12px 16px', background:'#FFF',
                        border:'1.5px solid #BFDBFE', borderRadius:10,
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        boxShadow:'0 2px 8px rgba(37,99,235,0.08)',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:8, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Paperclip size={16} color="#2563EB" />
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>
                              {formData.file ? formData.file.name : formData.existingFileName}
                            </div>
                            {formData.file && (
                              <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>
                                {(formData.file.size / 1024).toFixed(1)} KB
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:'#059669', background:'#ECFDF5', padding:'4px 10px', borderRadius:20, border:'1px solid #A7F3D0' }}>
                          ✓ Ready
                        </span>
                      </div>
                    )}
                  </div>
                )}


                {/* ── Status ── */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Status</label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{ value: 'Active', label: 'Active (Available for Offers)' }, { value: 'Draft', label: 'Draft (Hidden from Offers)' }]}
                    size="sm"
                  />
                </div>

                {/* ── Footer Buttons ── */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12,
                  paddingTop:16, borderTop:'1px solid #E5E7EB', marginTop:4,
                }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      height:42, padding:'0 22px',
                      border:'1.5px solid #E2E8F0', borderRadius:10,
                      fontSize:13, fontWeight:600, color:'#475569',
                      background:'#FFF', cursor:'pointer', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor='#CBD5E1'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='#FFF'; e.currentTarget.style.borderColor='#E2E8F0'; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      height:42, padding:'0 26px',
                      background: saving ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color:'#FFF', border:'none', borderRadius:10,
                      fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                      transition:'all 0.2s', display:'flex', alignItems:'center', gap:6,
                    }}
                    onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.5)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=saving ? 'none' : '0 4px 14px rgba(37,99,235,0.4)'; }}
                  >
                    {saving ? (
                      <><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#FFF', display:'inline-block', animation:'spin 0.8s linear infinite' }} /> Saving…</>
                    ) : (
                      <>{editTemplateId ? 'Save Changes' : '✦ Create Template'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* View Template Modal — Premium Redesign */}
      {showViewModal && viewTemplate && (
        <>
          <div
            onClick={() => setShowViewModal(false)}
            style={{
              position:'fixed', inset:0, zIndex:1000,
              background:'rgba(10,22,41,0.55)',
              backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
            }}
          />
          <div style={{
            position:'fixed', inset:0, zIndex:1001,
            display:'flex', alignItems:'center', justifyContent:'center', padding:16,
          }}>
            <div style={{
              width:720, maxWidth:'93vw', maxHeight:'90vh',
              background:'#FFFFFF', borderRadius:20,
              boxShadow:'0 32px 80px rgba(10,22,41,0.22), 0 0 0 1px rgba(255,255,255,0.12)',
              display:'flex', flexDirection:'column', overflow:'hidden',
              fontFamily:"'Inter', -apple-system, sans-serif",
            }}>

              {/* Teal-to-purple gradient header */}
              <div style={{
                background:'linear-gradient(135deg, #0F4C81 0%, #1E40AF 45%, #4F46E5 100%)',
                padding:'22px 26px 18px', flexShrink:0, position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Eye size={20} color="#FFF" />
                    </div>
                    <div>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#FFF', letterSpacing:'-0.3px' }}>Template Details</h2>
                      <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.7)' }}>Read-only master template configuration</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    style={{ width:30, height:30, borderRadius:8, border:'none', background:'rgba(255,255,255,0.15)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                  >
                    <X size={15} color="#FFF" />
                  </button>
                </div>
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:'22px 26px', display:'flex', flexDirection:'column', gap:16 }}>

                {/* Info Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    { label:'Template Name', value: viewTemplate.template_name, bold:true },
                    { label:'Category', value: viewTemplate.category, color:'#2563EB' },
                    { label:'Source Type', value: viewTemplate.template_source_type === 'file' ? `Uploaded File (${viewTemplate.original_file_name || 'Attached'})` : 'Editor / Text' },
                    { label:'Created', value: formatDate(viewTemplate.created_at) },
                  ].map(({ label, value, bold, color }) => (
                    <div key={label} style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px', border:'1px solid #E2E8F0' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:13, fontWeight: bold ? 700 : 600, color: color || '#1E293B' }}>{value}</div>
                    </div>
                  ))}

                  {/* Status spans full row */}
                  <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Status</div>
                      <span style={{
                        display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                        background: viewTemplate.status === 'Active' ? '#ECFDF5' : '#FEF3C7',
                        color: viewTemplate.status === 'Active' ? '#059669' : '#D97706',
                        border: `1px solid ${viewTemplate.status === 'Active' ? '#A7F3D0' : '#FDE68A'}`,
                      }}>{viewTemplate.status}</span>
                    </div>
                  </div>

                  {viewTemplate.description && (
                    <div style={{ gridColumn:'span 2', background:'#F8FAFC', borderRadius:10, padding:'12px 14px', border:'1px solid #E2E8F0' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Description</div>
                      <div style={{ fontSize:13, color:'#334155' }}>{viewTemplate.description}</div>
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                {viewTemplate.file_path && (
                  <div style={{
                    padding:'14px 16px', background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
                    border:'1.5px solid #BFDBFE', borderRadius:12,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Paperclip size={16} color="#FFF" />
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1E40AF' }}>{viewTemplate.original_file_name || 'Template Document'}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Stored on server</div>
                      </div>
                    </div>
                    <a
                      href={`/${viewTemplate.file_path.replace(/^\//, '')}`}
                      download={viewTemplate.original_file_name || 'template'}
                      target="_blank" rel="noreferrer"
                      style={{
                        padding:'8px 16px', background:'#2563EB', color:'#FFF',
                        borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none',
                        display:'inline-flex', alignItems:'center', gap:5,
                        boxShadow:'0 3px 10px rgba(37,99,235,0.35)',
                      }}
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                )}

                {/* Body Preview */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Template Body Preview</div>
                  <div style={{
                    padding:'14px 16px',
                    background:'#FAFAFA',
                    border:'1.5px solid #E2E8F0',
                    borderRadius:10,
                    fontSize:12.5, color:'#334155',
                    minHeight:120, whiteSpace:'pre-wrap',
                    fontFamily:"'Fira Code','Courier New',monospace", lineHeight:1.7,
                  }}>
                    {viewTemplate.content || <span style={{ color:'#94A3B8', fontStyle:'italic' }}>(No editor content — file-based template)</span>}
                  </div>
                </div>

                {/* Close Button */}
                <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid #E5E7EB' }}>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    style={{
                      height:40, padding:'0 24px',
                      background:'linear-gradient(135deg,#1E293B,#0F172A)',
                      color:'#FFF', border:'none', borderRadius:10,
                      fontSize:13, fontWeight:700, cursor:'pointer',
                      boxShadow:'0 3px 10px rgba(15,23,42,0.3)', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 5px 16px rgba(15,23,42,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 3px 10px rgba(15,23,42,0.3)'; }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default Templates;

