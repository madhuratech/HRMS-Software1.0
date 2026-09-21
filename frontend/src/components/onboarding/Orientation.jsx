import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Calendar, CheckCircle, Users, Percent, Plus, Info, Shield, CheckSquare, Presentation, X, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function Orientation() {
  const { addToast } = useToast();
  const [sessionsList, setSessionsList] = useState([]);
  const [eligibleJoiners, setEligibleJoiners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');

  // KPI States
  const [kpiData, setKpiData] = useState({
    upcoming: 0,
    completed: 0,
    totalAttendees: 0,
    todaySessions: 0
  });

  const [formData, setFormData] = useState({
    new_joiner_id: '',
    title: '',
    orientation_date: '',
    start_time: '',
    end_time: '',
    trainer: '',
    venue: '',
    session_type: 'Offline',
    meeting_link: '',
    notes: ''
  });

  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    department: '',
    designation: '',
    description: '',
    checklistItems: '',
    status: 'Active'
  });

  const [taskForm, setTaskForm] = useState({
    taskName: '',
    employee: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium',
    description: '',
    status: 'Pending'
  });

  const fetchMeta = async () => {
    try {
      const data = await apiFetch('/orientations/eligible');
      if (data && data.success && data.data) {
        setEligibleJoiners(data.data);
      }
    } catch (err) {
      console.error('Failed to load orientation metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const resData = await apiFetch('/orientations/dashboard');
      if (resData && resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/orientations?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const resData = await apiFetch(url);
      if (resData && resData.success && resData.data) {
        setSessionsList(resData.data.orientations || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to load orientation schedule', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchSessions();
    fetchDashboardStats();
  }, [page, fetchSessions, fetchDashboardStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0' };
      case 'Scheduled': return { bg: '#EFF6FF', text: '#2952E3', border: '#BFDBFE' };
      default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.new_joiner_id || !formData.title || !formData.orientation_date || !formData.trainer || !formData.start_time || !formData.end_time) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        new_joiner_id: parseInt(formData.new_joiner_id),
        title: formData.title.trim(),
        orientation_date: formData.orientation_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        trainer: formData.trainer.trim(),
        venue: formData.venue.trim() || (formData.session_type === 'Online' ? 'Online' : 'Office Office'),
        session_type: formData.session_type,
        meeting_link: formData.meeting_link.trim(),
        notes: formData.notes.trim()
      };

      const resData = await apiFetch('/orientations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (resData && resData.success) {
        addToast('Orientation session scheduled successfully!', 'success');
        setShowScheduleModal(false);
        setFormData({ new_joiner_id: '', title: '', orientation_date: '', start_time: '', end_time: '', trainer: '', venue: '', session_type: 'Offline', meeting_link: '', notes: '' });
        fetchSessions();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to schedule orientation session', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (sessionId) => {
    try {
      const resData = await apiFetch(`/orientations/${sessionId}/complete`, {
        method: 'PUT'
      });
      if (resData && resData.success) {
        addToast('Orientation session marked as Completed!', 'success');
        fetchSessions();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to update orientation status', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    setShowTemplateModal(false);
    addToast('Template created successfully!', 'success');
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setShowTaskModal(false);
    addToast('Task created successfully!', 'success');
  };

  const selectedJoiner = eligibleJoiners.find(j => j.id === parseInt(formData.new_joiner_id));
  const totalPages = Math.ceil(total / limit) || 1;

  const kpis = [
    { title: 'Upcoming Sessions', value: kpiData.upcoming, icon: <Calendar size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
    { title: 'Completed Sessions', value: kpiData.completed, icon: <CheckCircle size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Total Attendees', value: kpiData.totalAttendees, icon: <Users size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
    { title: 'Today\'s Sessions', value: kpiData.todaySessions, icon: <Percent size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
  ];

  const topicsData = [
    { name: 'Company Overview', icon: <Presentation size={16} /> },
    { name: 'HR Policies', icon: <Info size={16} /> },
    { name: 'IT Systems Training', icon: <Calendar size={16} /> },
    { name: 'Code of Conduct', icon: <Shield size={16} /> },
    { name: 'Security Awareness', icon: <CheckCircle size={16} /> },
    { name: 'Role & Responsibilities', icon: <Users size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Orientation & Templates</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Schedule sessions, configure templates and onboarding tasks</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasPermission('onboarding', 'orientation', 'create') && (
            <>
              <button onClick={() => setShowTaskModal(true)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <CheckSquare size={16} /> Add Task
              </button>
              <button onClick={() => setShowTemplateModal(true)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Plus size={16} /> Add Template
              </button>
              <button onClick={() => setShowScheduleModal(true)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Calendar size={16} /> Schedule Orientation
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginBottom: '4px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '700' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Sessions Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Orientation Schedule</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search session or joiner..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '220px', padding: '8px 10px 8px 30px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading orientation sessions...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Session Title</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Joiner Name</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Date & Time</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Trainer</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Venue / Mode</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No orientation sessions scheduled</td>
                    </tr>
                  ) : (
                    sessionsList.map((row, index) => {
                      const dateStr = row.orientation_date ? new Date(row.orientation_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      return (
                        <tr key={row.id} style={{ borderBottom: index === sessionsList.length - 1 ? 'none' : '1px solid #F8FAFC', transition: 'background 0.2s', ':hover': { background: '#F8FAFC' } }}>
                          <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {row.title}
                          </td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                {row.joiner_name ? row.joiner_name.split(' ').map(n => n[0]).join('') : 'NJ'}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{row.joiner_name}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>{row.department_name || 'General'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                            <div>{dateStr}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{row.start_time} - {row.end_time}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.trainer}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                            <div>{row.venue}</div>
                            <span style={{ fontSize: '10px', color: '#64748B', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{row.session_type}</span>
                          </td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              backgroundColor: getStatusStyle(row.status).bg, 
                              color: getStatusStyle(row.status).text,
                              border: `1px solid ${getStatusStyle(row.status).border}`
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            {row.status === 'Scheduled' && (
                              <button 
                                onClick={() => handleComplete(row.id)}
                                style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Mark Complete
                              </button>
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

        {/* Right Side: Topics Widget */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Orientation Topics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topicsData.map((topic, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#64748B' }}>{topic.icon}</div>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{topic.name}</span>
                </div>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2952E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckSquare size={12} color="#FFF" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Schedule Orientation Modal */}
      {showScheduleModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowScheduleModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Schedule Orientation Session</h2>
                <p className="text-sm text-slate-500 mt-1">Book an onboarding session for a verified new joiner.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">New Joiner <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.new_joiner_id}
                    onChange={v => setFormData({ ...formData, new_joiner_id: v })}
                    options={[
                      { value: '', label: 'Select Onboarding Joiner' },
                      ...eligibleJoiners.map(j => ({
                        value: String(j.id),
                        label: `${j.full_name} (${j.department_name || 'General'})`
                      }))
                    ]}
                    size="sm"
                  />
                </div>

                {selectedJoiner && (
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <div><strong>Department:</strong> {selectedJoiner.department_name}</div>
                    <div><strong>Designation:</strong> {selectedJoiner.designation}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Session Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Welcome & IT Systems Setup" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Orientation Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.orientation_date} onChange={e => setFormData({ ...formData, orientation_date: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                  <input type="time" required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">End Time <span className="text-red-500">*</span></label>
                  <input type="time" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Trainer <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.trainer} onChange={e => setFormData({ ...formData, trainer: e.target.value })} placeholder="e.g. Sneha Kapoor" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Session Type <span className="text-red-500">*</span></label>
                  <AppDropdown
                    value={formData.session_type}
                    onChange={v => setFormData({ ...formData, session_type: v })}
                    options={[{value:'Offline',label:'Offline (Office Conference)'},{value:'Online',label:'Online (Zoom / Meet)'},{value:'Hybrid',label:'Hybrid'}]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Venue / Location</label>
                  <input type="text" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. Conference Room A" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Link (If Online)</label>
                  <input type="url" value={formData.meeting_link} onChange={e => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="e.g. https://zoom.us/j/123456" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes / Agenda</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Agenda description, pre-requisites..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Onboarding Template Modal (1100px Standard) */}
      {showTemplateModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowTemplateModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Onboarding Template</h2>
                <p className="text-sm text-slate-500 mt-1">Configure standard onboarding workflow template for departments.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={templateForm.templateName} onChange={e => setTemplateForm({ ...templateForm, templateName: e.target.value })} placeholder="e.g. Senior Developer Onboarding Template" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <input type="text" required value={templateForm.department} onChange={e => setTemplateForm({ ...templateForm, department: e.target.value })} placeholder="e.g. Engineering" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Designation <span className="text-red-500">*</span></label>
                  <input type="text" required value={templateForm.designation} onChange={e => setTemplateForm({ ...templateForm, designation: e.target.value })} placeholder="e.g. Software Engineer" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                    value={templateForm.status}
                    onChange={v => setTemplateForm({ ...templateForm, status: v })}
                    options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]}
                    size="sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea required value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Describe purpose and scope of this onboarding template..." style={{ height: '90px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md">Save Template</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Onboarding Task Modal (1100px Standard) */}
      {showTaskModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowTaskModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Onboarding Task</h2>
                <p className="text-sm text-slate-500 mt-1">Assign an onboarding task to a new joiner or HR coordinator.</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Task Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={taskForm.taskName} onChange={e => setTaskForm({ ...taskForm, taskName: e.target.value })} placeholder="e.g. Complete Security Assessment" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Employee <span className="text-red-500">*</span></label>
                  <input type="text" required value={taskForm.employee} onChange={e => setTaskForm({ ...taskForm, employee: e.target.value })} placeholder="e.g. Rahul Sharma" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned To <span className="text-red-500">*</span></label>
                  <input type="text" required value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} placeholder="e.g. Sneha Kapoor (HR)" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <AppDropdown
                    value={taskForm.priority}
                    onChange={v => setTaskForm({ ...taskForm, priority: v })}
                    options={[{value:'High',label:'High'},{value:'Medium',label:'Medium'},{value:'Low',label:'Low'}]}
                    size="sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md">Save Task</button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
