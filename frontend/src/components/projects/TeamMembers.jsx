import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, ChevronLeft, ChevronRight, X, Trash2, Users, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useToast } from '../ui/Toast';
import { apiFetch, getInitials } from '../../lib/api';
import { requireActionPermission, hasPermission } from '../../lib/permissions';

import CustomSelect from '../ui/CustomSelect';

const DEPT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899', '#64748B'];
const STATUS_S = { Active:{ bg:'#DCFCE7', color:'#15803D' }, 'On Leave':{ bg:'#FEF3C7', color:'#D97706' } };
const AVATAR   = [{ bg:'#DBEAFE', c:'#1D4ED8' },{ bg:'#FCE7F3', c:'#9D174D' },{ bg:'#D1FAE5', c:'#065F46' },{ bg:'#FEF3C7', c:'#92400E' },{ bg:'#EDE9FE', c:'#5B21B6' }];

const KpiCard = ({ label, value, iconBg, iconColor, icon }) => (
  <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(15,23,42,.04)', padding:'16px 20px', flex:'1 1 0', minWidth:130 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <span style={{ width:32, height:32, borderRadius:8, background:iconBg, color:iconColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:600, color:'#64748B', whiteSpace:'nowrap' }}>{label}</span>
    </div>
    <div style={{ fontSize:26, fontWeight:700, color:'#0F172A', whiteSpace:'nowrap' }}>{value}</div>
  </div>
);

export default function TeamMembers() {
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [meta, setMeta] = useState({ employees: [], projects: [], roles: [] });
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', project_id: '', role: 'Team Member', status: 'Active'
  });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/project-team');
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        addToast(res.message || 'Failed to fetch team members', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await apiFetch('/project-team/meta');
      if (res.success && res.data) setMeta(res.data);
    } catch (err) { console.error('Failed to load team meta:', err); }
  }, []);

  useEffect(() => { fetchMembers(); fetchMeta(); }, [fetchMembers, fetchMeta]);

  const openAdd = () => {
    if (!requireActionPermission('projects', 'team_members', 'create', null, addToast, 'You do not have permission to assign team members. Please contact your administrator.')) {
      return;
    }
    setEditingId(null);
    setFormData({ employee_id:'', project_id:'', role:'Team Member', status:'Active' });
    setShowAddModal(true);
  };

  const openEdit = (m) => {
    if (!requireActionPermission('projects', 'team_members', 'edit', null, addToast, 'You do not have permission to edit team members. Please contact your administrator.')) {
      return;
    }
    setEditingId(m.id);
    setFormData({
      employee_id: String(m.employee_id || ''),
      project_id: String(m.project_id || ''),
      role: m.role || 'Team Member',
      status: m.status || 'Active'
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const actNeeded = editingId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'team_members', actNeeded, null, addToast, `You do not have permission to ${actNeeded} team members. Please contact your administrator.`)) {
      return;
    }
    if (!formData.employee_id || !formData.project_id) {
      addToast('Employee and Project are required', 'error');
      return;
    }
    const payload = {
      employee_id: parseInt(formData.employee_id),
      project_id: parseInt(formData.project_id),
      role: formData.role,
      status: formData.status
    };
    try {
      const res = await apiFetch(editingId ? `/project-team/${editingId}` : '/project-team', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast(editingId ? 'Team member updated successfully!' : 'Team member assigned successfully!', 'success');
        setShowAddModal(false);
        fetchMembers();
      } else {
        const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save team member');
        addToast(msg, 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleRemove = async (m) => {
    if (!requireActionPermission('projects', 'team_members', 'delete', null, addToast, 'You do not have permission to remove team members. Please contact your administrator.')) {
      return;
    }
    if (!window.confirm(`Remove ${m.name} from the project team?`)) return;
    try {
      const res = await apiFetch(`/project-team/${m.id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Team member removed successfully!', 'success');
        fetchMembers();
      } else {
        addToast(res.message || 'Failed to remove team member', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const onLeave = members.filter(m => m.status === 'On Leave').length;
  const totalOpenTasks = members.reduce((s, m) => s + (m.openTasks || 0), 0);

  const deptCounts = {};
  members.forEach(m => { const d = m.department || 'Other'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
  const DEPT_PIE = Object.keys(deptCounts).map((name, i) => ({ name, value: deptCounts[name], color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", width:'100%', boxSizing:'border-box' }}>

      {/* ── ADD/EDIT MEMBER MODAL ── */}
      {showAddModal && (editingId ? hasPermission(null, null, 'projects', 'team_members', 'edit') : hasPermission(null, null, 'projects', 'team_members', 'create')) && (
        <>
          <div 
            style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(15,23,42,0.65)', backdropFilter:'blur(4px)', zIndex:1000 }} 
            onClick={() => setShowAddModal(false)} 
          />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:620, maxWidth:'94vw', maxHeight:'90vh', background:'#fff', borderRadius:16, zIndex:1001, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 60px -15px rgba(0,0,0,0.3)', border:'1px solid #E2E8F0' }}>
            
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 90, height: 90, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  <Users size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    {editingId ? 'Edit Team Member' : 'Add Team Member'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.82)', whiteSpace: 'nowrap' }}>
                    Assign an employee to a project team and manage role permissions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
              <form id="memberForm" onSubmit={handleSave}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', marginBottom: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: 20, marginBottom: 16, letterSpacing: '0.05em' }}>
                    <Users size={12} /> MEMBER ASSIGNMENT
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <CustomSelect
                        label="Employee"
                        required
                        options={meta.employees.map(emp => ({ value: emp.id, label: emp.name, sublabel: emp.department_name }))}
                        value={formData.employee_id}
                        onChange={val => setFormData(p=>({...p,employee_id:val}))}
                        placeholder="Select Employee"
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="Project"
                        required
                        options={meta.projects.map(p => ({ value: p.id, label: p.name, sublabel: p.project_code }))}
                        value={formData.project_id}
                        onChange={val => setFormData(p=>({...p,project_id:val}))}
                        placeholder="Select Project"
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="Role"
                        options={(meta.roles.length ? meta.roles : ['Team Member'])}
                        value={formData.role}
                        onChange={val => setFormData(p=>({...p,role:val}))}
                        placeholder="Select Role"
                        searchable={false}
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="Status"
                        options={['Active', 'On Leave']}
                        value={formData.status}
                        onChange={val => setFormData(p=>({...p,status:val}))}
                        placeholder="Select Status"
                        searchable={false}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{ padding:'16px 28px', borderTop:'1px solid #E2E8F0', background:'#FAFAFA', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                style={{ height:40, padding:'0 20px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontWeight:600, color:'#475569', background:'#fff', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="memberForm" 
                style={{ height:40, padding:'0 24px', background:'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', boxShadow:'0 2px 6px rgba(37,99,235,0.25)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <UserCheck size={14} />
                {editingId ? 'Save Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0F172A', whiteSpace:'nowrap' }}>Team Members</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B', whiteSpace:'nowrap' }}>Project team and their roles</p>
        </div>
        {hasPermission(null, null, 'projects', 'team_members', 'create') && (
          <button 
            onClick={openAdd} 
            style={{ height:38, padding:'0 16px', background:'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 6px rgba(37,99,235,0.2)', whiteSpace:'nowrap' }}
          >
            <Plus size={15}/> Add Member
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard label="Total Members"  value={totalMembers} iconBg="#DBEAFE" iconColor="#2563EB" icon="👥" />
        <KpiCard label="Active Members" value={activeMembers} iconBg="#DCFCE7" iconColor="#16A34A" icon="✓"  />
        <KpiCard label="On Leave"       value={onLeave}       iconBg="#FEF3C7" iconColor="#D97706" icon="🏖" />
        <KpiCard label="Open Tasks"     value={totalOpenTasks} iconBg="#F3F4F6" iconColor="#6B7280" icon="📋" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>
        {/* Table */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(15,23,42,.04)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #E2E8F0' }}>
                  {['Employee','Role','Department','Assigned Projects','Open Tasks','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'#64748B', whiteSpace:'nowrap', background:'#FAFAFA' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ padding:'24px', textAlign:'center', fontSize:13, color:'#64748B', whiteSpace:'nowrap' }}>Loading team members...</td></tr>}
                {!loading && members.length === 0 && <tr><td colSpan={7} style={{ padding:'24px', textAlign:'center', fontSize:13, color:'#64748B', whiteSpace:'nowrap' }}>No team members yet. Add members to get started.</td></tr>}
                {!loading && members.map((m, i) => {
                  const av = AVATAR[i % AVATAR.length];
                  const s = STATUS_S[m.status] || STATUS_S['Active'];
                  return (
                    <tr key={m.id} style={{ height:56, borderBottom:'1px solid #F1F5F9' }}>
                      <td style={{ padding:'0 16px', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:av.bg, color:av.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{getInitials(m.name)}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', whiteSpace:'nowrap' }}>{m.name}</div>
                            {m.designation && <div style={{ fontSize:11, color:'#94A3B8', whiteSpace:'nowrap' }}>{m.designation}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'0 16px', fontSize:13, color:'#334155', whiteSpace:'nowrap' }}>{m.role}</td>
                      <td style={{ padding:'0 16px', fontSize:13, color:'#334155', whiteSpace:'nowrap' }}>{m.department || '—'}</td>
                      <td style={{ padding:'0 16px', fontSize:13, fontWeight:600, color:'#0F172A', textAlign:'center', whiteSpace:'nowrap' }}>{m.assignedProjects}</td>
                      <td style={{ padding:'0 16px', fontSize:13, fontWeight:600, color:'#0F172A', textAlign:'center', whiteSpace:'nowrap' }}>{m.openTasks}</td>
                      <td style={{ padding:'0 16px', whiteSpace:'nowrap' }}><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:s.bg, color:s.color, fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{m.status}</span></td>
                      <td style={{ padding:'0 16px', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          {hasPermission(null, null, 'projects', 'team_members', 'edit') && (
                            <button title="Edit" onClick={() => openEdit(m)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#2563EB',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Edit2 size={13}/></button>
                          )}
                          {hasPermission(null, null, 'projects', 'team_members', 'delete') && (
                            <button title="Remove" onClick={() => handleRemove(m)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#DC2626',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Trash2 size={13}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 20px', borderTop:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'#64748B', whiteSpace:'nowrap' }}>Showing 1 to {members.length} of {members.length} entries</span>
            <div style={{ display:'flex', gap:4 }}>
              <button style={{ width:28,height:28,borderRadius:6,border:'1px solid #E2E8F0',background:'#fff',color:'#64748B',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={13}/></button>
              <button style={{ width:28,height:28,borderRadius:6,border:'none',background:'#2563EB',color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>1</button>
              <button style={{ width:28,height:28,borderRadius:6,border:'1px solid #E2E8F0',background:'#fff',color:'#334155',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={13}/></button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Department Donut */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(15,23,42,.04)', padding:20 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600, color:'#0F172A', whiteSpace:'nowrap' }}>Department Distribution</h3>
            <div style={{ height:140, position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={DEPT_PIE} cx="50%" cy="50%" innerRadius={44} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">{DEPT_PIE.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}/></PieChart></ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:8 }}>
              {DEPT_PIE.length === 0 && <div style={{ fontSize:12, color:'#94A3B8', textAlign:'center', padding:'8px 0' }}>No team data yet</div>}
              {DEPT_PIE.map((d,i) => <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ width:8,height:8,borderRadius:'50%',background:d.color }}/><span style={{ fontSize:12, color:'#334155', whiteSpace:'nowrap' }}>{d.name}</span></div><span style={{ fontSize:12, fontWeight:600, color:'#0F172A', whiteSpace:'nowrap' }}>{d.value}</span></div>)}
            </div>
          </div>

          {/* Team Overview */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(15,23,42,.04)', padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600, color:'#0F172A', whiteSpace:'nowrap' }}>Team Overview</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'#DBEAFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}><Users size={13} color="#1D4ED8" /></div>
                <div style={{ flex:1 }}><div style={{ fontSize:12, color:'#0F172A', lineHeight:1.4, whiteSpace:'nowrap' }}>{totalMembers} team members</div><div style={{ fontSize:11, color:'#94A3B8', marginTop:2, whiteSpace:'nowrap' }}>across {DEPT_PIE.length} departments</div></div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}><span style={{ color:'#15803D', fontSize:12, fontWeight:700 }}>✓</span></div>
                <div style={{ flex:1 }}><div style={{ fontSize:12, color:'#0F172A', lineHeight:1.4, whiteSpace:'nowrap' }}>{activeMembers} active members</div><div style={{ fontSize:11, color:'#94A3B8', marginTop:2, whiteSpace:'nowrap' }}>currently working</div></div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}><span style={{ color:'#D97706', fontSize:12, fontWeight:700 }}>🏖</span></div>
                <div style={{ flex:1 }}><div style={{ fontSize:12, color:'#0F172A', lineHeight:1.4, whiteSpace:'nowrap' }}>{onLeave} on leave</div><div style={{ fontSize:11, color:'#94A3B8', marginTop:2, whiteSpace:'nowrap' }}>temporarily unavailable</div></div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}><span style={{ color:'#64748B', fontSize:12, fontWeight:700 }}>📋</span></div>
                <div style={{ flex:1 }}><div style={{ fontSize:12, color:'#0F172A', lineHeight:1.4, whiteSpace:'nowrap' }}>{totalOpenTasks} open tasks</div><div style={{ fontSize:11, color:'#94A3B8', marginTop:2, whiteSpace:'nowrap' }}>assigned across projects</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}