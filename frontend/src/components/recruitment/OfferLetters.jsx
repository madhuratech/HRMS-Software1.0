import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Download, Plus, MoreHorizontal, ChevronLeft, ChevronRight, X, Eye, Send, Edit, Trash2, FileText, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { canCreate, canEdit, canDelete, checkActionPermission } from '../../lib/permissions';
import { apiFetch, formatDate } from '../../lib/api';

export default function OfferLetters() {
  const { addToast } = useToast();
  const [offersList, setOffersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'preview'
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOffer, setViewOffer] = useState(null);
  const [editOfferId, setEditOfferId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterStatus, setFilterStatus] = useState('All Status');

  const [formData, setFormData] = useState({
    candidate_id: '',
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    template_id: '',
    template_snapshot: '',
    job_position: '',
    department_id: '',
    salary_offered: '',
    joining_date: '',
    reporting_manager: '',
    employment_type: 'Full-time',
    offer_expiry_date: '',
    offer_date: new Date().toISOString().slice(0, 10),
    notes: '',
    status: 'Pending'
  });

  const getAuthToken = () => {
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.token || 'mock_jwt_token';
      } catch (e) {
        return 'mock_jwt_token';
      }
    }
    return 'mock_jwt_token';
  };

  const interpolateTemplate = (content, data, deptList) => {
    if (!content) return '';
    const ctcFormatted = data.salary_offered
      ? (String(data.salary_offered).startsWith('₹') ? data.salary_offered : `₹${data.salary_offered}`)
      : '₹[CTC]';

    const joinDateFormatted = data.joining_date
      ? new Date(data.joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '[Joining Date]';

    const offerDateFormatted = data.offer_date
      ? new Date(data.offer_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const expiryDateFormatted = data.offer_expiry_date
      ? new Date(data.offer_expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '[Expiry Date]';

    const matchedDept = (deptList || departments).find(d => String(d.id) === String(data.department_id));
    const deptName = matchedDept ? (matchedDept.dept_name || matchedDept.name) : '[Department]';

    let text = content;
    text = text.replace(/\{\{\s*candidate_name\s*\}\}/gi, data.candidate_name || '[Candidate Name]');
    text = text.replace(/\{\{\s*candidate_email\s*\}\}/gi, data.candidate_email || '[Candidate Email]');
    text = text.replace(/\{\{\s*candidate_phone\s*\}\}/gi, data.candidate_phone || '[Candidate Phone]');
    text = text.replace(/\{\{\s*job_title\s*\}\}/gi, data.job_position || '[Job Title]');
    text = text.replace(/\{\{\s*position\s*\}\}/gi, data.job_position || '[Job Title]');
    text = text.replace(/\{\{\s*department\s*\}\}/gi, deptName);
    text = text.replace(/\{\{\s*ctc\s*\}\}/gi, ctcFormatted);
    text = text.replace(/\{\{\s*salary\s*\}\}/gi, ctcFormatted);
    text = text.replace(/\{\{\s*joining_date\s*\}\}/gi, joinDateFormatted);
    text = text.replace(/\{\{\s*offer_date\s*\}\}/gi, offerDateFormatted);
    text = text.replace(/\{\{\s*offer_expiry_date\s*\}\}/gi, expiryDateFormatted);
    text = text.replace(/\{\{\s*reporting_manager\s*\}\}/gi, data.reporting_manager || '[Reporting Manager]');
    text = text.replace(/\{\{\s*employment_type\s*\}\}/gi, data.employment_type || 'Full-time');
    text = text.replace(/\{\{\s*company_name\s*\}\}/gi, 'Madhura Technologies');
    text = text.replace(/\{\{\s*company_address\s*\}\}/gi, 'Tamil Nadu, India');
    text = text.replace(/\{\{\s*hr_name\s*\}\}/gi, 'Human Resources');

    return text;
  };

  const fetchMetadata = async () => {
    try {
      // 1. Fetch departments
      const metaRes = await apiFetch('/requirements/meta/all');
      if (metaRes && metaRes.departments) {
        setDepartments(metaRes.departments);
      }

      // 2. Fetch candidates for selection
      const candRes = await apiFetch('/candidates/dropdown');
      if (candRes.success && candRes.data) {
        setCandidates(candRes.data);
      }

      // 3. Fetch ONLY Active Offer Letter templates
      const tplRes = await apiFetch('/documents/templates?category=Offer Letters&status=Active');
      if (tplRes.success && tplRes.data) {
        setTemplates(tplRes.data);
      }
    } catch (err) {
      console.error('Failed to load offer creation metadata:', err);
    }
  };

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/offers?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterStatus && filterStatus !== 'All Status') {
        url += `&status=${encodeURIComponent(filterStatus)}`;
      }
      if (filterDept && filterDept !== 'All Departments') {
        url += `&department_id=${encodeURIComponent(filterDept)}`;
      }

      const resData = await apiFetch(url);
      if (resData.success && resData.data) {
        setOffersList(resData.data.offers || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast(resData.message || 'Failed to fetch offer letters', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterStatus, addToast]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, filterStatus]);

  useEffect(() => {
    fetchOffers();
  }, [page, fetchOffers]);

  // Handle Candidate Selection
  const handleCandidateChange = async (candidateId) => {
    const selectedCand = candidates.find(c => String(c.id) === String(candidateId));
    if (!selectedCand) {
      setFormData(prev => ({
        ...prev,
        candidate_id: '',
        candidate_name: '',
        candidate_email: '',
        candidate_phone: ''
      }));
      return;
    }

    // Try fetching full candidate profile to get expected salary, department, etc.
    let fullCand = selectedCand;
    try {
      const fullRes = await apiFetch(`/candidates/${selectedCand.id}`);
      if (fullRes.success && fullRes.data) {
        fullCand = fullRes.data;
      }
    } catch (e) {
      console.warn('Could not fetch full candidate details', e);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        candidate_id: String(fullCand.id),
        candidate_name: fullCand.candidate_name || fullCand.name || '',
        candidate_email: fullCand.email || '',
        candidate_phone: fullCand.mobile_number || '',
        job_position: fullCand.job_position || prev.job_position,
        department_id: fullCand.department_id ? String(fullCand.department_id) : prev.department_id,
        salary_offered: fullCand.expected_salary ? String(fullCand.expected_salary) : prev.salary_offered
      };

      // If a template is already chosen, re-interpolate preview
      if (updated.template_id) {
        const activeTpl = templates.find(t => String(t.id) === String(updated.template_id));
        if (activeTpl && activeTpl.content) {
          updated.template_snapshot = interpolateTemplate(activeTpl.content, updated, departments);
        }
      }

      return updated;
    });
  };

  // Handle Template Selection
  const handleTemplateChange = (templateId) => {
    const activeTpl = templates.find(t => String(t.id) === String(templateId));
    setFormData(prev => {
      const updated = {
        ...prev,
        template_id: String(templateId)
      };

      if (activeTpl && activeTpl.content) {
        updated.template_snapshot = interpolateTemplate(activeTpl.content, updated, departments);
      } else {
        updated.template_snapshot = '';
      }

      return updated;
    });
  };

  // Manual regenerate preview text
  const handleRegeneratePreview = () => {
    const activeTpl = templates.find(t => String(t.id) === String(formData.template_id));
    if (!activeTpl || !activeTpl.content) {
      addToast('Please select an offer letter template first', 'error');
      return;
    }
    const fresh = interpolateTemplate(activeTpl.content, formData, departments);
    setFormData(prev => ({ ...prev, template_snapshot: fresh }));
    addToast('Preview refreshed from template with current details', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('offer_letters', editOfferId ? 'EDIT' : 'CREATE')) return;

    if (!formData.candidate_name.trim() || !formData.job_position.trim() || !formData.department_id || !formData.salary_offered || !formData.joiningDate && !formData.joining_date || !formData.reporting_manager.trim() || !formData.offer_expiry_date) {
      addToast('Please fill in all required offer fields.', 'error');
      return;
    }

    if (!formData.template_id && !formData.template_snapshot) {
      addToast('Please select an active Offer Letter Template from Master Templates.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        candidate_id: formData.candidate_id ? parseInt(formData.candidate_id) : null,
        candidate_name: formData.candidate_name.trim(),
        job_position: formData.job_position.trim(),
        department_id: parseInt(formData.department_id),
        salary_offered: formData.salary_offered.trim(),
        joining_date: formData.joining_date,
        reporting_manager: formData.reporting_manager.trim(),
        employment_type: formData.employment_type,
        offer_expiry_date: formData.offer_expiry_date,
        offer_date: formData.offer_date || new Date().toISOString().slice(0, 10),
        notes: (formData.notes || '').trim(),
        status: formData.status,
        template_id: formData.template_id ? parseInt(formData.template_id) : null,
        template_snapshot: formData.template_snapshot || ''
      };

      const url = editOfferId ? `/offers/${editOfferId}` : '/offers';
      const method = editOfferId ? 'PUT' : 'POST';

      const resData = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (resData.success) {
        addToast(editOfferId ? 'Offer letter updated successfully!' : 'Offer letter generated successfully!', 'success');
        setShowAddModal(false);
        setEditOfferId(null);
        setModalTab('details');
        setFormData({
          candidate_id: '',
          candidate_name: '',
          candidate_email: '',
          candidate_phone: '',
          template_id: '',
          template_snapshot: '',
          job_position: '',
          department_id: '',
          salary_offered: '',
          joining_date: '',
          reporting_manager: '',
          employment_type: 'Full-time',
          offer_expiry_date: '',
          offer_date: new Date().toISOString().slice(0, 10),
          notes: '',
          status: 'Pending'
        });
        fetchOffers();
      } else {
        addToast(resData.message || 'Failed to save offer letter', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (offer) => {
    setEditOfferId(offer.id);
    setFormData({
      candidate_id: offer.candidate_id ? String(offer.candidate_id) : '',
      candidate_name: offer.candidate_name || '',
      candidate_email: offer.candidate_email || '',
      candidate_phone: offer.candidate_phone || '',
      template_id: offer.template_id ? String(offer.template_id) : '',
      template_snapshot: offer.template_snapshot || '',
      job_position: offer.job_position || '',
      department_id: offer.department_id ? String(offer.department_id) : '',
      salary_offered: offer.salary_offered || '',
      joining_date: offer.joining_date ? String(offer.joining_date).slice(0, 10) : '',
      reporting_manager: offer.reporting_manager || '',
      employment_type: offer.employment_type || 'Full-time',
      offer_expiry_date: offer.offer_expiry_date ? String(offer.offer_expiry_date).slice(0, 10) : '',
      offer_date: offer.offer_date ? String(offer.offer_date).slice(0, 10) : (offer.created_at ? String(offer.created_at).slice(0, 10) : ''),
      notes: offer.notes || '',
      status: offer.status || 'Pending'
    });
    setModalTab('details');
    setShowAddModal(true);
    setOpenMenuId(null);
  };

  const handleView = (offer) => {
    setViewOffer(offer);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    if (!checkActionPermission('offer_letters', 'DELETE')) return;
    if (!window.confirm('Are you sure you want to delete this offer letter?')) return;
    try {
      const res = await apiFetch(`/offers/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Offer letter deleted successfully', 'success');
        fetchOffers();
      } else {
        addToast(res.message || 'Failed to delete offer letter', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDownloadPdf = async (offer) => {
    try {
      addToast('Generating offer letter PDF...', 'info');
      const res = await fetch(`/app/offers/${offer.id}/download`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Offer_Letter_${(offer.candidate_name || 'Candidate').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Offer letter downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to download offer letter PDF', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleSendEmail = async (offer) => {
    const targetEmail = offer.candidate_email || prompt('Enter candidate email address:', '');
    if (!targetEmail) return;

    setSendingEmailId(offer.id);
    try {
      const res = await apiFetch(`/offers/${offer.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ to_email: targetEmail })
      });
      if (res.success) {
        addToast(res.message || `Offer letter sent to ${targetEmail}!`, 'success');
      } else {
        addToast(res.message || 'Failed to send offer email', 'error');
      }
    } catch (err) {
      addToast('Failed to connect to email service', 'error');
    } finally {
      setSendingEmailId(null);
      setOpenMenuId(null);
    }
  };

  const openCreateModal = () => {
    setEditOfferId(null);
    setFormData({
      candidate_id: '',
      candidate_name: '',
      candidate_email: '',
      candidate_phone: '',
      template_id: '',
      template_snapshot: '',
      job_position: '',
      department_id: '',
      salary_offered: '',
      joining_date: '',
      reporting_manager: '',
      employment_type: 'Full-time',
      offer_expiry_date: '',
      offer_date: new Date().toISOString().slice(0, 10),
      notes: '',
      status: 'Pending'
    });
    setModalTab('details');
    setShowAddModal(true);
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Accepted': return { bg: '#ECFDF5', text: '#10B981' };
      case 'Pending': return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Dropdown options
  const departmentOptions = [
    { value: 'All Departments', label: 'All Departments' },
    ...departments.map(d => ({ value: String(d.id), label: d.dept_name || d.name }))
  ];

  const candidateOptions = [
    { value: '', label: 'Select Candidate (or enter custom name below)' },
    ...candidates.map(c => ({
      value: String(c.id),
      label: `${c.candidate_name || c.name} (${c.job_position || 'Applicant'})`
    }))
  ];

  const templateOptions = [
    { value: '', label: 'Select Offer Letter Template *' },
    ...templates.map(t => ({
      value: String(t.id),
      label: `${t.template_name} (${t.template_source_type === 'file' ? 'File Template' : 'Editor Template'})`
    }))
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Offer Letters</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
            Generate, preview, and issue candidate offer letters linked to Master Templates
          </p>
        </div>
        {canCreate('offer_letters') && (
          <button
            onClick={() => {
              if (!checkActionPermission('offer_letters', 'CREATE')) return;
              openCreateModal();
            }}
            style={{ 
              padding: '10px 18px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#2952E3', 
              color: '#FFF', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: '600',
              boxShadow: '0 2px 6px rgba(41,82,227,0.25)'
            }}
          >
            <Plus size={16} /> Create Offer
          </button>
        )}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'visible' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 180 }}>
              <AppDropdown
                value={filterDept}
                onChange={v => setFilterDept(v)}
                options={departmentOptions}
                size="sm"
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <AppDropdown
                value={filterStatus}
                onChange={v => setFilterStatus(v)}
                options={[
                  { value: 'All Status', label: 'All Status' },
                  { value: 'Accepted', label: 'Accepted' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Rejected', label: 'Rejected' }
                ]}
                size="sm"
              />
            </div>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search candidate, job, manager..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>
          <div>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Total: <strong>{total}</strong> offers
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', minHeight: 220 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading offer letters...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Candidate</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Job Title</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Template Used</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>CTC</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Joining Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No offer letters found</td>
                  </tr>
                ) : (
                  offersList.map((row, index) => {
                    const joinDate = row.joining_date ? new Date(row.joining_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';
                    const isMenuOpen = openMenuId === row.id;

                    return (
                      <tr key={row.id} style={{ borderBottom: index === offersList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          <div>{row.candidate_name}</div>
                          {row.candidate_email && (
                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>{row.candidate_email}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>
                          <div>{row.job_position}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{row.department_name || 'Department'}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#2563EB', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {row.template_name || (row.template_snapshot ? 'Custom Snapshot' : 'Standard Offer')}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>
                          {row.salary_offered.startsWith('₹') ? row.salary_offered : `₹${row.salary_offered}`}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{joinDate}</td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            backgroundColor: getStatusStyle(row.status).bg, 
                            color: getStatusStyle(row.status).text 
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'center', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleView(row)}
                              title="View Generated Offer"
                              style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={14} /> View
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(row)}
                              title="Download PDF"
                              style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                            >
                              <Download size={14} />
                            </button>

                            <div style={{ position: 'relative' }}>
                              <button 
                                onClick={() => setOpenMenuId(isMenuOpen ? null : row.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 6, borderRadius: 6 }}
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {isMenuOpen && (
                                <>
                                  <div 
                                    style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                                    onClick={() => setOpenMenuId(null)} 
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: '#FFF',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                    border: '1px solid #E2E8F0',
                                    width: 170,
                                    zIndex: 40,
                                    padding: '4px 0',
                                    textAlign: 'left'
                                  }}>
                                    {canEdit('offer_letters') && (
                                      <button
                                        onClick={() => handleSendEmail(row)}
                                        disabled={sendingEmailId === row.id}
                                        style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                      >
                                        <Send size={14} /> {sendingEmailId === row.id ? 'Sending...' : 'Send via Email'}
                                      </button>
                                    )}

                                    {canEdit('offer_letters') && (
                                      <button
                                        onClick={() => handleEdit(row)}
                                        style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                      >
                                        <Edit size={14} /> Edit Offer
                                      </button>
                                    )}

                                    {canDelete('offer_letters') && (
                                      <button
                                        onClick={() => handleDelete(row.id)}
                                        style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                      >
                                        <Trash2 size={14} /> Delete
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
            Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#64748B' }}
            >
              <ChevronLeft size={16} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i + 1}
                onClick={() => setPage(i + 1)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === i + 1 ? '#2952E3' : '#FFF', border: page === i + 1 ? 'none' : '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', color: page === i + 1 ? '#FFF' : '#64748B', fontSize: '13px', fontWeight: '500' }}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#64748B' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Create / Edit Offer Letter Modal */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1050px', maxWidth: '92vw', maxHeight: '92vh' }}>
            
            {/* Modal Header with Tabs */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">
                  {editOfferId ? 'Edit Offer Letter' : 'Create Offer Letter'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select candidate & master template, auto-fill variables, and preview the generated offer letter.
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: modalTab === 'details' ? '#FFF' : 'transparent',
                      color: modalTab === 'details' ? '#2563EB' : '#64748B',
                      boxShadow: modalTab === 'details' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    1. Offer Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('preview')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: modalTab === 'preview' ? '#FFF' : 'transparent',
                      color: modalTab === 'preview' ? '#2563EB' : '#64748B',
                      boxShadow: modalTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    2. Letter Preview {formData.template_snapshot && '✓'}
                  </button>
                </div>

                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-6">
                  {/* Step A: Candidate & Template Selection */}
                  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Step 1: Select Candidate & Master Template
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Select Candidate from Database
                        </label>
                        <AppDropdown
                          value={formData.candidate_id}
                          onChange={handleCandidateChange}
                          options={candidateOptions}
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Master Offer Template <span className="text-red-500">*</span>
                        </label>
                        <AppDropdown
                          value={formData.template_id}
                          onChange={handleTemplateChange}
                          options={templateOptions}
                          size="sm"
                        />
                        {templates.length === 0 && (
                          <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                            No active templates in category "Offer Letters". Please create one in Documents → Templates.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step B: Candidate & Offer Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.candidate_name}
                        onChange={e => setFormData({ ...formData, candidate_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Job Position <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.job_position}
                        onChange={e => setFormData({ ...formData, job_position: e.target.value })}
                        placeholder="e.g. Senior React Developer"
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                      <AppDropdown
                        value={formData.department_id}
                        onChange={v => setFormData({ ...formData, department_id: v })}
                        options={[
                          { value: '', label: 'Select Department' },
                          ...departments.map(d => ({ value: String(d.id), label: d.dept_name || d.name }))
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Annual CTC / Salary Offered <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.salary_offered}
                        onChange={e => setFormData({ ...formData, salary_offered: e.target.value })}
                        placeholder="e.g. 18,00,000"
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Joining Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.joining_date}
                        onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Offer Expiry Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.offer_expiry_date}
                        onChange={e => setFormData({ ...formData, offer_expiry_date: e.target.value })}
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Reporting Manager <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.reporting_manager}
                        onChange={e => setFormData({ ...formData, reporting_manager: e.target.value })}
                        placeholder="e.g. Aarav Mehta"
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Type <span className="text-red-500">*</span></label>
                      <AppDropdown
                        value={formData.employment_type}
                        onChange={v => setFormData({ ...formData, employment_type: v })}
                        options={[
                          { value: 'Full-time', label: 'Full-time' },
                          { value: 'Part-time', label: 'Part-time' },
                          { value: 'Contract', label: 'Contract' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Email (for sending offer)</label>
                      <input
                        type="email"
                        value={formData.candidate_email}
                        onChange={e => setFormData({ ...formData, candidate_email: e.target.value })}
                        placeholder="candidate@example.com"
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <AppDropdown
                        value={formData.status}
                        onChange={v => setFormData({ ...formData, status: v })}
                        options={[
                          { value: 'Pending', label: 'Pending' },
                          { value: 'Accepted', label: 'Accepted' },
                          { value: 'Rejected', label: 'Rejected' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Internal notes or special terms..."
                        style={{ height: '70px' }}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE LETTER PREVIEW */}
              {modalTab === 'preview' && (
                <div className="space-y-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                        Live Variable-Merged Letter Preview
                      </div>
                      <div style={{ fontSize: 11, color: '#3B82F6' }}>
                        Dynamic placeholders ({'{{...}}'}) have been replaced with the candidate's details. You can make final text adjustments below.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegeneratePreview}
                      style={{
                        padding: '6px 12px', background: '#FFF', color: '#2563EB',
                        border: '1px solid #93C5FD', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <RefreshCw size={13} /> Refresh from Template
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Generated Offer Letter Content (Saved as Immutable Snapshot)
                    </label>
                    <textarea
                      value={formData.template_snapshot}
                      onChange={e => setFormData({ ...formData, template_snapshot: e.target.value })}
                      placeholder="Select an Offer Letter Template on the Offer Details tab to generate preview..."
                      style={{ height: '360px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
                      className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-200 shrink-0">
                <div>
                  {modalTab === 'details' ? (
                    <button
                      type="button"
                      onClick={() => {
                        // If template chosen, make sure snapshot is generated
                        if (formData.template_id && !formData.template_snapshot) {
                          const activeTpl = templates.find(t => String(t.id) === String(formData.template_id));
                          if (activeTpl && activeTpl.content) {
                            setFormData(prev => ({
                              ...prev,
                              template_snapshot: interpolateTemplate(activeTpl.content, formData, departments)
                            }));
                          }
                        }
                        setModalTab('preview');
                      }}
                      className="px-5 h-11 bg-slate-100 text-blue-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Next: Preview Generated Letter →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalTab('details')}
                      className="px-5 h-11 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                    >
                      ← Back to Details
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 h-11 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Saving Offer...' : (editOfferId ? 'Update Offer' : 'Save & Issue Offer Letter')}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </>
      )}

      {/* View Offer Letter Modal */}
      {showViewModal && viewOffer && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content" style={{ width: '800px', maxWidth: '92vw', maxHeight: '92vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Offer Letter Details</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Candidate: <strong>{viewOffer.candidate_name}</strong> | Position: {viewOffer.job_position}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleDownloadPdf(viewOffer)}
                  style={{ padding: '8px 14px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Annual CTC</span>
                  <span className="text-sm font-bold text-slate-800">
                    {viewOffer.salary_offered.startsWith('₹') ? viewOffer.salary_offered : `₹${viewOffer.salary_offered}`}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Joining Date</span>
                  <span className="text-sm font-bold text-slate-800">
                    {viewOffer.joining_date ? new Date(viewOffer.joining_date).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Offer Expiry</span>
                  <span className="text-sm font-bold text-slate-800">
                    {viewOffer.offer_expiry_date ? new Date(viewOffer.offer_expiry_date).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Status</span>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    backgroundColor: getStatusStyle(viewOffer.status).bg,
                    color: getStatusStyle(viewOffer.status).text
                  }}>
                    {viewOffer.status}
                  </span>
                </div>
              </div>

              {/* Template Snapshot Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="block text-xs font-semibold text-slate-500 uppercase">
                    Frozen Letter Snapshot (Master Template: {viewOffer.template_name || 'Standard'})
                  </span>
                  <span style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                    Immutable Historical Record
                  </span>
                </div>

                <div style={{
                  padding: 20,
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#1E293B',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: 1.7,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {viewOffer.template_snapshot || `Dear ${viewOffer.candidate_name},\n\nWe are pleased to offer you employment with Madhura Technologies in the position of ${viewOffer.job_position}.\n\nAnnual CTC: ${viewOffer.salary_offered}\nJoining Date: ${viewOffer.joining_date ? new Date(viewOffer.joining_date).toLocaleDateString() : ''}\nReporting Manager: ${viewOffer.reporting_manager}\n\nSincerely,\nMadhura Technologies`}
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-6 h-10 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
