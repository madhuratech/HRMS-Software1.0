import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, ChevronLeft, ChevronRight, ChevronDown, X, Trash2, User } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { apiFetch, formatDate, getInitials } from '../../lib/api';
import { requireActionPermission, hasPermission } from '../../lib/permissions';
import CustomSelect from '../ui/CustomSelect';

const STATUS_S = { 'To Do': { bg: '#F3F4F6', color: '#6B7280' }, 'Backlog': { bg: '#F3F4F6', color: '#6B7280' }, 'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' }, 'Testing': { bg: '#FEF3C7', color: '#D97706' }, 'Review': { bg: '#FEF3C7', color: '#D97706' }, 'Completed': { bg: '#DCFCE7', color: '#15803D' }, 'Done': { bg: '#DCFCE7', color: '#15803D' } };
const PRIORITY_S = { 'High': { bg: '#FEE2E2', color: '#DC2626' }, 'Medium': { bg: '#FEF3C7', color: '#D97706' }, 'Low': { bg: '#DCFCE7', color: '#15803D' } };
const AVATAR = [{ bg: '#DBEAFE', c: '#1D4ED8' }, { bg: '#FCE7F3', c: '#9D174D' }, { bg: '#D1FAE5', c: '#065F46' }, { bg: '#FEF3C7', c: '#92400E' }, { bg: '#EDE9FE', c: '#5B21B6' }];

const pill = (label, map) => {
  const s = map[label] || { bg: '#F3F4F6', color: '#6B7280' };
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
};

const KpiCard = ({ label, value, color, icon }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: '16px 20px', flex: '1 1 0', minWidth: 110 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
  </div>
);

const buildPages = (current, total) => {
  if (total <= 1) return [1];
  const pages = [1];
  for (let p = current - 1; p <= current + 1; p++) { if (p > 1 && p < total) pages.push(p); }
  if (total > 1) pages.push(total);
  const out = []; let prev = 0;
  pages.forEach(p => { if (p - prev > 1) out.push('...'); out.push(p); prev = p; });
  return out;
};

const TASK_STATUSES = ['Backlog', 'To Do', 'In Progress', 'Testing', 'Review', 'Done', 'Completed'];

export default function Tasks() {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [meta, setMeta] = useState({ employees: [], projects: [] });
  const [kpiData, setKpiData] = useState({ totalTasks: 0, todo: 0, inProgress: 0, review: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const limit = 10;

  const [formData, setFormData] = useState({ title: '', project_id: '', assignee_id: '', priority: 'Medium', start_date: '', due_date: '', status: 'In Progress', description: '' });

  useEffect(() => { setPage(1); }, [search, projectFilter, statusFilter, assigneeFilter]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await apiFetch('/projects/meta');
      if (res.success && res.data) setMeta({ employees: res.data.employees || [], projects: res.data.projects || [] });
    } catch (err) { console.error('Failed to load task meta:', err); }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/tasks?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (projectFilter) url += `&project_id=${projectFilter}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (assigneeFilter) url += `&assignee_id=${assigneeFilter}`;
      const res = await apiFetch(url);
      if (res.success && res.data) { setTaskList(res.data.tasks || []); setTotal(res.data.total || 0); }
      else addToast(res.message || 'Failed to fetch tasks', 'error');
    } catch (err) { addToast('Error connecting to backend server', 'error'); }
    finally { setLoading(false); }
  }, [page, search, projectFilter, statusFilter, assigneeFilter, addToast]);

  const fetchDashboard = useCallback(async () => {
    try { const res = await apiFetch('/tasks/dashboard'); if (res.success && res.data) setKpiData(res.data); }
    catch (err) { console.error('Failed to load task stats:', err); }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchTasks(); fetchDashboard(); }, [fetchTasks, fetchDashboard]);

  const openAdd = () => {
    if (!requireActionPermission('projects', 'tasks', 'create', null, addToast, 'You do not have permission to create a task.')) return;
    setEditingId(null);
    setFormData({ title: '', project_id: '', assignee_id: '', priority: 'Medium', start_date: '', due_date: '', status: 'In Progress', description: '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEdit = (task) => {
    if (!requireActionPermission('projects', 'tasks', 'edit', null, addToast, 'You do not have permission to edit this task.')) return;
    setEditingId(task.id);
    setFormData({ title: task.title, project_id: String(task.project_id || ''), assignee_id: String(task.assignee_id || ''), priority: task.priority || 'Medium', start_date: task.start_date || '', due_date: task.due_date || '', status: task.status || 'In Progress', description: task.description || '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const act = editingId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'tasks', act, null, addToast, `You do not have permission to ${act} a task.`)) return;

    const errors = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.project_id) errors.project_id = true;
    if (!formData.assignee_id) errors.assignee_id = true;
    if (!formData.start_date) errors.start_date = true;
    if (!formData.due_date) errors.due_date = true;
    if (!formData.description.trim()) errors.description = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setFormErrors({});
    setSubmitting(true);
    const payload = { title: formData.title.trim(), project_id: parseInt(formData.project_id), assignee_id: parseInt(formData.assignee_id), priority: formData.priority, start_date: formData.start_date, due_date: formData.due_date, status: formData.status, description: formData.description.trim() };
    try {
      const res = await apiFetch(editingId ? `/tasks/${editingId}` : '/tasks', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (res.success) { addToast(editingId ? 'Task updated!' : 'Task created!', 'success'); setShowAddModal(false); fetchTasks(); fetchDashboard(); }
      else { const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save task'); addToast(msg, 'error'); }
    } catch (err) { addToast('Connection error occurred', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const res = await apiFetch(`/tasks/${task.id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (res.success) { addToast('Task status updated!', 'success'); fetchTasks(); fetchDashboard(); }
      else addToast(res.message || 'Failed to update status', 'error');
    } catch (err) { addToast('Connection error occurred', 'error'); }
  };

  const handleDelete = async (task) => {
    if (!requireActionPermission('projects', 'tasks', 'delete', null, addToast, 'You do not have permission to delete this task.')) return;
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      const res = await apiFetch(`/tasks/${task.id}`, { method: 'DELETE' });
      if (res.success) { addToast('Task deleted!', 'success'); fetchTasks(); fetchDashboard(); }
      else addToast(res.message || 'Failed to delete task', 'error');
    } catch (err) { addToast('Connection error occurred', 'error'); }
  };

  const authRaw = localStorage.getItem('hrms_auth');
  let userRole = 'SUPER_ADMIN';
  if (authRaw) { try { const p = JSON.parse(authRaw); if (p.role) userRole = p.role; } catch (e) { } }
  const isEmployeeRole = userRole === 'EMPLOYEE';

  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Tasks</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Build and manage project tasks and assignees</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
          <CustomSelect
            options={[{ value: '', label: 'All Projects' }, ...meta.projects.map(p => ({ value: p.id, label: p.name, sublabel: p.project_code }))]}
            value={projectFilter}
            onChange={val => setProjectFilter(val)}
            placeholder="All Projects"
            searchable
            style={{ width: 180 }}
          />
          <CustomSelect
            options={[{ value: '', label: 'All Status' }, ...TASK_STATUSES.map(s => ({ value: s, label: s }))]}
            value={statusFilter}
            onChange={val => setStatusFilter(val)}
            placeholder="All Status"
            searchable={false}
            style={{ width: 150 }}
          />
          {hasPermission(null, null, 'projects', 'tasks', 'create') && (
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
              <Plus size={15} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Total Tasks" value={kpiData.totalTasks} color="#111827" icon="📋" />
        <KpiCard label="To Do" value={kpiData.todo} color="#6B7280" icon="📝" />
        <KpiCard label="In Progress" value={kpiData.inProgress} color="#2563EB" icon="▶" />
        <KpiCard label="Review" value={kpiData.review} color="#D97706" icon="🔍" />
        <KpiCard label="Completed" value={kpiData.completed} color="#10B981" icon="✓" />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', height: 38, paddingLeft: 30, paddingRight: 12, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <CustomSelect
            options={[{ value: '', label: 'All Assignees' }, ...meta.employees.map(emp => ({ value: emp.id, label: emp.name, sublabel: emp.department_name }))]}
            value={assigneeFilter}
            onChange={val => setAssigneeFilter(val)}
            placeholder="All Assignees"
            searchable
            style={{ width: 180 }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading && <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Loading tasks...</div>}
          {!loading && taskList.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>No tasks found.</div>}
          {!loading && taskList.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Task Name', 'Project', 'Assigned To', 'Due Date', 'Priority', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', background: '#FAFAFA' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskList.map((t, i) => {
                  const av = AVATAR[i % AVATAR.length];
                  return (
                    <tr key={t.id} style={{ height: 56, borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0 14px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{t.title}</td>
                      <td style={{ padding: '0 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{t.project_name}</td>
                      <td style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: av.bg, color: av.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{getInitials(t.assignee_name)}</div>
                          <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{t.assignee_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(t.due_date)}</td>
                      <td style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>{pill(t.priority, PRIORITY_S)}</td>
                      <td style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>
                        {hasPermission(null, null, 'projects', 'tasks', 'edit') ? (
                          <CustomSelect
                            options={TASK_STATUSES}
                            value={t.status}
                            onChange={val => handleStatusChange(t, val)}
                            searchable={false}
                            style={{ width: 130 }}
                          />
                        ) : (
                          pill(t.status, STATUS_S)
                        )}
                      </td>
                      <td style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {hasPermission(null, null, 'projects', 'tasks', 'edit') && (
                            <button title="Edit" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => openEdit(t)}><Edit2 size={13} /></button>
                          )}
                          {hasPermission(null, null, 'projects', 'tasks', 'delete') && (
                            <button title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => handleDelete(t)}><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Showing {startIndex} to {endIndex} of {total} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[null, ...buildPages(page, totalPages), null].map((pg, i) => {
              if (pg === null) { const isL = i === 0; return <button key={i} onClick={() => { (isL ? page > 1 : page < totalPages) && setPage(isL ? page - 1 : page + 1); }} disabled={isL ? page <= 1 : page >= totalPages} style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', color: (isL ? page <= 1 : page >= totalPages) ? '#D1D5DB' : '#6B7280', cursor: (isL ? page <= 1 : page >= totalPages) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}</button>; }
              if (pg === '...') return <span key={i} style={{ width: 28, textAlign: 'center', color: '#6B7280', fontSize: 13, lineHeight: '28px' }}>...</span>;
              const a = pg === page; return <button key={i} onClick={() => setPage(pg)} style={{ width: 28, height: 28, borderRadius: 5, border: a ? 'none' : '1px solid #E5E7EB', background: a ? '#2563EB' : '#fff', color: a ? '#fff' : '#374151', fontWeight: a ? 600 : 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pg}</button>;
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (editingId ? hasPermission(null, null, 'projects', 'tasks', 'edit') : hasPermission(null, null, 'projects', 'tasks', 'create')) && (
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
              width: '880px', 
              maxWidth: '94vw', 
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
              {/* Ambient Background Circles */}
              <div style={{ position: 'absolute', top: -35, right: 60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -45, right: 180, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Edit2 size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {editingId ? 'Edit Task Details' : 'Create New Task'}
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0 0' }}>
                    Assign task parameters, assignees, priorities and target milestones
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

            <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* SECTION 1: Task Assignment */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 1</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Task & Project Information</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Task Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => {
                          setFormData({ ...formData, title: e.target.value });
                          if (formErrors.title) setFormErrors(prev => ({ ...prev, title: false }));
                        }}
                        placeholder="e.g. Design Landing Page"
                        style={{ width: '100%', height: '42px', padding: '0 14px', border: formErrors.title ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#1E293B', background: '#FFFFFF', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = formErrors.title ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                      {formErrors.title && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please enter task name</p>}
                    </div>

                    <div>
                      <CustomSelect
                        label="Project"
                        required
                        options={meta.projects.map(p => ({ value: p.id, label: p.name, sublabel: p.project_code }))}
                        value={formData.project_id}
                        onChange={val => {
                          setFormData(prev => ({ ...prev, project_id: val }));
                          if (formErrors.project_id) setFormErrors(prev => ({ ...prev, project_id: false }));
                        }}
                        placeholder="Select Project"
                        error={formErrors.project_id}
                      />
                      {formErrors.project_id && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please select a project</p>}
                    </div>

                    <div>
                      <CustomSelect
                        label="Assigned To"
                        required
                        options={meta.employees.map(emp => ({
                          value: emp.id,
                          label: `${emp.name} (EMP${String(emp.id).padStart(3, '0')})`,
                          sublabel: emp.department_name
                        }))}
                        value={formData.assignee_id}
                        onChange={val => {
                          setFormData(prev => ({ ...prev, assignee_id: val }));
                          if (formErrors.assignee_id) setFormErrors(prev => ({ ...prev, assignee_id: false }));
                        }}
                        placeholder="Select Employee"
                        error={formErrors.assignee_id}
                      />
                      {formErrors.assignee_id && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please select an employee</p>}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Timeline & Status */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 2</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Timeline, Priority & Status</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Start Date <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={e => {
                          setFormData({ ...formData, start_date: e.target.value });
                          if (formErrors.start_date) setFormErrors(prev => ({ ...prev, start_date: false }));
                        }}
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.start_date ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = formErrors.start_date ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                      {formErrors.start_date && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please select start date</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Due Date <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={e => {
                          setFormData({ ...formData, due_date: e.target.value });
                          if (formErrors.due_date) setFormErrors(prev => ({ ...prev, due_date: false }));
                        }}
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.due_date ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = formErrors.due_date ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                      {formErrors.due_date && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please select due date</p>}
                    </div>

                    <div>
                      <CustomSelect
                        label="Priority"
                        options={['High', 'Medium', 'Low']}
                        value={formData.priority}
                        onChange={val => setFormData(prev => ({ ...prev, priority: val }))}
                        placeholder="Select Priority"
                        searchable={false}
                      />
                    </div>

                    <div>
                      <CustomSelect
                        label="Status"
                        options={TASK_STATUSES}
                        value={formData.status}
                        onChange={val => setFormData(prev => ({ ...prev, status: val }))}
                        placeholder="Select Status"
                        searchable={false}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Description & Acceptance Criteria <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => {
                        setFormData({ ...formData, description: e.target.value });
                        if (formErrors.description) setFormErrors(prev => ({ ...prev, description: false }));
                      }}
                      placeholder="Enter detailed task instructions and acceptance criteria..."
                      style={{ width: '100%', height: '64px', minHeight: '64px', maxHeight: '120px', padding: '10px 14px', border: formErrors.description ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = formErrors.description ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                    {formErrors.description && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#EF4444' }}>Please enter task description</p>}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '11px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#475569',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  style={{
                    height: '44px',
                    padding: '0 28px',
                    border: 'none',
                    borderRadius: '11px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    background: submitting ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => { if(!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.45)'; } }}
                  onMouseLeave={e => { if(!submitting) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)'; } }}
                >
                  <Plus size={15} /> {submitting ? 'Saving Task...' : (editingId ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
