import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { ChevronLeft, ChevronRight, Video, Clock, Plus, MessageSquare, X } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { canCreate, canEdit, checkActionPermission } from '../../lib/permissions';

export default function InterviewSchedule() {
  const { addToast } = useToast();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [scheduleList, setScheduleList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    candidate_id: '',
    interviewer_id: '',
    interviewRound: 'Technical Round',
    interviewType: 'Online',
    interviewDate: '',
    interviewTime: '',
    meetingLink: '',
    remarks: '',
    status: 'Scheduled'
  });

  const [feedbackForm, setFeedbackForm] = useState({
    schedule_id: '',
    candidate: '',
    interviewRound: 'Technical Round',
    interviewer: '',
    rating: '5',
    strengths: '',
    weaknesses: '',
    recommendation: 'Hire',
    comments: '',
    status: 'Completed'
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

  const fetchDropdownData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
      
      // Fetch candidates
      const candRes = await fetch('/app/candidates/dropdown', { headers });
      const candData = await candRes.json();
      if (candData.success) {
        setCandidates(candData.data);
      }

      // Fetch employees
      const empRes = await fetch('/app/employees', { headers });
      const empData = await empRes.json();
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown options:', err);
    }
  };

  const groupByDate = (schedules) => {
    const groups = {};
    schedules.forEach(item => {
      const d = new Date(item.interview_date);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      // Format time: "10:00:00" -> "10:00 AM"
      const [hours, minutes] = item.interview_time.split(':');
      let displayTime = item.interview_time;
      if (hours && minutes) {
        const hh = parseInt(hours);
        const suffix = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        displayTime = `${h12.toString().padStart(2, '0')}:${minutes} ${suffix}`;
      }

      groups[dateStr].push({
        id: item.id,
        time: displayTime,
        rawTime: item.interview_time,
        rawDate: item.interview_date,
        name: item.candidate_name,
        candidate_id: item.candidate_id,
        job: item.candidate_job,
        round: item.interview_round,
        interviewer: item.interviewer_name,
        interviewer_id: item.interviewer_id,
        mode: item.interview_mode,
        meetingLink: item.meeting_link,
        location: item.location,
        status: item.status,
        remarks: item.remarks
      });
    });
    return Object.keys(groups).map(date => ({
      date,
      interviews: groups[date]
    }));
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/app/interviews', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const grouped = groupByDate(data.data.schedules || []);
        setScheduleList(grouped);
      } else {
        addToast(data.message || 'Failed to load interview schedules', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDropdownData();
    fetchSchedules();
  }, [fetchSchedules]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('interview_schedule', 'CREATE')) return;
    if (!scheduleForm.candidate_id || !scheduleForm.interviewer_id || !scheduleForm.interviewDate || !scheduleForm.interviewTime) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(scheduleForm.interviewDate);
    if (selectedDate < today) {
      addToast('Interview Date cannot be in the past.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        candidate_id: parseInt(scheduleForm.candidate_id),
        interviewer_id: parseInt(scheduleForm.interviewer_id),
        interview_round: scheduleForm.interviewRound,
        interview_mode: scheduleForm.interviewType,
        interview_date: scheduleForm.interviewDate,
        interview_time: scheduleForm.interviewTime,
        meeting_link: scheduleForm.interviewType === 'Online' ? scheduleForm.meetingLink : null,
        location: scheduleForm.interviewType !== 'Online' ? scheduleForm.meetingLink : null,
        status: scheduleForm.status,
        remarks: scheduleForm.remarks
      };

      const res = await fetch('/app/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addToast('Interview scheduled successfully!', 'success');
        setShowScheduleModal(false);
        setScheduleForm({
          candidate_id: '', interviewer_id: '', interviewRound: 'Technical Round',
          interviewType: 'Online', interviewDate: '', interviewTime: '',
          meetingLink: '', remarks: '', status: 'Scheduled'
        });
        fetchSchedules();
      } else {
        addToast(data.message || 'Failed to schedule interview', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('interview_schedule', 'EDIT')) return;
    if (!feedbackForm.schedule_id) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/app/interviews/${feedbackForm.schedule_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          status: 'Completed',
          remarks: `Rating: ${feedbackForm.rating}/5. Rec: ${feedbackForm.recommendation}. Strengths: ${feedbackForm.strengths}. Comments: ${feedbackForm.comments}`
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Feedback and status saved successfully!', 'success');
        setShowFeedbackModal(false);
        setFeedbackForm({
          schedule_id: '', candidate: '', interviewRound: 'Technical Round', interviewer: '', rating: '5',
          strengths: '', weaknesses: '', recommendation: 'Hire', comments: '', status: 'Completed'
        });
        fetchSchedules();
      } else {
        addToast(data.message || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Interview Schedule</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>View and manage interview schedules</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {canEdit('interview_schedule') && (
            <button
              onClick={() => {
                if (!checkActionPermission('interview_schedule', 'EDIT')) return;
                setFeedbackForm({
                  schedule_id: '', candidate: '', interviewRound: 'Technical Round', interviewer: '', rating: '5',
                  strengths: '', weaknesses: '', recommendation: 'Hire', comments: '', status: 'Completed'
                });
                setShowFeedbackModal(true);
              }}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              <MessageSquare size={16} /> Interview Feedback
            </button>
          )}
          {canCreate('interview_schedule') && (
            <button
              onClick={() => {
                if (!checkActionPermission('interview_schedule', 'CREATE')) return;
                setShowScheduleModal(true);
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
              <Plus size={16} /> Schedule Interview
            </button>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Active Schedules</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
            <button style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#2952E3', color: '#FFF', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Week</button>
            <button style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Month</button>
          </div>
        </div>

        {/* Schedule List */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748B' }}>Loading schedules...</div>
          ) : scheduleList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0' }}>No interview schedules found</div>
          ) : (
            scheduleList.map((day, dIdx) => (
              <div key={dIdx}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{day.date}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {day.interviews.map((intv) => (
                    <div key={intv.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#FAFAF9' }}>
                      <div style={{ width: '100px', fontSize: '13px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#64748B" /> {intv.time}
                      </div>
                      <div style={{ flex: 1.5, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{intv.name}</div>
                      <div style={{ flex: 2, fontSize: '13px', color: '#475569' }}>{intv.job}</div>
                      <div style={{ flex: 2, fontSize: '13px', color: '#475569' }}>{intv.round}</div>
                      <div style={{ flex: 1.5, fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#64748B' }}>
                          {intv.interviewer ? intv.interviewer.split(' ').map(n => n[0]).join('') : 'IP'}
                        </div>
                        {intv.interviewer}
                      </div>
                      <div style={{ width: '220px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {canEdit('interview_schedule') && (
                          <button 
                            onClick={() => { 
                              setFeedbackForm({ 
                                ...feedbackForm, 
                                schedule_id: intv.id,
                                candidate: intv.name, 
                                interviewer: intv.interviewer, 
                                interviewRound: intv.round 
                              }); 
                              setShowFeedbackModal(true); 
                            }} 
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            <MessageSquare size={14} /> Feedback
                          </button>
                        )}
                        {intv.meetingLink && (
                          <a 
                            href={intv.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', border: '1px solid #2952E3', background: '#EFF6FF', color: '#2952E3', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            <Video size={14} /> Join Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: '#2952E3', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View Full Schedule</button>
          </div>
        </div>

      </div>

      {/* Schedule Interview Modal (1100px Standard) */}
      {showScheduleModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowScheduleModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Schedule Interview</h2>
                <p className="text-sm text-slate-500 mt-1">Book an interview session for a candidate in recruitment process.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={scheduleForm.candidate_id}
                    onChange={v => setScheduleForm({ ...scheduleForm, candidate_id: v })}
                    options={[
                      { value: '', label: 'Select Candidate' },
                      ...candidates.map(c => ({
                        value: String(c.id),
                        label: `${c.full_name || c.name || `${c.first_name} ${c.last_name}`}${c.job_title || c.job_title_applied ? ` (${c.job_title || c.job_title_applied})` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interviewer <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={scheduleForm.interviewer_id}
                    onChange={v => setScheduleForm({ ...scheduleForm, interviewer_id: v })}
                    options={[
                      { value: '', label: 'Select Interviewer' },
                      ...employees.map(e => ({
                        value: String(e.id),
                        label: `${e.name}${e.employee_code || e.emp_id ? ` (${e.employee_code || e.emp_id})` : ` (EMP${String(e.id).padStart(4, '0')})`}${e.dept_name ? ` - ${e.dept_name}` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Type <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={scheduleForm.interviewType}
                    onChange={v => setScheduleForm({ ...scheduleForm, interviewType: v })}
                    options={[{value:'Online',label:'Online Video Call'},{value:'Offline',label:'In-person Office Visit'},{value:'Telephonic',label:'Phone Screening'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Round <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={scheduleForm.interviewRound}
                    onChange={v => setScheduleForm({ ...scheduleForm, interviewRound: v })}
                    options={[{value:'Technical Round',label:'Technical Round'},{value:'HR Round',label:'HR Round'},{value:'Manager Round',label:'Manager Round'},{value:'Final Round',label:'Final Round'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={scheduleForm.interviewDate} onChange={e => setScheduleForm({ ...scheduleForm, interviewDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Time <span className="text-red-500">*</span></label>
                  <input type="time" required value={scheduleForm.interviewTime} onChange={e => setScheduleForm({ ...scheduleForm, interviewTime: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Link / Location</label>
                  <input type="text" value={scheduleForm.meetingLink} onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })} placeholder="e.g. https://meet.google.com/xyz-abc or Conference Room A" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                    value={scheduleForm.status}
                    onChange={v => setScheduleForm({ ...scheduleForm, status: v })}
                    options={[{value:'Scheduled',label:'Scheduled'},{value:'Completed',label:'Completed'},{value:'Cancelled',label:'Cancelled'},{value:'Rescheduled',label:'Rescheduled'}]}
                    size="sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Remarks</label>
                  <textarea value={scheduleForm.remarks} onChange={e => setScheduleForm({ ...scheduleForm, remarks: e.target.value })} placeholder="Any preparation instructions or notes for the candidate..." style={{ height: '90px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Interview Feedback Modal (1100px Standard) */}
      {showFeedbackModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowFeedbackModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Interview Feedback</h2>
                <p className="text-sm text-slate-500 mt-1">Submit interview evaluation score and candidate feedback comments.</p>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate <span className="text-red-500">*</span></label>
                  {feedbackForm.schedule_id ? (
                    <input type="text" readOnly value={feedbackForm.candidate || ''} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none" />
                  ) : (
                    <AppDropdown
                      value={feedbackForm.schedule_id || ''}
                      onChange={v => {
                        const schedId = v;
                        const allInterviews = scheduleList.flatMap(d => d.interviews || []);
                        const selected = allInterviews.find(i => String(i.id) === String(schedId));
                        if (selected) {
                          setFeedbackForm({
                            ...feedbackForm,
                            schedule_id: selected.id,
                            candidate: selected.name,
                            interviewer: selected.interviewer || 'Super Admin',
                            interviewRound: selected.round || 'Technical Round'
                          });
                        }
                      }}
                      options={[{ value: '', label: 'Select Candidate Interview' }, ...scheduleList.flatMap(d => (d.interviews || []).map(i => ({ value: i.id, label: `${i.name} (${i.round || 'Interview'})` })))]}
                      size="sm"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Round <span className="text-red-500">*</span></label>
                  <input type="text" readOnly value={feedbackForm.interviewRound || 'Technical Round'} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interviewer <span className="text-red-500">*</span></label>
                  <input type="text" readOnly value={feedbackForm.interviewer || 'Super Admin'} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rating <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={feedbackForm.rating}
                    onChange={v => setFeedbackForm({ ...feedbackForm, rating: v })}
                    options={[{value:'5',label:'5 - Excellent (Strong Hire)'},{value:'4',label:'4 - Good (Hire)'},{value:'3',label:'3 - Average (Hold)'},{value:'2',label:'2 - Below Average'},{value:'1',label:'1 - Poor (Reject)'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Recommendation</label>
                  <AppDropdown
                    value={feedbackForm.recommendation}
                    onChange={v => setFeedbackForm({ ...feedbackForm, recommendation: v })}
                    options={[{value:'Strong Hire',label:'Strong Hire'},{value:'Hire',label:'Hire'},{value:'Hold',label:'Hold'},{value:'Reject',label:'Reject'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                    value={feedbackForm.status}
                    onChange={v => setFeedbackForm({ ...feedbackForm, status: v })}
                    options={[{value:'Completed',label:'Completed'},{value:'Draft',label:'Draft'}]}
                    size="sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Strengths</label>
                  <textarea value={feedbackForm.strengths} onChange={e => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })} placeholder="Candidate key strengths and positive observations..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Weaknesses</label>
                  <textarea value={feedbackForm.weaknesses} onChange={e => setFeedbackForm({ ...feedbackForm, weaknesses: e.target.value })} placeholder="Areas of concern or technical gaps..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Comments</label>
                  <textarea value={feedbackForm.comments} onChange={e => setFeedbackForm({ ...feedbackForm, comments: e.target.value })} placeholder="Final assessment comments for hiring team..." style={{ height: '90px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
