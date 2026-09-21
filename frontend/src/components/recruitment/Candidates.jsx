import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Download, Plus, MoreVertical, Star, ChevronLeft, ChevronRight, X, Eye, Edit3, Trash2, Calendar, FileText, CheckCircle2, UserCheck, Briefcase, Mail, Phone, MapPin, DollarSign, Clock, Send, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { canCreate, canEdit, canDelete, canExport, checkActionPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function Candidates() {
  const { addToast } = useToast();
  const [candidatesData, setCandidatesData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals & Menu States
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Pagination & Search & Filter States
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const [search, setSearch] = useState('');
  const [filterJob, setFilterJob] = useState('All Job Openings');
  const [filterStage, setFilterStage] = useState('All Stages');
  const [filterLocation, setFilterLocation] = useState('All Locations');

  const [resumeFile, setResumeFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', gender: 'Male', dob: '', department: '', job: '',
    resume: '', experience: '', currentCompany: '', currentSalary: '', expectedSalary: '',
    noticePeriod: '', skills: '', address: '', status: 'Applied'
  });

  // Edit Candidate Form Data
  const [editFormData, setEditFormData] = useState({});

  // Schedule Interview Form Data
  const [interviewData, setInterviewData] = useState({
    interview_date: '', interview_time: '10:00', round_type: 'Technical Round 1',
    interviewer_name: 'Dhilipan', location: 'Google Meet / Online'
  });

  // Offer Letter Form Data
  const [offerData, setOfferData] = useState({
    offered_salary: '', joining_date: '', designation: '', department_id: ''
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

  const totalPages = Math.ceil(total / limit) || 1;

  const fetchMeta = async () => {
    try {
      const res = await apiFetch('/departments');
      if (Array.isArray(res)) {
        setDepartments(res);
      } else if (res && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    } catch (e) {
      console.error('Error loading departments', e);
    }
  };

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || '',
        job: filterJob !== 'All Job Openings' ? filterJob : '',
        stage: filterStage !== 'All Stages' ? filterStage : '',
        location: filterLocation !== 'All Locations' ? filterLocation : ''
      });

      const res = await apiFetch(`/candidates?${params.toString()}`);
      if (res && res.success && res.data) {
        const candidateList = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data.candidates) ? res.data.candidates : []);
        setCandidatesData(candidateList);
        setTotal(res.data.total !== undefined ? res.data.total : (res.pagination?.total || candidateList.length));
      } else if (Array.isArray(res)) {
        setCandidatesData(res);
        setTotal(res.length);
      } else {
        setCandidatesData([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('Error fetching candidates:', e);
      addToast('Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterJob, filterStage, filterLocation]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMenuId && !e.target.closest('.candidate-action-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleUpdateStatus = async (candidateId, newStatus) => {
    if (!checkActionPermission('candidates', 'EDIT')) return;
    try {
      const res = await fetch(`http://localhost:5000/app/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Candidate status updated to ${newStatus}`, 'success');
        fetchCandidates();
      } else {
        addToast(data.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      addToast('Error updating status', 'error');
    }
  };

  const handleHireCandidate = async (candidate) => {
    if (!checkActionPermission('candidates', 'EDIT')) return;
    try {
      const res = await fetch(`http://localhost:5000/app/candidates/${candidate.id}/convert-to-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        const expCount = data.data?.copied_experiences_count || 0;
        addToast(
          `Candidate successfully hired! Created Employee #${data.data?.employee_id || ''} with ${expCount} previous experience record(s) copied.`,
          'success'
        );
        fetchCandidates();
      } else {
        addToast(data.message || 'Failed to convert candidate', 'error');
      }
    } catch (e) {
      addToast('Error during candidate conversion', 'error');
    }
  };

  const handleDeleteCandidate = async (id, name) => {
    if (!checkActionPermission('candidates', 'DELETE')) return;
    if (!window.confirm(`Are you sure you want to delete candidate ${name}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/app/candidates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Candidate deleted successfully', 'success');
        fetchCandidates();
      } else {
        addToast(data.message || 'Failed to delete candidate', 'error');
      }
    } catch (e) {
      addToast('Error deleting candidate', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('candidates', 'EDIT')) return;
    setSubmitting(true);
    try {
      const data = await apiFetch(`/candidates/${selectedCandidate.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      if (data && data.success) {
        addToast('Candidate updated successfully', 'success');
        setShowEditModal(false);
        fetchCandidates();
      } else {
        addToast((data && data.message) || 'Failed to update candidate', 'error');
      }
    } catch (e) {
      addToast('Error updating candidate', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          ...interviewData
        })
      });
      if (data && data.success) {
        addToast('Interview scheduled successfully', 'success');
        setShowScheduleModal(false);
        fetchCandidates();
      } else {
        addToast((data && data.message) || 'Failed to schedule interview', 'error');
      }
    } catch (e) {
      addToast('Error scheduling interview', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch('/offers', {
        method: 'POST',
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          ...offerData
        })
      });
      if (data && data.success) {
        addToast('Offer letter issued successfully', 'success');
        setShowOfferModal(false);
        fetchCandidates();
      } else {
        addToast((data && data.message) || 'Failed to issue offer', 'error');
      }
    } catch (e) {
      addToast('Error issuing offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('candidates', 'CREATE')) return;
    setSubmitting(true);
    try {
      const payload = {
        candidate_name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        gender: formData.gender,
        dob: formData.dob,
        department: formData.department,
        department_id: departments.find(d => d.dept_name === formData.department || d.name === formData.department || d.department_name === formData.department)?.id || null,
        job_position: formData.job,
        experience: formData.experience,
        current_company: formData.currentCompany,
        current_salary: formData.currentSalary,
        expected_salary: formData.expectedSalary,
        notice_period: formData.noticePeriod,
        skills: formData.skills,
        address: formData.address,
        status: formData.status || 'Applied',
        resume_url: formData.resume || (resumeFile ? resumeFile.name : null)
      };

      const data = await apiFetch('/candidates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data && data.success) {
        addToast('Candidate added successfully', 'success');
        setShowAddModal(false);
        setFormData({
          name: '', email: '', mobile: '', gender: 'Male', dob: '', department: '', job: '',
          resume: '', experience: '', currentCompany: '', currentSalary: '', expectedSalary: '',
          noticePeriod: '', skills: '', address: '', status: 'Applied'
        });
        setResumeFile(null);
        fetchCandidates();
      } else {
        addToast((data && data.message) || 'Failed to add candidate', 'error');
      }
    } catch (e) {
      addToast('Error adding candidate', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const handleSave = handleCreateSubmit;

  const getStageColor = (stg) => {
    switch (stg) {
      case 'Applied': return { bg: '#EFF6FF', text: '#2563EB' };
      case 'Shortlisted': return { bg: '#F5F3FF', text: '#7C3AED' };
      case 'Interview Scheduled': return { bg: '#FEF3C7', text: '#D97706' };
      case 'Interview Completed': return { bg: '#E0F2FE', text: '#0284C7' };
      case 'Selected': return { bg: '#ECFDF5', text: '#059669' };
      case 'Hired': return { bg: '#D1FAE5', text: '#047857' };
      case 'Rejected': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'On Hold': return { bg: '#F1F5F9', text: '#475569' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderStars = (count = 5) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(count)].map((_, i) => (
          <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Candidates</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Manage and track candidates in the pipeline</p>
        </div>
        {canCreate('candidates') && (
          <button
            onClick={() => {
              if (!checkActionPermission('candidates', 'CREATE')) return;
              setShowAddModal(true);
            }}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#2952E3', 
              color: '#FFF', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: '500' 
            }}
          >
            <Plus size={16} /> Add Candidate
          </button>
        )}
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: 0, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search candidate name or email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
              />
            </div>
            <AppDropdown
                value={filterJob}
                onChange={v => setFilterJob(v)}
                options={[{value:'All Job Openings',label:'All Job Openings'},{value:'Senior React Developer',label:'Senior React Developer'},{value:'HR Executive',label:'HR Executive'},{value:'Backend Developer',label:'Backend Developer'},{value:'Full Stack Developer',label:'Full Stack Developer'}]}
                size="sm"
              />
            <AppDropdown
                value={filterStage}
                onChange={v => setFilterStage(v)}
                options={[{value:'All Stages',label:'All Stages'},{value:'Applied',label:'Applied'},{value:'Shortlisted',label:'Shortlisted'},{value:'Interview Scheduled',label:'Interview Scheduled'},{value:'Interview Completed',label:'Interview Completed'},{value:'Selected',label:'Selected'},{value:'Rejected',label:'Rejected'},{value:'On Hold',label:'On Hold'},{value:'Hired',label:'Hired'}]}
                size="sm"
              />
            <AppDropdown
                value={filterLocation}
                onChange={v => setFilterLocation(v)}
                options={[{value:'All Locations',label:'All Locations'},{value:'Bangalore',label:'Bangalore'},{value:'Mumbai',label:'Mumbai'},{value:'Coimbatore',label:'Coimbatore'}]}
                size="sm"
              />
          </div>
          {canExport('recruitment', 'candidates') && (
            <div>
              <button style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Download size={16} /> Export
              </button>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto', minHeight: '380px', paddingBottom: '40px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading candidates...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Candidate</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Job Title</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>ATS Score</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Stage</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Experience</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Applied On</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Rating</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!Array.isArray(candidatesData) || candidatesData.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No candidates found</td>
                  </tr>
                ) : (
                  candidatesData.map((row, index) => {
                    const initials = row.candidate_name ? row.candidate_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CD';
                    const appliedDate = row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';
                    const isMenuOpen = activeMenuId === row.id;
                    const atsVal = Math.round(Number(row.ats_score) || 0);
                    const atsColor = atsVal >= 80 ? '#10B981' : atsVal >= 60 ? '#2563EB' : '#F59E0B';

                    return (
                      <tr key={row.id} style={{ borderBottom: index === candidatesData.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#64748B' }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{row.candidate_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748B' }}>{row.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{row.job_position}</td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '48px', height: '6px', borderRadius: '3px', background: '#F1F5F9', overflow: 'hidden' }}>
                              <div style={{ width: `${atsVal}%`, height: '100%', background: atsColor, borderRadius: '3px' }}></div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: atsColor }}>
                              {atsVal}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            backgroundColor: getStageColor(row.status).bg, 
                            color: getStageColor(row.status).text 
                          }}>
                            {row.status === 'Shortlisted' ? '✓ Shortlisted' : row.status === 'Rejected' ? '✕ Rejected' : row.status}
                          </span>
                        </td>

                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{row.experience ? `${row.experience} Yrs` : '-'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>{appliedDate}</td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          {renderStars(5)}
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center', position: 'relative' }} className="candidate-action-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : row.id);
                            }}
                            style={{
                              background: isMenuOpen ? '#F1F5F9' : 'none',
                              border: 'none', borderRadius: '6px', padding: '6px',
                              cursor: 'pointer', color: '#64748B', transition: 'all 0.15s ease'
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Action Dropdown Menu - Smart Positioned */}
                          {isMenuOpen && (
                            <div style={{
                              position: 'absolute', right: '24px',
                              ...(index === 0 ? { top: '44px', bottom: 'auto' } : { bottom: '44px', top: 'auto' }),
                              zIndex: 1000,
                              background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0',
                              boxShadow: '0 12px 28px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.05)',
                              width: '230px', padding: '8px', textAlign: 'left', maxHeight: '340px', overflowY: 'auto'
                            }}>
                              <div style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                                Candidate Actions
                              </div>

                              {['Applied', 'Pending', 'Under Review', 'Screening Completed'].includes(row.status) && canEdit('candidates') && (
                                <button
                                  onClick={() => { setSelectedCandidate(row); setShowViewModal(true); setActiveMenuId(null); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#2563EB', fontWeight: '600', background: '#EFF6FF', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px' }}
                                >
                                  <CheckCircle2 size={15} color="#2563EB" /> Review & Evaluate Candidate
                                </button>
                              )}

                              <button
                                onClick={() => { setSelectedCandidate(row); setShowViewModal(true); setActiveMenuId(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#334155', fontWeight: '500', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                className="hover:bg-slate-50"
                              >
                                <Eye size={15} color="#2563EB" /> View Profile & Details
                              </button>

                              {canEdit('candidates') && (
                                <button
                                  onClick={() => { setSelectedCandidate(row); setEditFormData(row); setShowEditModal(true); setActiveMenuId(null); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#334155', fontWeight: '500', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                  className="hover:bg-slate-50"
                                >
                                  <Edit3 size={15} color="#8B5CF6" /> Edit Candidate Info
                                </button>
                              )}

                              {row.status !== 'Rejected' && (
                                <>
                                  {canCreate('interview_schedule') && (
                                    <button
                                      onClick={() => { setSelectedCandidate(row); setShowScheduleModal(true); setActiveMenuId(null); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#334155', fontWeight: '500', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                      className="hover:bg-slate-50"
                                    >
                                      <Calendar size={15} color="#D97706" /> Schedule Interview
                                    </button>
                                  )}

                                  {canCreate('offer_letters') && (
                                    <button
                                      onClick={() => { setSelectedCandidate(row); setShowOfferModal(true); setActiveMenuId(null); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#334155', fontWeight: '500', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                      className="hover:bg-slate-50"
                                    >
                                      <Send size={15} color="#059669" /> Issue Offer Letter
                                    </button>
                                  )}

                                  {canEdit('candidates') && (
                                    <button
                                      onClick={() => handleHireCandidate(row)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '13px', color: '#059669', fontWeight: '600', background: '#ECFDF5', border: 'none', borderRadius: '6px', cursor: 'pointer', margin: '4px 0' }}
                                    >
                                      <UserCheck size={15} color="#059669" /> Hire & Move to Onboarding
                                    </button>
                                  )}
                                </>
                              )}

                              {row.status !== 'Rejected' && canEdit('candidates') && (
                                <>
                                  <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                                  <div style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                                    Move Stage
                                  </div>

                                  {(['Applied', 'Pending', 'Under Review'].includes(row.status)
                                    ? ['Shortlisted', 'Rejected', 'Interview Scheduled', 'On Hold']
                                    : ['Interview Scheduled', 'Selected', 'Hired', 'On Hold']
                                  ).map(stg => (
                                    <button
                                      key={stg}
                                      onClick={() => handleUpdateStatus(row.id, stg)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                        padding: '6px 10px', fontSize: '12px', color: row.status === stg ? '#2563EB' : '#475569',
                                        fontWeight: row.status === stg ? '700' : '500',
                                        background: row.status === stg ? '#EFF6FF' : 'none', border: 'none', borderRadius: '6px', cursor: 'pointer'
                                      }}
                                      className="hover:bg-slate-50"
                                    >
                                      <CheckCircle2 size={13} color={row.status === stg ? '#2563EB' : '#94A3B8'} /> {stg}
                                    </button>
                                  ))}
                                </>
                              )}

                              {canDelete('candidates') && (
                                <>
                                  <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                                  <button
                                    onClick={() => handleDeleteCandidate(row.id, row.candidate_name)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                      padding: '8px 10px', fontSize: '13px', color: '#EF4444', fontWeight: '500',
                                      background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer'
                                    }}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 size={15} color="#EF4444" /> Delete Candidate
                                  </button>
                                </>
                              )}
                            </div>
                          )}
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

      {/* Candidate Details Modal */}
      {showViewModal && selectedCandidate && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowViewModal(false)} />
          <div className="modal-centered-content" style={{ width: '700px', maxWidth: '90vw' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                  {selectedCandidate.candidate_name ? selectedCandidate.candidate_name.substring(0, 2).toUpperCase() : 'CD'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0A1629]">{selectedCandidate.candidate_name}</h2>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: getStageColor(selectedCandidate.status).bg, color: getStageColor(selectedCandidate.status).text }}>
                    {selectedCandidate.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
              {/* ATS Score & Match Breakdown */}
              {(() => {
                const atsScore = Math.round(Number(selectedCandidate.ats_score) || 0);
                let b = selectedCandidate.ats_breakdown;
                if (typeof b === 'string') {
                  try { b = JSON.parse(b); } catch (e) { b = null; }
                }
                const breakdown = b || {
                  skillsMatch: Math.round(atsScore * 0.4),
                  skillsTotal: 40,
                  experienceMatch: Math.round(atsScore * 0.2),
                  experienceTotal: 20,
                  educationMatch: Math.round(atsScore * 0.1),
                  educationTotal: 10,
                  screeningMatch: Math.round(atsScore * 0.2),
                  screeningTotal: 20,
                  otherMatch: Math.round(atsScore * 0.1),
                  otherTotal: 10
                };

                return (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-slate-800">AUTOMATED ATS EVALUATION</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Overall Match:</span>
                        <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${atsScore >= 80 ? 'bg-emerald-100 text-emerald-700' : atsScore >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {atsScore}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Skills Match</span>
                          <span className="text-blue-600">{breakdown.skillsMatch}/{breakdown.skillsTotal || 40} pts</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${(breakdown.skillsMatch / (breakdown.skillsTotal || 40)) * 100}%` }} className="h-full bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Experience Match</span>
                          <span className="text-blue-600">{breakdown.experienceMatch}/{breakdown.experienceTotal || 20} pts</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${(breakdown.experienceMatch / (breakdown.experienceTotal || 20)) * 100}%` }} className="h-full bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Education Match</span>
                          <span className="text-blue-600">{breakdown.educationMatch}/{breakdown.educationTotal || 10} pts</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${(breakdown.educationMatch / (breakdown.educationTotal || 10)) * 100}%` }} className="h-full bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Screening Match</span>
                          <span className="text-blue-600">{breakdown.screeningMatch}/{breakdown.screeningTotal || 20} pts</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${(breakdown.screeningMatch / (breakdown.screeningTotal || 20)) * 100}%` }} className="h-full bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">JOB POSITION</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5"><Briefcase size={14} color="#2563EB" /> {selectedCandidate.job_position}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">EXPERIENCE</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5"><Clock size={14} color="#2563EB" /> {selectedCandidate.experience ? `${selectedCandidate.experience} Years` : 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">EMAIL ADDRESS</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5"><Mail size={14} color="#2563EB" /> {selectedCandidate.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">MOBILE NUMBER</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5"><Phone size={14} color="#2563EB" /> {selectedCandidate.mobile_number || '-'}</span>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">CURRENT COMPANY</span>
                  <span className="text-sm font-medium text-slate-800 mt-1 block">{selectedCandidate.current_company || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">NOTICE PERIOD</span>
                  <span className="text-sm font-medium text-slate-800 mt-1 block">{selectedCandidate.notice_period || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">CURRENT SALARY</span>
                  <span className="text-sm font-medium text-slate-800 mt-1 block">{selectedCandidate.current_salary || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">EXPECTED SALARY</span>
                  <span className="text-sm font-medium text-slate-800 mt-1 block">{selectedCandidate.expected_salary || '-'}</span>
                </div>
              </div>

              {selectedCandidate.skills && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block mb-1.5">SKILLS & COMPETENCIES</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.split(',').map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.resume && (
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">ATTACHED RESUME</span>
                    <span className="text-sm font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                      <FileText size={15} color="#2563EB" /> {selectedCandidate.original_resume_name || 'Resume Document'}
                    </span>
                  </div>
                  <a
                    href={selectedCandidate.resume?.startsWith('http') ? selectedCandidate.resume : `${import.meta.env.VITE_BACKEND_URL || (window.location.port === '3000' ? 'http://localhost:5000' : window.location.origin)}${selectedCandidate.resume?.startsWith('/') ? '' : '/'}${selectedCandidate.resume}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Download size={14} /> Download Resume
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => handleDeleteCandidate(selectedCandidate.id, selectedCandidate.candidate_name)}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Candidate
              </button>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Candidate Modal */}
      {showEditModal && selectedCandidate && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowEditModal(false)} />
          <div className="modal-centered-content" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Edit Candidate Profile</h2>
                <p className="text-sm text-slate-500 mt-1">Update information for {selectedCandidate.candidate_name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '75vh' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Name</label>
                  <input type="text" value={editFormData.candidate_name || ''} onChange={e => setEditFormData({ ...editFormData, candidate_name: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input type="text" value={editFormData.mobile_number || ''} onChange={e => setEditFormData({ ...editFormData, mobile_number: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position</label>
                  <input type="text" value={editFormData.job_position || ''} onChange={e => setEditFormData({ ...editFormData, job_position: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience</label>
                  <input type="text" value={editFormData.experience || ''} onChange={e => setEditFormData({ ...editFormData, experience: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period</label>
                  <input type="text" value={editFormData.notice_period || ''} onChange={e => setEditFormData({ ...editFormData, notice_period: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-7 h-11 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedCandidate && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowScheduleModal(false)} />
          <div className="modal-centered-content" style={{ width: '550px', maxWidth: '90vw' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0A1629]">Schedule Interview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Setup interview round for {selectedCandidate.candidate_name}</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Date *</label>
                <input type="date" required value={interviewData.interview_date} onChange={e => setInterviewData({ ...interviewData, interview_date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time *</label>
                  <input type="time" required value={interviewData.interview_time} onChange={e => setInterviewData({ ...interviewData, interview_time: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Type *</label>
                  <AppDropdown
                value={interviewData.round_type || 'Technical Round'}
                onChange={v => setInterviewData({ ...interviewData, round_type: v })}
                options={[{value:'Technical Round',label:'Technical Round'},{value:'HR Round',label:'HR Round'},{value:'Manager Round',label:'Manager Round'},{value:'Final Round',label:'Final Round'}]}
                size="sm"
              />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Mode *</label>
                  <AppDropdown
                value={interviewData.interview_mode || 'Online'}
                onChange={v => setInterviewData({ ...interviewData, interview_mode: v })}
                options={[{value:'Online',label:'Online'},{value:'Offline',label:'Offline'},{value:'Telephonic',label:'Telephonic'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Meeting Link</label>
                  <input type="text" placeholder="e.g. Google Meet / Room 302" value={interviewData.location || ''} onChange={e => setInterviewData({ ...interviewData, location: e.target.value, meeting_link: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-6 h-11 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Offer Letter Modal */}
      {showOfferModal && selectedCandidate && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowOfferModal(false)} />
          <div className="modal-centered-content" style={{ width: '550px', maxWidth: '90vw' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0A1629]">Issue Offer Letter</h2>
                <p className="text-xs text-slate-500 mt-0.5">Generate formal offer for {selectedCandidate.candidate_name}</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offered Designation</label>
                <input type="text" defaultValue={selectedCandidate.job_position} onChange={e => setOfferData({ ...offerData, designation: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offered Salary (CTC)</label>
                <input type="text" placeholder="e.g. ₹ 12,00,000 Per Annum" onChange={e => setOfferData({ ...offerData, offered_salary: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Joining Date</label>
                <input type="date" required onChange={e => setOfferData({ ...offerData, joining_date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowOfferModal(false)} className="px-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-6 h-11 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md">Issue Offer Letter</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Candidate Modal (1100px Standard) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Candidate</h2>
                <p className="text-sm text-slate-500 mt-1">Register a new job applicant profile into recruitment pipeline.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rahul Sharma" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. rahul.sharma@email.com" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                  <input type="tel" required value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="e.g. +91 98765 43210" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <AppDropdown
                value={formData.gender}
                onChange={v => setFormData({ ...formData, gender: v })}
                options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department Applied For <span className="text-red-500">*</span></label>
                  <AppDropdown
                value={formData.department}
                onChange={v => setFormData({ ...formData, department: v })}
                options={[{value:'',label:'Select Department'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Job Position <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.job} onChange={e => setFormData({ ...formData, job: e.target.value })} placeholder="e.g. Senior React Developer" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Resume Upload <span className="text-red-500">*</span></label>
                  <input 
                    type="file" 
                    required 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      setResumeFile(file);
                      setFormData({ ...formData, resume: file ? file.name : '' });
                    }} 
                    className="w-full h-12 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Experience</label>
                  <input type="text" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="e.g. 4 Years" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Company</label>
                  <input type="text" value={formData.currentCompany} onChange={e => setFormData({ ...formData, currentCompany: e.target.value })} placeholder="e.g. Acme Tech Solutions" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Salary</label>
                  <input type="text" value={formData.currentSalary} onChange={e => setFormData({ ...formData, currentSalary: e.target.value })} placeholder="e.g. ₹ 10 LPA" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Salary</label>
                  <input type="text" value={formData.expectedSalary} onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })} placeholder="e.g. ₹ 15 LPA" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notice Period</label>
                  <input type="text" value={formData.noticePeriod} onChange={e => setFormData({ ...formData, noticePeriod: e.target.value })} placeholder="e.g. 30 Days" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                value={formData.status}
                onChange={v => setFormData({ ...formData, status: v })}
                options={[{value:'Applied',label:'Applied'},{value:'Shortlisted',label:'Shortlisted'},{value:'Interview Scheduled',label:'Interview Scheduled'},{value:'Interview Completed',label:'Interview Completed'},{value:'Selected',label:'Selected'},{value:'Rejected',label:'Rejected'},{value:'On Hold',label:'On Hold'},{value:'Hired',label:'Hired'}]}
                size="sm"
              />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Skills</label>
                  <input type="text" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} placeholder="e.g. React.js, Node.js, JavaScript, CSS3" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Enter residential address..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
