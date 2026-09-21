import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import {
  Search, Filter, Plus, MoreHorizontal, ChevronLeft, ChevronRight, X,
  AlertTriangle, Users, Globe, ExternalLink, CheckCircle2, AlertCircle,
  RefreshCw, Linkedin, Copy, Check, Settings, Key, ShieldCheck, Zap, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { canCreate, canEdit, canDelete, checkActionPermission } from '../../lib/permissions';

// ─── Custom Dropdown ─────────────────────────────────────────────────────────
function CustomSelect({ id, value, onChange, options, placeholder = 'Select...', accentColor = '#3B82F6', isOpen, onToggle, onClose }) {
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div style={{ position: 'relative', zIndex: isOpen ? 9001 : 1 }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          width: '100%', height: '40px', padding: '0 36px 0 12px',
          border: `1.5px solid ${isOpen ? accentColor : '#E2E8F0'}`,
          borderRadius: '9px', fontSize: '13px',
          color: selected ? '#1E293B' : '#94A3B8',
          background: isOpen ? '#fff' : '#FAFAFA',
          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.15s',
          boxShadow: isOpen ? `0 0 0 3px ${accentColor}22` : 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={isOpen ? accentColor : '#94A3B8'} strokeWidth="2.5"
          style={{ position: 'absolute', right: '12px', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: `1.5px solid ${accentColor}50`,
          borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(10,22,41,0.16), 0 2px 8px rgba(10,22,41,0.08)',
          zIndex: 9999, maxHeight: '188px', overflowY: 'auto',
          animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)'
        }}>
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value}
                onClick={() => { onChange(String(opt.value)); onClose(); }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? `${accentColor}12` : 'transparent'; }}
                style={{
                  padding: '9px 14px', fontSize: '13px', cursor: 'pointer',
                  color: isSel ? accentColor : '#334155',
                  background: isSel ? `${accentColor}12` : 'transparent',
                  fontWeight: isSel ? '600' : '400',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.1s'
                }}
              >
                <span style={{ width: '14px', flexShrink: 0 }}>
                  {isSel && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function JobOpenings() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: '',
    designation: '',
    type: 'Full Time',
    location: '',
    vacancies: '',
    experienceFrom: '0',
    experienceTo: '5',
    salaryFrom: '',
    salaryTo: '',
    hiringManager: '',
    requestedBy: '',
    openingDate: '',
    closingDate: '',
    description: '',
    skills: '',
    status: 'Open',
    priority: 'Medium',
    education: '',
    responsibilities: '',
    requirements: '',
    remarks: '',
    branch: '',
    company: ''
  });

  const [openings, setOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [meta, setMeta] = useState({ departments: [], designations: [], branches: [], employees: [], companies: [] });

  // Modal States
  const [editingJobId, setEditingJobId] = useState(null);
  const [selectedJobForLinks, setSelectedJobForLinks] = useState(null);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [copiedLinkType, setCopiedLinkType] = useState(null);
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null);
  const [channelStatuses, setChannelStatuses] = useState({});
  const [publishSummary, setPublishSummary] = useState(null);
  const [isPublishingId, setIsPublishingId] = useState(null);
  const [selectedErrorDetails, setSelectedErrorDetails] = useState(null);

  // LinkedIn Settings & OAuth Modal
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInConfig, setLinkedInConfig] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [orgIdInput, setOrgIdInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);

  // Dropdown open state (key of which custom dropdown is open)
  const [openDropdown, setOpenDropdown] = useState(null);

  // ── Publish / Close / Reopen Flow States ───────────────────────────────────
  const [publishModalJob, setPublishModalJob] = useState(null); // { id, job_title, channel }
  const [closeModalJob, setCloseModalJob] = useState(null);
  const [closeScope, setCloseScope] = useState('HRMS_ONLY');
  const [closeChannels, setCloseChannels] = useState({ CAREER_PAGE: true, LINKEDIN: true, INDEED: true });
  const [closeReason, setCloseReason] = useState('Job Filled');
  const [isClosingId, setIsClosingId] = useState(null);
  const [reopenModalJob, setReopenModalJob] = useState(null);
  const [reopenChannels, setReopenChannels] = useState({ CAREER_PAGE: true, LINKEDIN: false, INDEED: false });
  const [isReopeningId, setIsReopeningId] = useState(null);
  const [platformDropdownJobId, setPlatformDropdownJobId] = useState(null);
  // ────────────────────────────────────────────────────────────────────────────

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

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

  const fetchMeta = async () => {
    try {
      const res = await fetch('/app/requirements/meta/all', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data && data.departments) {
        setMeta(data);
      }
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  };

  const fetchLinkedInStatus = async () => {
    try {
      const res = await fetch('/app/auth/linkedin/status');
      const data = await res.json();
      if (data.success) {
        setLinkedInConfig(data.data);
        if (data.data.orgId) setOrgIdInput(data.data.orgId);
      }
    } catch (e) { }
  };

  const fetchRequirements = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const query = new URLSearchParams({
        search,
        page,
        limit
      });
      if (selectedDept) query.append('department_id', selectedDept);
      if (selectedStatus) query.append('status', selectedStatus);

      const res = await fetch(`/app/requirements?${query}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const resData = await res.json();
      if (resData.success) {
        setOpenings(resData.data.requirements || []);
        setTotal(resData.data.total || 0);
      } else {
        setErrorMsg(resData.message || 'Failed to fetch requirements');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchLinkedInStatus();
  }, []);

  useEffect(() => {
    fetchRequirements();
  }, [search, selectedDept, selectedStatus, page]);

  useEffect(() => {
    if (openings && openings.length > 0) {
      openings.forEach(op => {
        fetchChannelsForJob(op.id);
      });
    }
  }, [openings]);

  const resetForm = () => {
    setEditingJobId(null);
    setFormData({
      title: '', code: '', department: '', designation: '', type: 'Full Time', location: '',
      vacancies: '', experienceFrom: '0', experienceTo: '5', salaryFrom: '', salaryTo: '',
      hiringManager: '', requestedBy: '', openingDate: '', closingDate: '', description: '',
      skills: '', status: 'Open', priority: 'Medium', education: '', responsibilities: '',
      requirements: '', remarks: '', branch: '', company: ''
    });
  };

  const handleEditClick = (job) => {
    if (!checkActionPermission('job_openings', 'EDIT')) return;
    setEditingJobId(job.id);
    setFormData({
      title: job.job_title || '',
      code: job.requirement_code || '',
      department: job.department_id || '',
      designation: job.designation_id || '',
      type: job.employment_type || 'Full Time',
      location: job.location || '',
      vacancies: job.vacancies || '',
      experienceFrom: job.experience_from || '0',
      experienceTo: job.experience_to || '5',
      salaryFrom: job.salary_from || '',
      salaryTo: job.salary_to || '',
      hiringManager: job.hiring_manager || '',
      requestedBy: job.requested_by || '',
      openingDate: job.opening_date ? String(job.opening_date).split('T')[0] : '',
      closingDate: job.closing_date ? String(job.closing_date).split('T')[0] : '',
      description: job.job_description || '',
      skills: job.skills || '',
      status: job.status || 'Published',
      priority: job.priority || 'Medium',
      education: job.education || '',
      responsibilities: job.responsibilities || '',
      requirements: job.requirements || '',
      remarks: job.remarks || '',
      branch: job.branch_id || '',
      company: job.company_id || ''
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingJobId) {
      if (!checkActionPermission('job_openings', 'EDIT')) return;
    } else {
      if (!checkActionPermission('job_openings', 'CREATE')) return;
    }

    if (!formData.title || !formData.department || !formData.designation) {
      alert('Please fill in required fields.');
      return;
    }
    setErrorMsg(null);

    const payload = {
      job_title: formData.title,
      department_id: parseInt(formData.department),
      designation_id: parseInt(formData.designation),
      employment_type: formData.type,
      vacancies: parseInt(formData.vacancies),
      priority: formData.priority,
      experience_from: parseInt(formData.experienceFrom) || 0,
      experience_to: parseInt(formData.experienceTo) || 0,
      salary_from: formData.salaryFrom ? parseFloat(formData.salaryFrom) : null,
      salary_to: formData.salaryTo ? parseFloat(formData.salaryTo) : null,
      location: formData.location,
      hiring_manager: formData.hiringManager ? parseInt(formData.hiringManager) : null,
      requested_by: formData.requestedBy ? parseInt(formData.requestedBy) : null,
      opening_date: formData.openingDate,
      closing_date: formData.closingDate,
      job_description: formData.description,
      skills: formData.skills,
      status: formData.status,
      education: formData.education || null,
      responsibilities: formData.responsibilities || null,
      requirements: formData.requirements || null,
      remarks: formData.remarks || null,
      company_id: formData.company ? parseInt(formData.company) : null,
      branch_id: formData.branch ? parseInt(formData.branch) : null
    };

    try {
      const url = editingJobId ? `/app/requirements/${editingJobId}` : '/app/requirements';
      const method = editingJobId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(editingJobId ? 'Job opening updated successfully!' : 'Job opening created successfully!');
        fetchRequirements();
        resetForm();
        setShowAddModal(false);
      } else {
        alert(data.message || 'Validation failed');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit requirement');
    }
  };

  const handlePublishChannel = async (jobId, channel) => {
    if (!checkActionPermission('job_openings', 'EDIT')) return;
    setPublishModalJob(null);
    setIsPublishingId(jobId);
    try {
      const endpoint = channel === 'LINKEDIN'
        ? `/app/requirements/${jobId}/publish-linkedin`
        : `/app/requirements/${jobId}/publish`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      await fetchRequirements();
      await fetchChannelsForJob(jobId);
      if (!data.success) {
        alert(data.message || data.errorMessage || 'Publishing failed. Please try again.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsPublishingId(null);
    }
  };

  // Legacy: still used by old publish-all path if needed
  const handlePublishJob = async (jobId) => handlePublishChannel(jobId, 'ALL');

  const handleRetryLinkedInPublish = async (jobId) => {
    try {
      setIsPublishingId(jobId);
      const res = await fetch(`/app/requirements/${jobId}/publish-linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success && data.status === 'PUBLISHED') {
        alert('LinkedIn social media post published successfully!');
        if (publishSummary) {
          setPublishSummary(prev => prev ? {
            ...prev,
            channels: {
              ...prev.channels,
              LINKEDIN: data.result
            }
          } : null);
        }
        if (selectedErrorDetails) {
          setSelectedErrorDetails(null);
        }
      } else {
        const err = data.errorMessage || data.result?.errorMessage || data.message || 'LinkedIn publishing failed.';
        alert(`LinkedIn Post Failed:\n${err}`);
      }
      await fetchRequirements();
      await fetchChannelsForJob(jobId);
    } catch (e) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsPublishingId(null);
    }
  };

  const handleCloseJob = async (jobId) => {
    // Legacy stub — now handled via modal
    setCloseModalJob(openings.find(o => o.id === jobId) || { id: jobId, job_title: '' });
    setCloseScope('HRMS_ONLY');
    setCloseChannels({ CAREER_PAGE: true, LINKEDIN: true, INDEED: true });
    setCloseReason('Job Filled');
  };

  const handleCloseJobConfirmed = async () => {
    if (!closeModalJob) return;
    const jobId = closeModalJob.id;
    if (!checkActionPermission('job_openings', 'EDIT')) return;
    setIsClosingId(jobId);
    try {
      const res = await fetch(`/app/requirements/${jobId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ scope: closeScope, channels: closeChannels, reason: closeReason })
      });
      const data = await res.json();
      if (data.success) {
        setCloseModalJob(null);
        fetchRequirements();
        fetchChannelsForJob(jobId);
      } else {
        alert(data.message || 'Failed to close job');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsClosingId(null);
    }
  };

  const handleReopenJobConfirmed = async () => {
    if (!reopenModalJob) return;
    const jobId = reopenModalJob.id;
    setIsReopeningId(jobId);
    try {
      const res = await fetch(`/app/requirements/${jobId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ channels: reopenChannels })
      });
      const data = await res.json();
      if (data.success) {
        setReopenModalJob(null);
        fetchRequirements();
        fetchChannelsForJob(jobId);
      } else {
        alert(data.message || 'Failed to reopen job');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsReopeningId(null);
    }
  };


  const getSlug = (title, id) => {
    const clean = String(title || 'job').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `${clean}-${id}`;
  };

  const getTrackedUrl = (job, source) => {
    if (!job) return '';
    const baseUrl = 'https://madhuratech.com/career';
    if (!source || source === 'CAREER_PAGE') return baseUrl;
    return `${baseUrl}?source=${source.toLowerCase()}&job=${job.id}`;
  };

  const handleDeleteJob = async (jobId) => {
    if (!checkActionPermission('job_openings', 'DELETE')) return;
    try {
      const res = await fetch(`/app/requirements/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Job opening deleted successfully and removed from active public channels.');
        setDeleteConfirmJob(null);
        fetchRequirements();
      } else {
        alert(data.message || 'Failed to delete job');
      }
    } catch (err) {
      alert('Error deleting job opening');
    }
  };

  const fetchChannelsForJob = async (jobId) => {
    try {
      const res = await fetch(`/app/requirements/${jobId}/publishing-channels`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setChannelStatuses(prev => ({ ...prev, [jobId]: data.channels }));
      }
    } catch (e) { }
  };

  const handleSaveLinkedInToken = async (e) => {
    e.preventDefault();
    setIsSavingToken(true);
    try {
      const res = await fetch('/app/auth/linkedin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenInput, orgId: orgIdInput })
      });
      const data = await res.json();
      if (data.success) {
        alert('LinkedIn credentials saved successfully!');
        fetchLinkedInStatus();
        setTokenInput('');
        setShowLinkedInModal(false);
      } else {
        alert(data.message || 'Failed to save credentials');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setIsSavingToken(false);
    }
  };

  const copyToClipboard = (text, type) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedLinkType(type);
    setTimeout(() => setCopiedLinkType(null), 2200);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Published':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'Open':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
      case 'Draft':
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
      case 'Closed':
        return { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
      case 'On Hold':
        return { bg: '#FAF5FF', color: '#9333EA', border: '#E9D5FF' };
      case 'Cancelled':
      case 'Rejected':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
      case 'Approved':
        return { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' };
      default:
        return { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
    }
  };

  // ── Platform Status Display Helper ─────────────────────────────────────────
  const getPlatformStatusDisplay = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PUBLISHED':     return { dot: '#10B981', label: '✓ Published',      textColor: '#059669' };
      case 'PUBLISHING':    return { dot: '#F59E0B', label: '⟳ Publishing...',   textColor: '#D97706' };
      case 'FAILED':        return { dot: '#EF4444', label: '✕ Failed',          textColor: '#DC2626' };
      case 'CLOSED':        return { dot: '#64748B', label: '● Closed',          textColor: '#475569' };
      case 'EXPIRED':       return { dot: '#8B5CF6', label: '● Expired',         textColor: '#7C3AED' };
      case 'NOT_CONNECTED': return { dot: '#CBD5E1', label: '○ Not Connected',   textColor: '#94A3B8' };
      case 'DRAFT':         return { dot: '#CBD5E1', label: '○ Not Published',   textColor: '#94A3B8' };
      default:              return { dot: '#CBD5E1', label: `○ ${status || 'Not Published'}`, textColor: '#94A3B8' };
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", -apple-system, sans-serif' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F172A' }}>Job Openings</h1>

        {/* Header Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          {/* LinkedIn Integration Status & Settings button */}
          <button
            onClick={() => {
              fetchLinkedInStatus();
              setShowLinkedInModal(true);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Configure LinkedIn Integration & permissions"
          >
            <Linkedin size={17} color="#0A66C2" />
            <span>LinkedIn Integration</span>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: (linkedInConfig?.hasToken) ? '#10B981' : '#F59E0B',
              boxShadow: (linkedInConfig?.hasToken) ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(245, 158, 11, 0.6)'
            }} />
          </button>

          {/* Create Opening */}
          {canCreate('job_openings') && (
            <button
              onClick={() => {
                if (!checkActionPermission('job_openings', 'CREATE')) return;
                setShowAddModal(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(37, 99, 255, 0.25)'
              }}
            >
              <Plus size={16} /> Create Opening
            </button>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search job title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '180px' }}>
              <AppDropdown
                value={selectedDept}
                onChange={v => setSelectedDept(v)}
                options={[{value:'',label:'All Departments'}]}
                size="sm"
              />
            </div>
            <div style={{ width: '160px' }}>
              <AppDropdown
                value={selectedStatus}
                onChange={v => setSelectedStatus(v)}
                options={[{value:'',label:'All Status'},{value:'Open',label:'Open'},{value:'Published',label:'Published'},{value:'Closed',label:'Closed'},{value:'Draft',label:'Draft'},{value:'Pending',label:'Pending'},{value:'Approved',label:'Approved'}]}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading openings...</div>
        ) : errorMsg ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        ) : openings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No job openings found.</div>
        ) : (
          /* Table */
          <div style={{ overflowX: 'auto', minHeight: '420px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Job ID</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Job Title</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Department</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Location</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Vacancies</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Publishing</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Overall Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openings.map((row, index) => {
                  const statusStyle = getStatusBadgeStyle(row.status);
                  const channels = channelStatuses[row.id] || [];
                  const careerPageCh = channels.find(c => c.channel === 'CAREER_PAGE');
                  const linkedInCh = channels.find(c => c.channel === 'LINKEDIN');
                  const indeedCh = channels.find(c => c.channel === 'INDEED');

                  // Status determinations
                  const cpStatus = row.status === 'Closed' ? 'CLOSED' : (careerPageCh?.status === 'PUBLISHED' || row.status === 'Published' ? 'PUBLISHED' : (careerPageCh?.status || 'DRAFT'));
                  const liStatusRaw = (linkedInCh?.status || '').toUpperCase();
                  const liStatus = row.status === 'Closed' ? 'CLOSED' : (liStatusRaw || (linkedInConfig?.hasToken ? 'DRAFT' : 'NOT_CONNECTED'));
                  const indeedStatus = row.status === 'Closed' ? 'EXPIRED' : (indeedCh?.status || 'NOT_CONNECTED');

                  const cpDisp = getPlatformStatusDisplay(cpStatus);
                  const liDisp = getPlatformStatusDisplay(liStatus);
                  const indeedDisp = getPlatformStatusDisplay(indeedStatus);

                  const cpUrl = careerPageCh?.external_url || getTrackedUrl(row, 'CAREER_PAGE');
                  const liUrl = linkedInCh?.external_url || `https://www.linkedin.com/company/${linkedInConfig?.orgId || '109901015'}/`;

                  const isPlatformOpen = platformDropdownJobId === row.id;
                  const isLowerRow = index >= Math.max(1, openings.length - 3);

                  return (
                    <tr key={row.id} style={{ borderBottom: index === openings.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#2563EB', whiteSpace: 'nowrap' }}>{row.requirement_code}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>{row.job_title}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{row.department_name}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{row.location}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{row.employment_type}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.vacancies}</td>

                      {/* Clean Straight Publishing Column */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', position: 'relative' }}>
                        {row.status === 'Closed' ? (
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748B' }}>Closed</span>
                        ) : (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={() => setPlatformDropdownJobId(isPlatformOpen ? null : row.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                background: isPlatformOpen ? '#EFF6FF' : '#F8FAFC',
                                color: isPlatformOpen ? '#2563EB' : '#334155',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                              }}
                            >
                              Choose Platform <span style={{ fontSize: '9px' }}>▼</span>
                            </button>

                              {/* Platform Popover Dropdown */}
                              {isPlatformOpen && (
                                <>
                                  <div
                                    onClick={() => setPlatformDropdownJobId(null)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    zIndex: 9999,
                                    width: '280px',
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    background: '#FFFFFF',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 12px 28px rgba(15,23,42,0.18)',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                      Choose Publishing Platform
                                    </div>

                                    {/* 1. Website Option */}
                                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <Globe size={14} color="#2563EB" /> Website
                                        </div>
                                        <div style={{ fontSize: '11px', color: cpDisp.textColor, marginTop: '2px', fontWeight: '500' }}>
                                          {cpDisp.label}
                                        </div>
                                      </div>
                                      {cpStatus === 'PUBLISHED' ? (
                                        <a
                                          href={cpUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ padding: '4px 8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        >
                                          View Job Page <ExternalLink size={10} />
                                        </a>
                                      ) : (
                                        <button
                                          disabled={!canEdit('job_openings') || isPublishingId === row.id}
                                          onClick={() => {
                                            setPlatformDropdownJobId(null);
                                            setPublishModalJob({ id: row.id, job_title: row.job_title, channel: 'CAREER_PAGE', channelName: 'Website' });
                                          }}
                                          style={{ padding: '4px 10px', borderRadius: '6px', background: '#2563EB', color: '#FFF', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                          Publish
                                        </button>
                                      )}
                                    </div>

                                    {/* 2. LinkedIn Option */}
                                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <Linkedin size={14} color="#0A66C2" /> LinkedIn
                                        </div>
                                        <div style={{ fontSize: '11px', color: liDisp.textColor, marginTop: '2px', fontWeight: '500' }}>
                                          {liDisp.label}
                                        </div>
                                      </div>
                                      {liStatus === 'PUBLISHED' ? (
                                        <a
                                          href={liUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ padding: '4px 8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        >
                                          View Post <ExternalLink size={10} />
                                        </a>
                                      ) : liStatus === 'FAILED' ? (
                                        <button
                                          onClick={() => {
                                            setPlatformDropdownJobId(null);
                                            setPublishModalJob({ id: row.id, job_title: row.job_title, channel: 'LINKEDIN', channelName: 'LinkedIn' });
                                          }}
                                          style={{ padding: '4px 10px', borderRadius: '6px', background: '#EF4444', color: '#FFF', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                          Retry
                                        </button>
                                      ) : (!linkedInConfig?.hasToken) ? (
                                        <button
                                          onClick={() => {
                                            setPlatformDropdownJobId(null);
                                            fetchLinkedInStatus();
                                            setShowLinkedInModal(true);
                                          }}
                                          style={{ padding: '4px 8px', borderRadius: '6px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                          Connect
                                        </button>
                                      ) : (
                                        <button
                                          disabled={!canEdit('job_openings') || isPublishingId === row.id}
                                          onClick={() => {
                                            setPlatformDropdownJobId(null);
                                            setPublishModalJob({ id: row.id, job_title: row.job_title, channel: 'LINKEDIN', channelName: 'LinkedIn' });
                                          }}
                                          style={{ padding: '4px 10px', borderRadius: '6px', background: '#0A66C2', color: '#FFF', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                          Publish
                                        </button>
                                      )}
                                    </div>

                                    {/* 3. Indeed Option */}
                                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#2164f3' }}>in</span> Indeed
                                        </div>
                                        <div style={{ fontSize: '11px', color: indeedDisp.textColor, marginTop: '2px', fontWeight: '500' }}>
                                          {indeedDisp.label}
                                        </div>
                                      </div>
                                      <button
                                        disabled
                                        title="Indeed API integration is currently not connected"
                                        style={{ padding: '4px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: '600', cursor: 'not-allowed' }}
                                      >
                                        Not Connected
                                      </button>
                                    </div>

                                  </div>
                                </>
                              )}
                            </div>
                          )}
                      </td>

                      {/* Overall Requisition Status */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`
                        }}>
                          {row.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>

                          {row.status === 'Closed' ? (
                            <>
                              {/* View Button for Closed Job */}
                              <button
                                onClick={() => handleEditClick(row)}
                                title="View Job Details"
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#334155', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                              >
                                View
                              </button>

                              {/* View Candidates */}
                              <button
                                onClick={() => navigate(`/recruitment/candidates?job_title=${encodeURIComponent(row.job_title)}`)}
                                title="View Applicants"
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#2563EB', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Users size={14} /> Candidates
                              </button>

                              {/* Reopen Job Button */}
                              {canEdit('job_openings') && (
                                <button
                                  onClick={() => {
                                    setReopenModalJob(row);
                                    setReopenChannels({ CAREER_PAGE: true, LINKEDIN: false, INDEED: false });
                                  }}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Reopen
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Edit Job Button */}
                              {canEdit('job_openings') && (
                                <button
                                  onClick={() => handleEditClick(row)}
                                  title="Edit Job Opening"
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#334155', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                  Edit
                                </button>
                              )}

                              {/* View Candidates */}
                              <button
                                onClick={() => navigate(`/recruitment/candidates?job_title=${encodeURIComponent(row.job_title)}`)}
                                title="View Applicants"
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#2563EB', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Users size={14} /> Candidates
                              </button>

                              {/* Tracking Links Button */}
                              <button
                                onClick={() => {
                                  setSelectedJobForLinks(row);
                                  setShowLinksModal(true);
                                }}
                                title="Application Tracking Links"
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#334155', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                              >
                                Copy Links
                              </button>

                              {/* Close Job Flow Button */}
                              {canEdit('job_openings') && (
                                <button
                                  onClick={() => {
                                    setCloseModalJob(row);
                                    setCloseScope('HRMS_ONLY');
                                    setCloseChannels({ CAREER_PAGE: true, LINKEDIN: true, INDEED: true });
                                    setCloseReason('Job Filled');
                                  }}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  Close <span style={{ fontSize: '9px' }}>▼</span>
                                </button>
                              )}

                              {/* Delete Job Button */}
                              {canDelete('job_openings') && (
                                <button
                                  onClick={() => setDeleteConfirmJob(row)}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: '#64748B', opacity: page <= 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#FFF', fontSize: '13px', fontWeight: '500' }}>
              {page}
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page * limit >= total ? 'not-allowed' : 'pointer', color: '#64748B', opacity: page * limit >= total ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* API Error Details Dialog */}
      {selectedErrorDetails && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setSelectedErrorDetails(null)} />
          <div className="modal-centered-content" style={{ width: '520px', maxWidth: '92vw', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #FEE2E2', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={22} color="#DC2626" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#991B1B' }}>{selectedErrorDetails.channel} Publishing Error</h3>
              </div>
              <button onClick={() => setSelectedErrorDetails(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                The LinkedIn Posts API returned the following response when trying to automatically create the company post:
              </p>
              <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '12px', fontFamily: 'monospace', color: '#0F172A', wordBreak: 'break-word', lineHeight: '1.5' }}>
                {selectedErrorDetails.message}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedErrorDetails.jobId && (
                <button
                  disabled={isPublishingId === selectedErrorDetails.jobId}
                  onClick={() => handleRetryLinkedInPublish(selectedErrorDetails.jobId)}
                  style={{
                    padding: '8px 16px',
                    background: '#059669',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} className={isPublishingId === selectedErrorDetails.jobId ? 'animate-spin' : ''} />
                  {isPublishingId === selectedErrorDetails.jobId ? 'Retrying...' : 'Retry LinkedIn Publishing'}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedErrorDetails(null);
                  fetchLinkedInStatus();
                  setShowLinkedInModal(true);
                }}
                style={{ padding: '8px 16px', background: '#2563EB', color: '#FFF', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
              >
                Reconnect LinkedIn
              </button>
              <button
                onClick={() => setSelectedErrorDetails(null)}
                style={{ padding: '8px 16px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid #CBD5E1', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Multi-Channel Publish Result Modal */}
      {publishSummary && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setPublishSummary(null)} />
          <div className="modal-centered-content" style={{ width: '640px', maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Publishing Status Summary</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{publishSummary.job?.job_title || `Job ID: ${publishSummary.jobId}`}</p>
                </div>
              </div>
              <button onClick={() => setPublishSummary(null)} style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* 1. Website (Career Page) Status */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Globe size={22} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#064E3B' }}>Website (Career Page)</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>Published</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857', marginTop: '3px' }}>Live on Madhura Technologies Career Portal.</div>
                  </div>
                </div>
                {publishSummary.channels?.CAREER_PAGE?.externalUrl && (
                  <a
                    href={publishSummary.channels.CAREER_PAGE.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      background: '#059669',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    View Page <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {/* 2. LinkedIn Company Page Post Status */}
              {publishSummary.channels?.LINKEDIN?.status === 'PUBLISHED' ? (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Linkedin size={22} color="#0A66C2" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#064E3B' }}>LinkedIn</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>Published ✓</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#047857', marginTop: '3px' }}>Social media hiring announcement published to Madhura Technologies LinkedIn Page.</div>
                    </div>
                  </div>
                  {publishSummary.channels?.LINKEDIN?.externalUrl && (
                    <a
                      href={publishSummary.channels.LINKEDIN.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 14px',
                        background: '#0A66C2',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(10, 102, 194, 0.3)',
                        flexShrink: 0
                      }}
                    >
                      View Post <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Linkedin size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>LinkedIn</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
                            {publishSummary.channels?.LINKEDIN?.status || 'Failed'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px', lineHeight: '1.5' }}>
                          {publishSummary.channels?.LINKEDIN?.errorMessage || 'LinkedIn organization posting permission (w_organization_social) is not authorized.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid #FECACA' }}>
                    <button
                      disabled={isPublishingId === publishSummary.jobId}
                      onClick={() => handleRetryLinkedInPublish(publishSummary.jobId)}
                      style={{
                        padding: '7px 14px',
                        background: '#059669',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={13} className={isPublishingId === publishSummary.jobId ? 'animate-spin' : ''} />
                      {isPublishingId === publishSummary.jobId ? 'Retrying...' : 'Retry LinkedIn Publishing'}
                    </button>
                    <button
                      onClick={() => {
                        fetchLinkedInStatus();
                        setShowLinkedInModal(true);
                      }}
                      style={{
                        padding: '7px 14px',
                        background: '#1E293B',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Settings size={13} /> Reconnect LinkedIn
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Indeed Channel Status */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                    IN
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>Indeed</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1' }}>
                        Not Connected
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                      Indeed API integration is not connected.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedJobForLinks(publishSummary.job);
                    setShowLinksModal(true);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  View Tracked Link
                </button>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => setPublishSummary(null)}
                style={{ padding: '10px 24px', background: '#0F172A', color: '#FFFFFF', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* LinkedIn Integration & Settings Modal */}
      {showLinkedInModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowLinkedInModal(false)} />
          <div className="modal-centered-content" style={{ width: '560px', maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A66C2' }}>
                  <Linkedin size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>LinkedIn Integration</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Authorize organization posting permission for Madhura Technologies Company Page.</p>
                </div>
              </div>
              <button onClick={() => setShowLinkedInModal(false)} style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Status Diagnostic Card */}
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Connection Status:</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: linkedInConfig?.hasToken ? '#ECFDF5' : '#FFFBEB',
                    color: linkedInConfig?.hasToken ? '#059669' : '#D97706',
                    border: `1px solid ${linkedInConfig?.hasToken ? '#A7F3D0' : '#FDE68A'}`
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: linkedInConfig?.hasToken ? '#10B981' : '#F59E0B' }} />
                    {linkedInConfig?.hasToken ? 'Connected & Configured' : 'Action Required / Not Connected'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                  <span>Requested Permission:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0F172A' }}>w_organization_social, openid, profile</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                  <span>Organization ID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0F172A' }}>{linkedInConfig?.orgId || '109901015'}</span>
                </div>

                {linkedInConfig?.tokenSnippet && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                    <span>Active Token:</span>
                    <span style={{ fontFamily: 'monospace', color: '#64748B' }}>{linkedInConfig.tokenSnippet}</span>
                  </div>
                )}
              </div>

              {/* PRIMARY CONNECT BUTTON (OAuth) */}
              <div style={{ padding: '18px', border: '1px solid #BFDBFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="#2563EB" /> 1-Click Connect with LinkedIn (Recommended)
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1E40AF', lineHeight: '1.5' }}>
                    Authenticates and requests <code style={{ background: 'rgba(255,255,255,0.6)', padding: '2px 4px', borderRadius: '4px' }}>w_organization_social</code> permission to post to the Madhura Technologies company feed.
                  </p>
                </div>

                <div style={{ paddingTop: '4px' }}>
                  <a
                    href="http://localhost:5000/app/auth/linkedin/connect"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(10, 102, 194, 0.35)',
                      letterSpacing: '0.2px',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <Linkedin size={20} />
                    <span>Connect with LinkedIn</span>
                  </a>
                </div>
              </div>

              {/* MANUAL TOKEN ENTRY (Advanced) */}
              <form onSubmit={handleSaveLinkedInToken} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '14px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} color="#64748B" /> Enter Access Token Manually
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>LinkedIn Access Token</label>
                  <input
                    type="password"
                    placeholder="Paste access token here..."
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>LinkedIn Organization ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 109901015"
                    value={orgIdInput}
                    onChange={e => setOrgIdInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={isSavingToken || (!tokenInput && !orgIdInput)}
                    style={{
                      padding: '10px 18px',
                      background: '#1E293B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: (isSavingToken || (!tokenInput && !orgIdInput)) ? 'not-allowed' : 'pointer',
                      opacity: (isSavingToken || (!tokenInput && !orgIdInput)) ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldCheck size={14} /> {isSavingToken ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </form>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => setShowLinkedInModal(false)}
                style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: '1px solid #CBD5E1', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Job Opening Modal */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{
            width: '1060px', maxWidth: '94vw', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(10,22,41,0.24), 0 8px 24px rgba(10,22,41,0.12)'
          }}>

            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <Plus size={20} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>
                    {editingJobId ? 'Edit Job Opening' : 'New Job Opening'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    {editingJobId ? 'Update requisition details and publishing preferences' : 'Fill in the details to configure and publish this requisition'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: '#F8FAFC' }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>

                {/* Overlay to close dropdowns when clicking outside */}
                {openDropdown && <div onClick={() => setOpenDropdown(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000 }} />}

                {/* Section 1: Basic Information */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(10,22,41,0.04)', flexShrink: 0, marginBottom: '16px' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid #DBEAFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)', borderRadius: '13px 13px 0 0' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', letterSpacing: '0.01em' }}>Basic Information</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748B', fontWeight: '500' }}>Core job details</span>
                  </div>
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Title <span style={{ color: '#EF4444' }}>*</span></label>
                      <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior React Developer"
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department <span style={{ color: '#EF4444' }}>*</span></label>
                      <CustomSelect id="dept" accentColor="#2563EB"
                        value={formData.department} onChange={v => setFormData({ ...formData, department: v })}
                        placeholder="Select Department"
                        options={[{ value: '', label: 'Select Department' }, ...meta.departments.map(d => ({ value: d.id, label: d.name }))]}
                        isOpen={openDropdown === 'dept'}
                        onToggle={() => setOpenDropdown(openDropdown === 'dept' ? null : 'dept')}
                        onClose={() => setOpenDropdown(null)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation <span style={{ color: '#EF4444' }}>*</span></label>
                      <CustomSelect id="desig" accentColor="#2563EB"
                        value={formData.designation} onChange={v => setFormData({ ...formData, designation: v })}
                        placeholder="Select Designation"
                        options={[{ value: '', label: 'Select Designation' }, ...meta.designations.map(d => ({ value: d.id, label: d.name }))]}
                        isOpen={openDropdown === 'desig'}
                        onToggle={() => setOpenDropdown(openDropdown === 'desig' ? null : 'desig')}
                        onClose={() => setOpenDropdown(null)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employment Type <span style={{ color: '#EF4444' }}>*</span></label>
                      <CustomSelect id="emptype" accentColor="#2563EB"
                        value={formData.type} onChange={v => setFormData({ ...formData, type: v })}
                        placeholder="Select Type"
                        options={['Full Time', 'Part Time', 'Contract', 'Internship', 'Temporary', 'Freelancer', 'Remote', 'Hybrid'].map(t => ({ value: t, label: t }))}
                        isOpen={openDropdown === 'emptype'}
                        onToggle={() => setOpenDropdown(openDropdown === 'emptype' ? null : 'emptype')}
                        onClose={() => setOpenDropdown(null)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Location <span style={{ color: '#EF4444' }}>*</span></label>
                      <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Coimbatore / Remote"
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vacancies <span style={{ color: '#EF4444' }}>*</span></label>
                      <input type="number" required min="1" value={formData.vacancies} onChange={e => setFormData({ ...formData, vacancies: e.target.value })} placeholder="e.g. 3"
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Description <span style={{ color: '#EF4444' }}>*</span></label>
                      <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe key responsibilities, expectations, and role objectives..."
                        style={{ width: '100%', height: '90px', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.55' }}
                        onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills Required</label>
                      <input type="text" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} placeholder="e.g. React.js, Node.js, TypeScript, MySQL"
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>
                  </div>
                </div>

                {/* Sections 2 + 3 side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                  {/* Section 2: Experience & Compensation */}
                  <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(10,22,41,0.04)', flexShrink: 0 }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid #DBEAFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)', borderRadius: '13px 13px 0 0' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Experience & Pay</span>
                    </div>
                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Exp. From (Yrs)', key: 'experienceFrom', req: true },
                        { label: 'Exp. To (Yrs)', key: 'experienceTo', req: true },
                        { label: 'Salary From (₹)', key: 'salaryFrom', req: false },
                        { label: 'Salary To (₹)', key: 'salaryTo', req: false },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}{f.req && <span style={{ color: '#EF4444' }}> *</span>}</label>
                          <input type="number" required={f.req} min="0" value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Schedule & Priority */}
                  <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(10,22,41,0.04)', flexShrink: 0 }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid #DBEAFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)', borderRadius: '13px 13px 0 0' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Schedule & Priority</span>
                    </div>
                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opening Date <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="date" required value={formData.openingDate} onChange={e => setFormData({ ...formData, openingDate: e.target.value })}
                          style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closing Date <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="date" required value={formData.closingDate} onChange={e => setFormData({ ...formData, closingDate: e.target.value })}
                          style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority <span style={{ color: '#EF4444' }}>*</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                          {[
                            { v: 'Low', c: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                            { v: 'Medium', c: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                            { v: 'High', c: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
                            { v: 'Critical', c: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                          ].map(p => (
                            <button type="button" key={p.v} onClick={() => setFormData({ ...formData, priority: p.v })}
                              style={{
                                padding: '7px 4px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer',
                                border: `1.5px solid ${formData.priority === p.v ? p.c : '#E2E8F0'}`,
                                background: formData.priority === p.v ? p.bg : '#FAFAFA',
                                color: formData.priority === p.v ? p.c : '#94A3B8',
                                transition: 'all 0.15s'
                              }}
                            >{p.v}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Team & Organization */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(10,22,41,0.04)', flexShrink: 0, marginBottom: '4px' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid #DBEAFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)', borderRadius: '13px 13px 0 0' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Team & Organization</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748B', fontWeight: '500' }}>Optional</span>
                  </div>
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'Hiring Manager', key: 'hiringManager', did: 'mgr', opts: meta.hrEmployees || meta.employees, placeholder: 'Select HR Manager' },
                      { label: 'Requested By', key: 'requestedBy', did: 'req', opts: meta.employees, placeholder: 'Select Requester' },
                      { label: 'Branch', key: 'branch', did: 'br', opts: meta.branches, placeholder: 'Select Branch' },
                      { label: 'Company', key: 'company', did: 'co', opts: meta.companies, placeholder: 'Select Company' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                        <CustomSelect id={f.did} accentColor="#2563EB"
                          value={formData[f.key]} onChange={v => setFormData({ ...formData, [f.key]: v })}
                          placeholder={f.placeholder}
                          options={[{ value: '', label: f.placeholder }, ...(f.opts || []).map(o => ({ value: o.id, label: o.name }))]}
                          isOpen={openDropdown === f.did}
                          onToggle={() => setOpenDropdown(openDropdown === f.did ? null : f.did)}
                          onClose={() => setOpenDropdown(null)} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                      <CustomSelect id="status" accentColor="#2563EB"
                        value={formData.status} onChange={v => setFormData({ ...formData, status: v })}
                        placeholder="Select Status"
                        options={['Open', 'Draft', 'Pending', 'Approved', 'Published', 'Closed'].map(s => ({ value: s, label: s }))}
                        isOpen={openDropdown === 'status'}
                        onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                        onClose={() => setOpenDropdown(null)} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94A3B8' }}>
                  Fields marked <span style={{ color: '#EF4444', fontWeight: '700' }}>*</span> are required
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }}
                    style={{ padding: '0 20px', height: '38px', border: '1.5px solid #CBD5E1', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#475569', background: '#fff', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{
                      padding: '0 24px', height: '38px', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700',
                      color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      boxShadow: '0 3px 12px rgba(37,99,235,0.35)',
                      display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(37,99,235,0.35)'; }}>
                    <CheckCircle2 size={14} />
                    {editingJobId ? 'Update Opening' : 'Save Job Opening'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Tracking Links Modal */}
      {showLinksModal && selectedJobForLinks && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowLinksModal(false)} />
          <div className="modal-centered-content" style={{ width: '650px', maxWidth: '90vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#0A1629]">Job Application Tracking Links</h2>
                <p className="text-xs text-slate-500 mt-1">Unique tracked URLs for job postings on external career portals.</p>
              </div>
              <button onClick={() => setShowLinksModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">LinkedIn Application Link</div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={getTrackedUrl(selectedJobForLinks, 'LINKEDIN')} className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-600" />
                  <button
                    onClick={() => copyToClipboard(getTrackedUrl(selectedJobForLinks, 'LINKEDIN'), 'linkedin')}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold whitespace-nowrap hover:bg-blue-700"
                  >
                    {copiedLinkType === 'linkedin' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">Indeed Application Link</div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={getTrackedUrl(selectedJobForLinks, 'INDEED')} className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-600" />
                  <button
                    onClick={() => copyToClipboard(getTrackedUrl(selectedJobForLinks, 'INDEED'), 'indeed')}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold whitespace-nowrap hover:bg-blue-700"
                  >
                    {copiedLinkType === 'indeed' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">Naukri Application Link</div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={getTrackedUrl(selectedJobForLinks, 'NAUKRI')} className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-600" />
                  <button
                    onClick={() => copyToClipboard(getTrackedUrl(selectedJobForLinks, 'naukri'), 'naukri')}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold whitespace-nowrap hover:bg-blue-700"
                  >
                    {copiedLinkType === 'naukri' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">Direct Madhura Career Page Link</div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={getTrackedUrl(selectedJobForLinks, 'CAREER_PAGE')} className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-600" />
                  <button
                    onClick={() => copyToClipboard(getTrackedUrl(selectedJobForLinks, 'direct'), 'direct')}
                    className="px-3 py-2 bg-slate-800 text-white rounded text-xs font-semibold whitespace-nowrap hover:bg-slate-900"
                  >
                    {copiedLinkType === 'direct' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end shrink-0">
              <button onClick={() => setShowLinksModal(false)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">Done</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmJob && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setDeleteConfirmJob(null)} />
          <div className="modal-centered-content" style={{ width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold">Delete Job Opening?</h3>
              </div>
              <button onClick={() => setDeleteConfirmJob(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong>{deleteConfirmJob.job_title}</strong>?
              </p>
              <p className="text-xs text-slate-500 bg-red-50 p-3 rounded-lg border border-red-100 text-red-700">
                This action will immediately remove the job from all active publishing channels (MadhuraTech Career Page, LinkedIn, Indeed). Historical candidate applications will remain intact.
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button onClick={() => setDeleteConfirmJob(null)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200">Cancel</button>
              <button onClick={() => handleDeleteJob(deleteConfirmJob.id)} className="px-5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-md">Delete Job</button>
            </div>
          </div>
        </>
      )}

      {/* 1. Publish Confirmation Modal */}
      {publishModalJob && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setPublishModalJob(null)} />
          <div className="modal-centered-content" style={{ width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                <Globe size={20} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Publish Job to {publishModalJob.channelName}?</h3>
              </div>
              <button onClick={() => setPublishModalJob(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', flex: 1 }}>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 12px', lineHeight: '1.5' }}>
                Are you sure you want to publish <strong>"{publishModalJob.job_title}"</strong> to {publishModalJob.channelName}?
              </p>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1D4ED8' }}>
                This job will immediately become visible to candidates on {publishModalJob.channelName}.
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#F8FAFC' }}>
              <button
                onClick={() => setPublishModalJob(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isPublishingId === publishModalJob.id}
                onClick={() => handlePublishChannel(publishModalJob.id, publishModalJob.channel)}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}
              >
                {isPublishingId === publishModalJob.id ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. Close Job Confirmation Modal */}
      {closeModalJob && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setCloseModalJob(null)} />
          <div className="modal-centered-content" style={{ width: '520px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D97706' }}>
                <AlertTriangle size={22} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Close Job Opening?</h3>
              </div>
              <button onClick={() => setCloseModalJob(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                  "{closeModalJob.job_title}"
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Choose how you want to close this job:
                </p>
              </div>

              {/* Radio Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{
                  padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${closeScope === 'HRMS_ONLY' ? '#2563EB' : '#E2E8F0'}`,
                  background: closeScope === 'HRMS_ONLY' ? '#EFF6FF' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <input
                    type="radio"
                    name="closeScope"
                    checked={closeScope === 'HRMS_ONLY'}
                    onChange={() => setCloseScope('HRMS_ONLY')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Close only in HRMS</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>The job will be closed internally. External postings remain unaffected.</div>
                  </div>
                </label>

                <label style={{
                  padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${closeScope === 'EVERYWHERE' ? '#2563EB' : '#E2E8F0'}`,
                  background: closeScope === 'EVERYWHERE' ? '#EFF6FF' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <input
                    type="radio"
                    name="closeScope"
                    checked={closeScope === 'EVERYWHERE'}
                    onChange={() => setCloseScope('EVERYWHERE')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Close everywhere</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>The job will also be closed / unpublished on selected platforms.</div>
                  </div>
                </label>
              </div>

              {/* Checkboxes if Close Everywhere */}
              {closeScope === 'EVERYWHERE' && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Publishing platforms to close:
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'CAREER_PAGE', label: 'Website' },
                      { key: 'LINKEDIN', label: 'LinkedIn' },
                      { key: 'INDEED', label: 'Indeed' }
                    ].map(ch => (
                      <label key={ch.key} style={{ fontSize: '13px', color: '#1E293B', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!closeChannels[ch.key]}
                          onChange={e => setCloseChannels({ ...closeChannels, [ch.key]: e.target.checked })}
                        />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Reason Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Optional reason:
                </label>
                <AppDropdown
                value={closeReason}
                onChange={v => setCloseReason(v)}
                options={[{value:'Job Filled',label:'Job Filled'},{value:'Hiring Cancelled',label:'Hiring Cancelled'},{value:'Position On Hold',label:'Position On Hold'},{value:'Duplicate Job',label:'Duplicate Job'},{value:'Other',label:'Other'}]}
                size="sm"
              />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#F8FAFC' }}>
              <button
                onClick={() => setCloseModalJob(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isClosingId === closeModalJob.id}
                onClick={handleCloseJobConfirmed}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}
              >
                {isClosingId === closeModalJob.id ? 'Closing...' : 'Close Job'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 3. Reopen Job Confirmation Modal */}
      {reopenModalJob && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setReopenModalJob(null)} />
          <div className="modal-centered-content" style={{ width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                <RefreshCw size={20} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Reopen Job Opening?</h3>
              </div>
              <button onClick={() => setReopenModalJob(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
                "{reopenModalJob.job_title}"
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Select platforms to publish when reopened:
              </p>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'CAREER_PAGE', label: 'Website' },
                  { key: 'LINKEDIN', label: 'LinkedIn' },
                  { key: 'INDEED', label: 'Indeed' }
                ].map(ch => (
                  <label key={ch.key} style={{ fontSize: '13px', color: '#1E293B', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!reopenChannels[ch.key]}
                      onChange={e => setReopenChannels({ ...reopenChannels, [ch.key]: e.target.checked })}
                    />
                    {ch.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#F8FAFC' }}>
              <button
                onClick={() => setReopenModalJob(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isReopeningId === reopenModalJob.id}
                onClick={handleReopenJobConfirmed}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}
              >
                {isReopeningId === reopenModalJob.id ? 'Reopening...' : 'Reopen Job'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
