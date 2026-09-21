import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Download, Eye, CheckCircle2, XCircle, Calendar, FileText, UserCheck, Briefcase, Mail, Phone, MapPin, AlertCircle, X, ChevronLeft, ChevronRight, Star, Send, ShieldAlert, Award, Check } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useNavigate } from 'react-router-dom';
import { canEdit, checkActionPermission } from '../../lib/permissions';

export default function CandidateScreening() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search & Pagination
  const [search, setSearch] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Selected Candidate for Review Panel
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Live ATS Evaluation State
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [evaluationError, setEvaluationError] = useState(null);

  // Evaluation Form State
  const [recruiterNotes, setRecruiterNotes] = useState('');

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

  const getResumeUrl = (resumePath, applicationId) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || (window.location.port === '3000' ? 'http://localhost:5000' : window.location.origin);
    if (applicationId) {
      return `${backendUrl}/api/applications/${applicationId}/resume`;
    }
    if (!resumePath) return null;
    if (resumePath.startsWith('http://') || resumePath.startsWith('https://')) {
      return resumePath;
    }
    const cleanPath = resumePath.startsWith('/') ? resumePath : `/${resumePath}`;
    return `${backendUrl}${cleanPath}`;
  };

  const handleViewResume = (e, resumePath, candidateName, applicationId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const appId = applicationId || selectedCandidate?.application_id || selectedCandidate?.id;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || (window.location.port === '3000' ? 'http://localhost:5000' : window.location.origin);
    const url = appId ? `${backendUrl}/api/applications/${appId}/resume` : (resumePath ? getResumeUrl(resumePath) : null);

    console.log('[handleViewResume]', {
      applicationId: appId,
      candidateName,
      resumePath,
      selectedResumeUrl: url
    });

    if (!url) {
      addToast('Original resume not available', 'warning');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open & Fetch Live ATS Evaluation for exact application
  const handleOpenEvaluation = async (candidate) => {
    setSelectedCandidate(candidate);
    setRecruiterNotes(candidate.evaluation_notes || '');
    setShowReviewModal(true);
    setEvaluatingLoading(true);
    setEvaluationError(null);
    setEvaluationData(null);

    const appId = candidate.application_id || candidate.id;
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
      // 1. Try application-specific ATS evaluation endpoint first
      let res = await fetch(`/api/applications/${appId}/ats-evaluation`, { headers });
      let data = await res.json();
      if (!data || !data.success) {
        // Fallback to candidate evaluation endpoint
        res = await fetch(`/app/candidates/${candidate.id}/ats-evaluation`, { headers });
        data = await res.json();
      }
      if (data && data.success) {
        setEvaluationData(data);
      } else {
        setEvaluationError(data?.message || 'Unable to analyze this application.');
      }
    } catch (err) {
      setEvaluationError('Failed to connect to ATS evaluation engine.');
    } finally {
      setEvaluatingLoading(false);
    }
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
      const res = await fetch(`/app/candidates?limit=100`, { headers });
      const data = await res.json();
      if (data.success && data.data && data.data.candidates) {
        setCandidates(data.data.candidates);
        setTotal(data.data.candidates.length);
      } else {
        addToast(data.message || 'Failed to fetch candidate screening data', 'error');
      }
    } catch (err) {
      addToast('Error fetching screening candidates', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchMeta = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
      const res = await fetch('/app/requirements/meta/all', { headers });
      const data = await res.json();
      if (data) {
        setDepartments(data.departments || []);
      }
      const jobsRes = await fetch('/app/requirements?limit=100', { headers });
      const jobsData = await jobsRes.json();
      if (jobsData.success && jobsData.data && jobsData.data.requirements) {
        setJobs(jobsData.data.requirements);
      }
    } catch (e) {
      console.error('Error fetching meta for screening:', e);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchMeta();
  }, [fetchCandidates]);

  // Derived Candidate Statistics
  const pendingCount = candidates.filter(c => ['Applied', 'Pending', 'Under Review', 'Screening Completed'].includes(c.status)).length;
  const shortlistedCount = candidates.filter(c => c.status === 'Shortlisted').length;
  const rejectedCount = candidates.filter(c => c.status === 'Rejected').length;
  const interviewCount = candidates.filter(c => ['Interview Scheduled', 'Interview Completed', 'Selected'].includes(c.status)).length;

  // Filtered & Sorted Candidates Table
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = search === '' ||
      (c.candidate_name && c.candidate_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesJob = filterJob === '' || String(c.job_position || '').toLowerCase() === filterJob.toLowerCase();
    const matchesDept = filterDept === '' || String(c.department_id) === String(filterDept);
    const matchesStatus = filterStatus === '' || c.status === filterStatus;
    return matchesSearch && matchesJob && matchesDept && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
    if (sortBy === 'oldest') return new Date(a.created_at || Date.now()) - new Date(b.created_at || Date.now());
    return 0;
  });

  const paginatedCandidates = filteredCandidates.slice((page - 1) * limit, page * limit);

  // Status Helper: Determines if candidate decision is final
  const isFinalized = (status) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    return ['shortlisted', 'rejected', 'interview scheduled', 'interview completed', 'selected', 'hired', 'withdrawn'].includes(s);
  };

  // Status Helper: Determines if candidate is currently eligible for evaluation
  const isEligibleForEvaluation = (status) => {
    if (!status) return true;
    const s = String(status).trim().toLowerCase();
    return ['applied', 'pending', 'under review', 'screening completed', 'screening'].includes(s);
  };

  // Dedicated Evaluation Submission to Backend (Shortlist or Reject)
  const handleEvaluateCandidate = async (candidateId, action, notes = '') => {
    if (!checkActionPermission('screening', 'EDIT')) return;
    setSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      };
      const payload = {
        action: action.toUpperCase(),
        remarks: notes || recruiterNotes || `Candidate evaluated as ${action}`
      };

      const res = await fetch(`/app/candidates/${candidateId}/evaluate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        addToast(data.message || `Candidate evaluated as ${action}`, 'success');
        // Refresh candidates from database immediately to maintain single source of truth
        await fetchCandidates();
        setShowReviewModal(false);
        setShowRejectModal(false);
        setRejectionReason('');
        setRecruiterNotes('');
      } else {
        addToast(data.message || 'Failed to submit candidate evaluation', 'error');
      }
    } catch (err) {
      addToast('Failed to connect to server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShortlist = () => {
    if (!selectedCandidate) return;
    handleEvaluateCandidate(selectedCandidate.id, 'SHORTLIST', recruiterNotes);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    if (!rejectionReason.trim()) {
      addToast('Please provide a reason for rejection.', 'error');
      return;
    }
    handleEvaluateCandidate(selectedCandidate.id, 'REJECT', rejectionReason);
  };

  const handleMoveToInterview = async (candidateToMove) => {
    const candidate = candidateToMove || selectedCandidate;
    if (!candidate) return;
    if (candidate.status === 'Rejected') {
      addToast('Rejected candidates cannot be moved to the interview stage.', 'error');
      return;
    }
    if (candidate.status !== 'Shortlisted') {
      addToast('Candidate must be Shortlisted before moving to interview stage.', 'warning');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      };
      await fetch(`/app/candidates/${candidate.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'Interview Scheduled' })
      });
      addToast('Candidate moved to Interview stage', 'success');
      await fetchCandidates();
      setShowReviewModal(false);
      navigate('/recruitment/interviews');
    } catch (err) {
      addToast('Error moving candidate to interview', 'error');
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Shortlisted':
        return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
      case 'Rejected':
        return { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' };
      case 'Interview Scheduled':
      case 'Interview Completed':
      case 'Interview':
        return { background: '#F5F3FF', color: '#8B5CF6', border: '1px solid #DDD6FE' };
      case 'Under Review':
        return { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
      case 'Screening Completed':
        return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
      default: // Applied / Pending
        return { background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #F1F5F9',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  };

  // Safe Breakdown Helper
  const getBreakdown = (candidate) => {
    if (!candidate) return null;
    let b = candidate.ats_breakdown;
    if (typeof b === 'string') {
      try { b = JSON.parse(b); } catch (e) { b = null; }
    }
    const score = Number(candidate.ats_score) || 0;
    return b || {
      skillsMatch: Math.round(score * 0.4),
      skillsTotal: 40,
      experienceMatch: Math.round(score * 0.2),
      experienceTotal: 20,
      educationMatch: Math.round(score * 0.1),
      educationTotal: 10,
      screeningMatch: Math.round(score * 0.2),
      screeningTotal: 20,
      otherMatch: Math.round(score * 0.1),
      otherTotal: 10,
      totalAtsScore: score
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', background: '#F8FAFC', paddingBottom: '32px' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Candidate Screening</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Review automated ATS scores, screening answers, and evaluate candidates before interviews.</p>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} color="#D97706" />
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Pending Screening</div>
          </div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700' }}>{pendingCount}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#2952E3" />
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Shortlisted</div>
          </div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700' }}>{shortlistedCount}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={20} color="#EF4444" />
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Rejected</div>
          </div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700' }}>{rejectedCount}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} color="#8B5CF6" />
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Moved to Interview</div>
          </div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700' }}>{interviewCount}</div>
        </div>
      </div>

      {/* Main Candidate Table Container */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>

        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
              />
            </div>

            <AppDropdown
                value={filterJob}
                onChange={v => setFilterJob(v)}
                options={[{value:'',label:'All Job Openings'}]}
                size="sm"
              />

            <AppDropdown
                value={filterDept}
                onChange={v => setFilterDept(v)}
                options={[{value:'',label:'All Departments'}]}
                size="sm"
              />

            <AppDropdown
                value={filterStatus}
                onChange={v => setFilterStatus(v)}
                options={[{value:'',label:'All Statuses'},{value:'Applied',label:'Applied'},{value:'Screening Completed',label:'Screening Completed'},{value:'Under Review',label:'Under Review'},{value:'Shortlisted',label:'Shortlisted'},{value:'Rejected',label:'Rejected'},{value:'Interview Scheduled',label:'Interview Scheduled'}]}
                size="sm"
              />
          </div>

          <div>
            <AppDropdown
                value={sortBy}
                onChange={v => setSortBy(v)}
                options={[{value:'newest',label:'Sort by: Application Date (Newest)'},{value:'oldest',label:'Sort by: Application Date (Oldest)'}]}
                size="sm"
              />
          </div>
        </div>

        {/* Screening Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading screening candidates...</div>
          ) : paginatedCandidates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No candidates found matching the screening criteria.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Candidate Name</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Applied Job</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Experience</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>ATS Score</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Resume</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Applied Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Screening Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.map((c, index) => {
                  const statusStyle = getStatusBadgeStyle(c.status);
                  const appliedDate = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent';
                  const atsVal = Math.round(Number(c.ats_score) || 0);
                  const atsColor = atsVal >= 80 ? '#10B981' : atsVal >= 60 ? '#2563EB' : '#F59E0B';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setRecruiterNotes(c.evaluation_notes || '');
                        setShowReviewModal(true);
                      }}
                      style={{ borderBottom: index === paginatedCandidates.length - 1 ? 'none' : '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.15s' }}
                      className="hover:bg-slate-50/80"
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', color: '#2952E3', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.candidate_name ? c.candidate_name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{c.candidate_name}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                        {c.job_position || 'General Applicant'}
                      </td>

                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                        {c.experience || '0-1 Years'}
                      </td>

                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: '#F1F5F9', overflow: 'hidden' }}>
                            <div style={{ width: `${atsVal}%`, height: '100%', background: atsColor, borderRadius: '3px' }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: atsColor }}>{atsVal}%</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        {c.resume ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={(e) => handleViewResume(e, c.resume, c.candidate_name, c.application_id || c.id)}
                              style={{ fontSize: '12px', color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600', cursor: 'pointer', padding: '4px 10px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #DBEAFE', transition: 'all 0.15s', width: 'fit-content' }}
                            >
                              <FileText size={13} /> View Resume
                            </button>
                            {c.original_resume_name && (
                              <span style={{ fontSize: '10px', color: '#94A3B8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.original_resume_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No resume uploaded.</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B' }}>
                        {appliedDate}
                      </td>

                      <td style={{ padding: '16px 24px' }}>
                        {c.status === 'Shortlisted' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', color: '#059669', border: '1px solid #A7F3D0' }}>
                            <CheckCircle2 size={12} /> Shortlisted
                          </span>
                        ) : c.status === 'Rejected' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', color: '#DC2626', border: '1px solid #FECACA' }}>
                            <XCircle size={12} /> Rejected
                          </span>
                        ) : (
                          <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...statusStyle }}>
                            {c.status || 'Applied'}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        {isEligibleForEvaluation(c.status) ? (
                          <button
                            onClick={() => handleOpenEvaluation(c)}
                            style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)', transition: 'all 0.15s' }}
                          >
                            <Award size={13} /> Evaluate
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEvaluation(c)}
                              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}
                            >
                              <Eye size={12} /> View
                            </button>
                            {c.status === 'Shortlisted' && (
                              <button
                                onClick={() => handleMoveToInterview(c)}
                                style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)', transition: 'all 0.15s' }}
                              >
                                <Calendar size={12} /> Interview
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Showing {filteredCandidates.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, filteredCandidates.length)} of {filteredCandidates.length} entries
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} color="#64748B" />
            </button>
            <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2952E3', border: 'none', borderRadius: '6px', color: '#FFF', fontSize: '13px', fontWeight: '600' }}>
              {page}
            </button>
            <button
              disabled={page * limit >= filteredCandidates.length}
              onClick={() => setPage(page + 1)}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page * limit >= filteredCandidates.length ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} color="#64748B" />
            </button>
          </div>
        </div>

      </div>

      {/* Detailed Candidate Screening Panel / Modal */}
      {showReviewModal && selectedCandidate && (() => {
        const cand = evaluationData?.candidate || selectedCandidate;
        const app = evaluationData?.application || selectedCandidate;
        const job = evaluationData?.job || {};
        const atsData = evaluationData?.atsScore || {};
        const breakdown = atsData.breakdown || getBreakdown(selectedCandidate);
        const atsVal = Math.round(Number(atsData.total != null ? atsData.total : selectedCandidate.ats_score) || 0);
        const matchLevel = atsData.matchLevel || (atsVal >= 80 ? 'Excellent Match' : atsVal >= 60 ? 'Good Match' : atsVal >= 40 ? 'Fair Match' : 'Low Match');
        const isDecisionFinal = isFinalized(selectedCandidate.status);
        const gaugeColor = atsVal >= 80 ? '#10B981' : atsVal >= 60 ? '#3B82F6' : atsVal >= 40 ? '#F59E0B' : '#EF4444';
        const gaugeTrail = atsVal >= 80 ? '#D1FAE5' : atsVal >= 60 ? '#DBEAFE' : atsVal >= 40 ? '#FEF3C7' : '#FEE2E2';
        const circumference = 2 * Math.PI * 54;
        const dashOffset = circumference - (atsVal / 100) * circumference;

        const skillsMatchScore = breakdown.skills?.score != null ? breakdown.skills.score : (breakdown.skillsMatch || 0);
        const expMatchScore = breakdown.experience?.score != null ? breakdown.experience.score : (breakdown.experienceMatch || 0);
        const eduMatchScore = breakdown.education?.score != null ? breakdown.education.score : (breakdown.educationMatch || 0);
        const screenMatchScore = breakdown.screening?.score != null ? breakdown.screening.score : (breakdown.screeningMatch || 0);
        const otherMatchScore = breakdown.otherCriteria?.score != null ? breakdown.otherCriteria.score : (breakdown.otherMatch || 0);

        const matchedSkills = breakdown.skills?.matchedSkills || [];
        const missingSkills = breakdown.skills?.missingSkills || [];

        // Candidate extracted skills array
        let candidateSkillsList = [];
        if (Array.isArray(cand.skills)) {
          candidateSkillsList = cand.skills;
        } else if (typeof cand.skills === 'string' && cand.skills.trim()) {
          candidateSkillsList = cand.skills.split(',').map(s => s.trim()).filter(Boolean);
        }

        const breakdownItems = [
          {
            label: 'Skills Match',
            score: skillsMatchScore,
            total: 40,
            color: '#3B82F6',
            bg: '#EFF6FF',
            icon: '🎯',
            detail: matchedSkills.length > 0 ? `${matchedSkills.length} matched` : null
          },
          {
            label: 'Experience',
            score: expMatchScore,
            total: 20,
            color: '#8B5CF6',
            bg: '#F5F3FF',
            icon: '💼',
            detail: breakdown.experience?.candidateExperience ? `Cand: ${breakdown.experience.candidateExperience}` : null
          },
          {
            label: 'Education',
            score: eduMatchScore,
            total: 10,
            color: '#06B6D4',
            bg: '#ECFEFF',
            icon: '🎓',
            detail: breakdown.education?.candidateEducation ? `${breakdown.education.candidateEducation}` : null
          },
          {
            label: 'Screening',
            score: screenMatchScore,
            total: 20,
            color: '#F59E0B',
            bg: '#FFFBEB',
            icon: '📋',
            detail: breakdown.screening?.status || (screenMatchScore > 0 ? 'Calculated' : 'Not Configured')
          },
          {
            label: 'Other Criteria',
            score: otherMatchScore,
            total: 10,
            color: '#10B981',
            bg: '#ECFDF5',
            icon: '⚡',
            detail: breakdown.otherCriteria?.noticePeriod ? `Notice: ${breakdown.otherCriteria.noticePeriod}` : null
          },
        ];

        return (
          <>
            <div className="modal-backdrop-blur" onClick={() => setShowReviewModal(false)} />
            <div className="modal-centered-content" style={{ width: '960px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '20px', overflow: 'hidden', border: 'none', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>

              {/* Modal Header */}
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'linear-gradient(135deg, #FAFBFF 0%, #F8FAFC 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isDecisionFinal ? (selectedCandidate.status === 'Shortlisted' ? '#EFF6FF' : '#FEF2F2') : 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDecisionFinal
                      ? (selectedCandidate.status === 'Shortlisted' ? <CheckCircle2 size={20} color="#2563EB" /> : <XCircle size={20} color="#EF4444" />)
                      : <Award size={20} color="#FFFFFF" />
                    }
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.2px' }}>
                      {isDecisionFinal ? 'Evaluation Summary' : 'Candidate Screening Evaluation'}
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                      {isDecisionFinal
                        ? 'Finalized evaluation results and ATS scoring breakdown'
                        : 'Review live ATS score breakdown, matched resume skills, and record screening decision'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseOut={e => e.currentTarget.style.background = '#FFF'}
                >
                  <X size={16} color="#94A3B8" />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Loading State */}
                {evaluatingLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                    <div className="animate-spin" style={{ width: '42px', height: '42px', borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#2563EB' }} />
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>Analyzing candidate profile...</div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>Extracting resume skills and evaluating ATS compatibility against job requirements</div>
                  </div>
                ) : evaluationError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', gap: '14px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={24} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>Unable to analyze this candidate. Please try again.</div>
                    <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '400px' }}>{evaluationError}</div>
                    <button
                      onClick={() => handleOpenEvaluation(selectedCandidate)}
                      style={{ padding: '8px 20px', background: '#2563EB', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)' }}
                    >
                      Retry Analysis
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Finalized Decision Banner */}
                    {isDecisionFinal && (
                      <div style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: `1px solid ${selectedCandidate.status === 'Shortlisted' ? '#BFDBFE' : '#FECACA'}`,
                        background: selectedCandidate.status === 'Shortlisted' ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                        display: 'flex', alignItems: 'flex-start', gap: '12px'
                      }}>
                        {selectedCandidate.status === 'Shortlisted' ? <CheckCircle2 size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '1px' }} /> : <XCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: selectedCandidate.status === 'Shortlisted' ? '#1E40AF' : '#991B1B' }}>
                            {selectedCandidate.status === 'Shortlisted' ? 'Candidate Shortlisted' : 'Candidate Rejected'}
                          </div>
                          <div style={{ fontSize: '11px', color: selectedCandidate.status === 'Shortlisted' ? '#3B82F6' : '#EF4444', marginTop: '2px' }}>
                            Final evaluation recorded — this candidate status is {selectedCandidate.status}.
                          </div>
                          {selectedCandidate.evaluation_notes && (
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>Remarks: "{selectedCandidate.evaluation_notes}"</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Two Column Layout: Profile + ATS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                      {/* LEFT COLUMN: Candidate Profile Card */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Profile Header */}
                        <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#FFF', fontWeight: '700', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                              {cand.name || cand.candidate_name ? (cand.name || cand.candidate_name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CD'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.2px' }}>{cand.name || cand.candidate_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>{selectedCandidate.job_position}</div>
                            </div>
                            <span style={{ ...getStatusBadgeStyle(selectedCandidate.status), padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                              {selectedCandidate.status === 'Shortlisted' ? '✓ Shortlisted' : selectedCandidate.status === 'Rejected' ? '✕ Rejected' : (selectedCandidate.status || 'Applied')}
                            </span>
                          </div>

                          {/* Contact Info Pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9', fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                              <Mail size={12} color="#3B82F6" /> {cand.email || selectedCandidate.email}
                            </div>
                            {(cand.phone || cand.mobile_number || selectedCandidate.mobile_number) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9', fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                                <Phone size={12} color="#3B82F6" /> {cand.phone || cand.mobile_number || selectedCandidate.mobile_number}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Overview Grid */}
                        <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Candidate Details</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                              { label: 'Experience', value: cand.experience || selectedCandidate.experience || '0-1 Years' },
                              { label: 'Education', value: cand.education || 'Graduate' },
                              { label: 'Notice Period', value: cand.noticePeriod || selectedCandidate.notice_period || 'Immediate' },
                              { label: 'Current Company', value: cand.currentCompany || selectedCandidate.current_company || 'N/A' },
                              { label: 'Current Salary', value: (cand.currentSalary || selectedCandidate.current_salary) ? `₹${Number(cand.currentSalary || selectedCandidate.current_salary).toLocaleString()}` : 'N/A' },
                              { label: 'Expected Salary', value: (cand.expectedSalary || selectedCandidate.expected_salary) ? `₹${Number(cand.expectedSalary || selectedCandidate.expected_salary).toLocaleString()}` : 'N/A' },
                            ].map((item, i) => (
                              <div key={i} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '12px', color: '#1E293B', fontWeight: '600', marginTop: '2px' }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills & Resume Section */}
                        <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Skills & Resume</div>

                          {/* All Candidate Extracted Skills */}
                          {candidateSkillsList.length > 0 ? (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '6px' }}>Extracted Skills ({candidateSkillsList.length}):</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {candidateSkillsList.map((skill, i) => (
                                  <span key={i} style={{ padding: '4px 10px', background: '#EFF6FF', color: '#2563EB', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid #DBEAFE' }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '12px' }}>
                              No skills could be extracted from the candidate profile or resume.
                            </div>
                          )}

                          {/* Matched vs Missing Skills Breakdown */}
                          {matchedSkills.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                <Check size={12} /> Matched Skills ({matchedSkills.length}):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {matchedSkills.map((skill, i) => (
                                  <span key={i} style={{ padding: '3px 8px', background: '#ECFDF5', color: '#059669', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid #A7F3D0' }}>
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {missingSkills.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                <X size={12} /> Missing Skills ({missingSkills.length}):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {missingSkills.map((skill, i) => (
                                  <span key={i} style={{ padding: '3px 8px', background: '#FEF2F2', color: '#DC2626', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid #FECACA' }}>
                                    ✕ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resume File Link */}
                          {(app.resumeUrl || cand.resume || selectedCandidate.resume) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={(e) => handleViewResume(e, app.resumeUrl || cand.resume || selectedCandidate.resume, cand.name || cand.candidate_name, app.id || app.applicationId || selectedCandidate.application_id || selectedCandidate.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', color: '#2563EB', borderRadius: '10px', fontSize: '12px', fontWeight: '600', border: '1px solid #BFDBFE', cursor: 'pointer', transition: 'all 0.15s', width: 'fit-content' }}
                              >
                                <FileText size={14} /> View Resume
                              </button>
                              {(app.originalResumeName || cand.originalResumeName || selectedCandidate.original_resume_name) && (
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', marginLeft: '2px' }}>
                                  File: <span style={{ color: '#334155', fontWeight: '600' }}>{app.originalResumeName || cand.originalResumeName || selectedCandidate.original_resume_name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>No resume uploaded.</div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: ATS Score & Breakdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* ATS Gauge Card */}
                        <div style={{ padding: '24px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>ATS Match Score</div>
                          {/* SVG Radial Gauge */}
                          <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="70" cy="70" r="54" fill="none" stroke={gaugeTrail} strokeWidth="10" />
                              <circle
                                cx="70" cy="70" r="54" fill="none"
                                stroke={gaugeColor} strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                              />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ fontSize: '32px', fontWeight: '800', color: gaugeColor, lineHeight: 1, letterSpacing: '-1px' }}>{atsVal}</div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginTop: '2px' }}>out of 100</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '600', color: gaugeColor, padding: '4px 14px', background: gaugeTrail, borderRadius: '20px', display: 'inline-block' }}>
                            {matchLevel}
                          </div>
                        </div>

                        {/* Breakdown Bars */}
                        <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Score Breakdown</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {breakdownItems.map((item, i) => {
                              const pct = Math.round((item.score / item.total) * 100);
                              return (
                                <div key={i}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '13px' }}>{item.icon}</span>
                                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>{item.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {item.detail && (
                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '500' }}>({item.detail})</span>
                                      )}
                                      <span style={{ fontSize: '11px', fontWeight: '700', color: item.color }}>{item.score}/{item.total}</span>
                                    </div>
                                  </div>
                                  <div style={{ width: '100%', height: '7px', borderRadius: '4px', background: '#F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`, transition: 'width 0.6s ease' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Multi-job applications */}
                        {selectedCandidate.applications && selectedCandidate.applications.length > 1 && (
                          <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Other Applications</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {selectedCandidate.applications.map(appItem => (
                                <div key={appItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                                  <span style={{ fontWeight: '600', color: '#334155' }}>{appItem.requirement_title || appItem.job_position}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#64748B' }}>ATS: <strong>{Math.round(appItem.ats_score || 0)}%</strong></span>
                                    <span style={{ ...getStatusBadgeStyle(appItem.status), padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{appItem.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recruiter Evaluation Notes */}
                    {!isDecisionFinal ? (
                      <div style={{ padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FAFBFF' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Recruiter Notes / Evaluation Feedback</label>
                        <textarea
                          rows={3}
                          value={recruiterNotes}
                          onChange={e => setRecruiterNotes(e.target.value)}
                          placeholder="Enter screening assessment notes, technical review feedback, and recommendations..."
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '12px', outline: 'none', background: '#FFFFFF', resize: 'vertical', fontFamily: 'inherit', color: '#334155', lineHeight: '1.6' }}
                        />
                      </div>
                    ) : (
                      selectedCandidate.evaluation_notes && (
                        <div style={{ padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FAFBFF' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Recorded Recruiter Notes</div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontStyle: 'italic', lineHeight: '1.6' }}>{selectedCandidate.evaluation_notes}</p>
                        </div>
                      )
                    )}
                  </>
                )}

              </div>

              {/* Decision Buttons Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderRadius: '0 0 20px 20px' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                >
                  Close
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {canEdit('screening') && (
                    !isDecisionFinal ? (
                      <>
                        <button
                          type="button"
                          disabled={submitting || evaluatingLoading}
                          onClick={() => {
                            if (!checkActionPermission('screening', 'EDIT')) return;
                            setShowRejectModal(true);
                          }}
                          style={{
                            padding: '9px 22px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                            color: '#FFF',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <XCircle size={14} /> Reject Candidate
                        </button>

                        <button
                          type="button"
                          disabled={submitting || evaluatingLoading}
                          onClick={() => {
                            if (!checkActionPermission('screening', 'EDIT')) return;
                            handleShortlist();
                          }}
                          style={{
                            padding: '9px 22px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                            color: '#FFF',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <CheckCircle2 size={14} /> {submitting ? 'Processing...' : 'Shortlist Candidate'}
                        </button>
                      </>
                    ) : (
                      selectedCandidate.status === 'Shortlisted' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!checkActionPermission('screening', 'EDIT')) return;
                            handleMoveToInterview(selectedCandidate);
                          }}
                          style={{
                            padding: '9px 22px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', transition: 'all 0.15s'
                          }}
                        >
                          <UserCheck size={14} /> Move to Interview
                        </button>
                      )
                    )
                  )}
                </div>
              </div>

            </div>
          </>
        );
      })()}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedCandidate && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowRejectModal(false)} />
          <div className="modal-centered-content" style={{ width: '460px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={18} color="#FFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991B1B' }}>Reject Candidate</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#EF4444', fontWeight: '500' }}>{selectedCandidate.candidate_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} color="#EF4444" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px 0', lineHeight: '1.6' }}>
                Please provide a reason for rejecting <strong style={{ color: '#1E293B' }}>{selectedCandidate.candidate_name}</strong>. This will be recorded as part of the evaluation history.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Rejection Reason <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Insufficient technical experience in required technologies..."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '12px', outline: 'none', background: '#FFF', resize: 'vertical', fontFamily: 'inherit', color: '#334155', lineHeight: '1.6' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFF', color: '#64748B', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFF',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)', transition: 'all 0.15s'
                  }}
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
