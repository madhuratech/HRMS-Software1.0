import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, Edit2, Link2, ChevronLeft, ChevronRight, X, Trash2, CheckCircle2, Target, Flag, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useToast } from '../ui/Toast';
import { apiFetch, formatDate } from '../../lib/api';
import { requireActionPermission, hasPermission } from '../../lib/permissions';

const STATUS_S = { 'Completed':{ bg:'#DCFCE7', color:'#15803D' }, 'In Progress':{ bg:'#DBEAFE', color:'#1D4ED8' }, 'Delayed':{ bg:'#FEE2E2', color:'#DC2626' }, 'Upcoming':{ bg:'#F3F4F6', color:'#6B7280' } };
const KpiCard = ({ label, value, iconBg, iconColor, icon }) => (
  <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', padding:'16px 20px', flex:'1 1 0', minWidth:110 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><span style={{ width:30, height:30, borderRadius:8, background:iconBg, color:iconColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{icon}</span><span style={{ fontSize:12, fontWeight:500, color:'#6B7280', whiteSpace: 'nowrap' }}>{label}</span></div>
    <div style={{ fontSize:26, fontWeight:700, color:'#111827' }}>{value}</div>
  </div>
);

export default function Milestones() {
  const { addToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({ totalMilestones:0, completed:0, inProgress:0, delayed:0, upcoming:0, pieData:[], upcomingList:[] });
  const [milestonesList, setMilestonesList] = useState([]);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    milestone_name: '',
    project_id: '',
    due_date: '',
    description: '',
    status: 'Upcoming',
    progress_pct: 0
  });

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    if (projectFilter) q.set('project_id', projectFilter);
    if (statusFilter) q.set('status', statusFilter);
    q.set('page', String(page));
    q.set('limit', String(limit));
    return q.toString();
  }, [projectFilter, statusFilter, page]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await apiFetch('/projects/meta');
      if (res.success && res.data) setProjects(res.data.projects || []);
    } catch (err) { console.error('Failed to load milestone meta:', err); }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoaded(false);
    try {
      const res = await apiFetch(`/milestones?${buildQuery()}`);
      if (res.success && res.data) {
        setMilestonesList(res.data.milestones || []);
        setTotal(res.data.total || 0);
        setTimeout(() => setLoaded(true), 150);
      } else {
        addToast(res.message || 'Failed to fetch milestones', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/milestones/dashboard');
      if (res.success && res.data) setStats(res.data);
    } catch (err) { console.error('Failed to fetch milestone stats:', err); }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [projectFilter, statusFilter]);

  const openAdd = () => {
    if (!requireActionPermission('projects', 'milestones', 'create', null, addToast, 'You do not have permission to add milestones. Please contact your administrator.')) {
      return;
    }
    setEditingId(null);
    setFormData({ milestone_name:'', project_id:'', due_date:'', description:'', status:'Upcoming', progress_pct:0 });
    setShowAddModal(true);
  };

  const openEdit = (m) => {
    if (!requireActionPermission('projects', 'milestones', 'edit', null, addToast, 'You do not have permission to edit milestones. Please contact your administrator.')) {
      return;
    }
    setEditingId(m.id);
    setFormData({
      milestone_name: m.milestone_name,
      project_id: String(m.project_id || ''),
      due_date: m.due_date ? m.due_date.slice(0,10) : '',
      description: m.description || '',
      status: m.status || 'Upcoming',
      progress_pct: m.progress_pct || 0
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const actNeeded = editingId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'milestones', actNeeded, null, addToast, `You do not have permission to ${actNeeded} milestones. Please contact your administrator.`)) {
      return;
    }
    if (!formData.milestone_name || !formData.project_id || !formData.due_date) {
      addToast('Milestone Name, Project and Due Date are required', 'error');
      return;
    }
    setSubmitting(true);
    const payload = {
      milestone_name: formData.milestone_name.trim(),
      project_id: parseInt(formData.project_id),
      due_date: formData.due_date,
      description: formData.description,
      status: formData.status,
      progress_pct: formData.status === 'Completed' ? 100 : (parseInt(formData.progress_pct) || 0)
    };
    try {
      const res = await apiFetch(editingId ? `/milestones/${editingId}` : '/milestones', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast(editingId ? 'Milestone updated successfully!' : 'Milestone created successfully!', 'success');
        setShowAddModal(false);
        fetchList();
        fetchStats();
      } else {
        const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save milestone');
        addToast(msg, 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (m) => {
    if (!requireActionPermission('projects', 'milestones', 'edit', null, addToast, 'You do not have permission to edit milestones. Please contact your administrator.')) {
      return;
    }
    try {
      const res = await apiFetch(`/milestones/${m.id}/complete`, { method: 'PUT' });
      if (res.success) {
        addToast('Milestone marked as completed!', 'success');
        fetchList();
        fetchStats();
      } else {
        addToast(res.message || 'Failed to complete milestone', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleDelete = async (m) => {
    if (!requireActionPermission('projects', 'milestones', 'delete', null, addToast, 'You do not have permission to delete milestones. Please contact your administrator.')) {
      return;
    }
    if (!window.confirm(`Delete milestone "${m.milestone_name}"?`)) return;
    try {
      const res = await apiFetch(`/milestones/${m.id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Milestone deleted successfully!', 'success');
        fetchList();
        fetchStats();
      } else {
        addToast(res.message || 'Failed to delete milestone', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", width:'100%', boxSizing:'border-box' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#111827', whiteSpace:'nowrap' }}>Milestones</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>Track key project deliverables and target delivery dates</p>
        </div>
        {hasPermission(null, null, 'projects', 'milestones', 'create') && (
          <button 
            onClick={openAdd} 
            style={{ 
              height: 38, 
              padding: '0 18px', 
              background: '#2563EB', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#fff', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus size={15}/> Add Milestone
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard label="Total Milestones" value={stats.totalMilestones} iconBg="#DBEAFE" iconColor="#2563EB" icon="🎯" />
        <KpiCard label="Completed"        value={stats.completed}  iconBg="#DCFCE7" iconColor="#16A34A" icon="✓"  />
        <KpiCard label="Upcoming"         value={stats.upcoming}   iconBg="#FEF3C7" iconColor="#D97706" icon="📅" />
        <KpiCard label="Delayed"          value={stats.delayed}    iconBg="#FEE2E2" iconColor="#DC2626" icon="⚠"  />
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <AppDropdown
            value={projectFilter}
            onChange={v => setProjectFilter(v)}
            options={[{ value: '', label: 'All Projects' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
            size="sm"
          />
        </div>
        <div style={{ minWidth: 150 }}>
          <AppDropdown
            value={statusFilter}
            onChange={v => setStatusFilter(v)}
            options={[{ value: '', label: 'All Statuses' }, { value: 'Upcoming', label: 'Upcoming' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Delayed', label: 'Delayed' }]}
            size="sm"
          />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>
        {/* Table */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', whiteSpace:'nowrap' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #E5E7EB' }}>
                  {['Milestone','Project','Due Date','Progress','Status','Owner','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap', background:'#FAFAFA' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ padding:'20px', textAlign:'center', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>Loading milestones...</td></tr>}
                {!loading && milestonesList.length === 0 && <tr><td colSpan={7} style={{ padding:'20px', textAlign:'center', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>No milestones found</td></tr>}
                {!loading && milestonesList.map((m) => {
                  const s = STATUS_S[m.status] || STATUS_S['Upcoming'];
                  return (
                    <tr key={m.id} style={{ height:56, borderBottom:'1px solid #F3F4F6' }}>
                      <td style={{ padding:'0 14px', fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>{m.milestone_name}</td>
                      <td style={{ padding:'0 14px', fontSize:13, color:'#374151', whiteSpace:'nowrap' }}>{m.project_name}</td>
                      <td style={{ padding:'0 14px', fontSize:13, color:'#374151', whiteSpace:'nowrap' }}>{formatDate(m.due_date)}</td>
                      <td style={{ padding:'0 14px', minWidth:120, whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, borderRadius:999, background:'#E5E7EB', overflow:'hidden' }}><div style={{ height:'100%', width:loaded?`${m.progress_pct}%`:'0%', background: m.status==='Completed'?'#10B981': m.status==='Delayed'?'#EF4444':'#2563EB', borderRadius:999, transition:'width 900ms ease' }} /></div>
                          <span style={{ fontSize:11, fontWeight:600, color:'#374151', minWidth:30 }}>{m.progress_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:s.bg, color:s.color, fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{m.status}</span></td>
                      <td style={{ padding:'0 14px', fontSize:13, color:'#374151', whiteSpace:'nowrap' }}>{m.owner_name || '—'}</td>
                      <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          {m.status !== 'Completed' && hasPermission(null, null, 'projects', 'milestones', 'edit') && (
                            <button title="Mark Complete" onClick={() => handleComplete(m)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#16A34A',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#DCFCE7'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><CheckCircle2 size={13}/></button>
                          )}
                          {hasPermission(null, null, 'projects', 'milestones', 'edit') && (
                            <button title="Edit" onClick={() => openEdit(m)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#2563EB',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Edit2 size={13}/></button>
                          )}
                          {hasPermission(null, null, 'projects', 'milestones', 'delete') && (
                            <button title="Delete" onClick={() => handleDelete(m)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#DC2626',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Trash2 size={13}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 20px', borderTop:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:13, color:'#6B7280' }}>Showing {(page-1)*limit+1} to {Math.min(page*limit, total)} of {total} entries</span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => page > 1 && setPage(page-1)} disabled={page <= 1} style={{ width:28,height:28,borderRadius:5,border:'1px solid #E5E7EB',background:'#fff',color:page <= 1 ? '#D1D5DB' : '#6B7280',cursor:page <= 1 ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={12}/></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map(pg => {
                const a = pg === page;
                return <button key={pg} onClick={() => setPage(pg)} style={{ width:28,height:28,borderRadius:5,border:a?'none':'1px solid #E5E7EB',background:a?'#2563EB':'#fff',color:a?'#fff':'#374151',fontWeight:a?600:500,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>{pg}</button>;
              })}
              <button onClick={() => page < totalPages && setPage(page+1)} disabled={page >= totalPages} style={{ width:28,height:28,borderRadius:5,border:'1px solid #E5E7EB',background:'#fff',color:page >= totalPages ? '#D1D5DB' : '#6B7280',cursor:page >= totalPages ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={12}/></button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', padding:20 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>Milestone Progress</h3>
            <div style={{ height:140, position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={62} paddingAngle={2} dataKey="value" stroke="none">{stats.pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,.1)' }}/></PieChart></ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
              {stats.pieData.length === 0 && <div style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'8px 0', whiteSpace:'nowrap' }}>No milestone data yet</div>}
              {stats.pieData.map((d,i) => <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', whiteSpace:'nowrap' }}><div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ width:8,height:8,borderRadius:'50%',background:d.color }}/><span style={{ fontSize:12, color:'#374151' }}>{d.name}</span></div><span style={{ fontSize:12, color:'#6B7280' }}>{d.value} ({d.percent})</span></div>)}
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>Upcoming Milestones</h3>
            {stats.upcomingList.length === 0 && <div style={{ fontSize:12, color:'#9CA3AF', padding:'8px 0', whiteSpace:'nowrap' }}>No upcoming milestones</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {stats.upcomingList.map((u, i) => (
                <div key={i} style={{ display:'flex', gap:12, paddingBottom: i<stats.upcomingList.length-1?16:0, marginBottom: i<stats.upcomingList.length-1?16:0, borderBottom: i<stats.upcomingList.length-1?'1px solid #F3F4F6':'' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#2563EB', flexShrink:0, marginTop:3 }} />
                    {i<stats.upcomingList.length-1 && <div style={{ width:2, flex:1, background:'#E5E7EB', marginTop:4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>{u.milestone_name}</div>
                    <div style={{ fontSize:11, color:'#6B7280', marginTop:2, whiteSpace:'nowrap' }}>{u.project_name || '—'}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2, whiteSpace:'nowrap' }}>{formatDate(u.due_date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Milestone Modal */}
      {showAddModal && (editingId ? hasPermission(null, null, 'projects', 'milestones', 'edit') : hasPermission(null, null, 'projects', 'milestones', 'create')) && (
        <>
          <div 
            onClick={() => setShowAddModal(false)} 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease-out'
            }} 
          />
          <div 
            className="modal-centered-content" 
            style={{ 
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '680px', 
              maxWidth: '92vw', 
              maxHeight: '90vh', 
              background: '#ffffff',
              borderRadius: '22px',
              boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: "'Inter', -apple-system, sans-serif"
            }}
          >
            {/* Modal Header: Royal Blue Gradient */}
            <div style={{
              padding: '24px 28px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{ position: 'absolute', top: -35, right: 60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -45, right: 180, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Target size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {editingId ? 'Edit Milestone Target' : 'Create Project Milestone'}
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0 0' }}>
                    Define delivery stages, target deadlines and scope criteria
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 1</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Milestone Scope</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Milestone Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={formData.milestone_name} 
                        onChange={e => setFormData({ ...formData, milestone_name: e.target.value })} 
                        placeholder="e.g. Requirement Gathering & Architecture" 
                        style={{ width: '100%', height: '42px', padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Project <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <AppDropdown
                        value={formData.project_id}
                        onChange={v => setFormData({ ...formData, project_id: v })}
                        options={[{ value: '', label: 'Select Project' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
                        size="md"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Due Date <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="date" 
                        required 
                        value={formData.due_date} 
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Status</label>
                      <AppDropdown
                        value={formData.status}
                        onChange={v => setFormData({ ...formData, status: v })}
                        options={[{ value: 'Upcoming', label: 'Upcoming' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Delayed', label: 'Delayed' }]}
                        size="md"
                      />
                    </div>

                    {editingId && formData.status !== 'Completed' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Progress (%)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={formData.progress_pct} 
                          onChange={e => setFormData({ ...formData, progress_pct: e.target.value })} 
                          style={{ width: '100%', height: '42px', padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Description & Scope</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Key deliverables and milestone completion criteria..." 
                      style={{ width: '100%', height: '70px', minHeight: '60px', maxHeight: '120px', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '18px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  style={{
                    height: '42px',
                    padding: '0 22px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#475569',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  style={{
                    height: '42px',
                    padding: '0 26px',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    background: submitting ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} /> {submitting ? 'Saving...' : (editingId ? 'Save Milestone' : 'Create Milestone')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}