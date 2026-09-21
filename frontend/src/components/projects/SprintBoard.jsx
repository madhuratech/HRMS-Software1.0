import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, X, Pencil, Trash2, Zap, Layers, Calendar, CheckSquare, Clock } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { apiFetch, formatDate, getInitials } from '../../lib/api';
import { guardCreateAction, requireActionPermission, hasPermission } from '../../lib/permissions';

const PRIORITY_COLOR = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };
const LABEL_COLOR    = { Feature:'#DBEAFE/#2563EB', Backend:'#D1FAE5/#065F46', Security:'#FEE2E2/#DC2626', Design:'#EDE9FE/#5B21B6', QA:'#FEF3C7/#D97706', Bug:'#FEE2E2/#DC2626', Enhancement:'#F3F4F6/#6B7280', Setup:'#E0E7FF/#3730A3', Auth:'#FCE7F3/#9D174D', Admin:'#DBEAFE/#1D4ED8' };

const LabelPill = ({ label }) => {
  const parts = (LABEL_COLOR[label] || '#F3F4F6/#6B7280').split('/');
  return <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:999, background:parts[0], color:parts[1], fontSize:10, fontWeight:600 }}>{label}</span>;
};

const Avatar = ({ initials }) => {
  const [bg, c] = ['#DBEAFE', '#1D4ED8'];
  return <div style={{ width:22, height:22, borderRadius:'50%', background:bg, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{initials}</div>;
};

const KanbanCard = ({ card, onEdit, onDelete }) => (
  <div style={{ background:'#fff', borderRadius:10, border:'1px solid #E5E7EB', boxShadow:'0 1px 4px rgba(15,23,42,.06)', padding:'12px 14px', cursor:'pointer', transition:'box-shadow .2s', position:'relative' }}
    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(15,23,42,.12)'}
    onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(15,23,42,.06)'}
    onClick={() => onEdit && onEdit(card)}
  >
    <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(card); }} style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:5, border:'none', background:'transparent', color:'#9CA3AF', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={12} /></button>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
      <LabelPill label={card.label} />
      <div style={{ width:8, height:8, borderRadius:'50%', background:PRIORITY_COLOR[card.priority] }} />
    </div>
    <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:8, lineHeight:1.4 }}>{card.title}</div>
    <div style={{ fontSize:11, color:'#6B7280', marginBottom:10 }}>{card.project}</div>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <Avatar initials={card.assignee} />
      <span style={{ fontSize:11, color:'#9CA3AF' }}>{formatDate(card.due)}</span>
    </div>
  </div>
);

const COLUMN_STATUS = { backlog: 'Backlog', todo: 'To Do', inprogress: 'In Progress', testing: 'Testing', done: 'Done' };
const DEFAULT_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#6B7280', bg: '#F9FAFB' },
  { id: 'todo', label: 'To Do', color: '#6B7280', bg: '#F9FAFB' },
  { id: 'inprogress', label: 'In Progress', color: '#1D4ED8', bg: '#EFF6FF' },
  { id: 'testing', label: 'Testing', color: '#D97706', bg: '#FFFBEB' },
  { id: 'done', label: 'Done', color: '#15803D', bg: '#F0FDF4' }
];

export default function SprintBoard() {
  const { addToast } = useToast();
  const [board, setBoard] = useState({ sprint: null, columns: DEFAULT_COLUMNS, cards: {}, progress: { total: 0, done: 0, pending: 0, pct: 0 } });
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create/Edit Sprint Modal
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '', project_id: '', status: 'Planning' });

  // Add Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskColumn, setTaskColumn] = useState('todo');
  const [taskForm, setTaskForm] = useState({ title: '', project_id: '', assignee_id: '', priority: 'Medium', label: 'Feature', due: '' });

  const fetchMeta = useCallback(async () => {
    try {
      const res = await apiFetch('/projects/meta');
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setEmployees(res.data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load sprint meta:', err);
    }
  }, []);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/sprints/board');
      if (res.success && res.data) {
        const rawColumns = (res.data.columns && res.data.columns.length) ? res.data.columns : DEFAULT_COLUMNS;
        const columns = DEFAULT_COLUMNS.map(def => {
          const matched = rawColumns.find(c => c.id === def.id) || {};
          return { ...def, ...matched, id: def.id };
        });
        setBoard({ ...res.data, columns });
      } else {
        addToast(res.message || 'Failed to fetch sprint board', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchMeta(); fetchBoard(); }, [fetchMeta, fetchBoard]);

  const openCreateSprint = () => {
    if (!requireActionPermission('projects', 'sprint_board', 'create', null, addToast, 'You do not have permission to create sprints. Please contact your administrator.')) {
      return;
    }
    setEditingSprintId(null);
    setSprintForm({ name: '', goal: '', startDate: '', endDate: '', project_id: '', status: 'Planning' });
    setShowSprintModal(true);
  };

  const openEditSprint = () => {
    const s = board.sprint;
    if (!s) return;
    if (!requireActionPermission('projects', 'sprint_board', 'edit', null, addToast, 'You do not have permission to edit sprints. Please contact your administrator.')) {
      return;
    }
    setEditingSprintId(s.id);
    setSprintForm({ name: s.name || '', goal: s.goal || '', startDate: s.start_date || '', endDate: s.end_date || '', project_id: String(s.project_id || ''), status: s.status || 'Planning' });
    setShowSprintModal(true);
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    const actNeeded = editingSprintId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'sprint_board', actNeeded, null, addToast, `You do not have permission to ${actNeeded} sprints. Please contact your administrator.`)) {
      return;
    }
    if (!sprintForm.name) {
      addToast('Sprint Name is required', 'error');
      return;
    }
    try {
      const payload = {
        name: sprintForm.name.trim(),
        goal: sprintForm.goal,
        project_id: sprintForm.project_id ? parseInt(sprintForm.project_id) : null,
        start_date: sprintForm.startDate,
        end_date: sprintForm.endDate,
        status: sprintForm.status
      };
      const res = await apiFetch(editingSprintId ? `/sprints/${editingSprintId}` : '/sprints', {
        method: editingSprintId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast(editingSprintId ? 'Sprint updated successfully!' : 'Sprint created successfully!', 'success');
        setShowSprintModal(false);
        fetchBoard();
      } else {
        const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save sprint');
        addToast(msg, 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleDeleteSprint = async () => {
    const s = board.sprint;
    if (!s) return;
    if (!requireActionPermission('projects', 'sprint_board', 'delete', null, addToast, 'You do not have permission to delete sprints. Please contact your administrator.')) {
      return;
    }
    if (!window.confirm(`Delete sprint "${s.name}"?`)) return;
    try {
      const res = await apiFetch(`/sprints/${s.id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Sprint deleted successfully!', 'success');
        fetchBoard();
      } else {
        addToast(res.message || 'Failed to delete sprint', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const openAddTask = (colId) => {
    if (!requireActionPermission('projects', 'tasks', 'create', null, addToast, 'You do not have permission to create tasks. Please contact your administrator.')) {
      return;
    }
    setEditingTaskId(null);
    setTaskColumn(colId);
    setTaskForm({ title: '', project_id: '', assignee_id: '', priority: 'Medium', label: 'Feature', due: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (card) => {
    if (!requireActionPermission('projects', 'tasks', 'edit', null, addToast, 'You do not have permission to edit tasks. Please contact your administrator.')) {
      return;
    }
    setEditingTaskId(card.id);
    const col = board.columns.find(c => board.cards && board.cards[c.id] && board.cards[c.id].find(x => x.id === card.id));
    setTaskColumn(col ? col.id : 'todo');
    setTaskForm({
      title: card.title,
      project_id: card.project_id !== undefined ? String(card.project_id) : '',
      assignee_id: card.assignee_id !== undefined ? String(card.assignee_id) : '',
      priority: card.priority || 'Medium',
      label: card.label || 'Feature',
      due: card.due || ''
    });
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const actNeeded = editingTaskId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'tasks', actNeeded, null, addToast, `You do not have permission to ${actNeeded} tasks. Please contact your administrator.`)) {
      return;
    }
    if (!taskForm.title) {
      addToast('Task Title is required', 'error');
      return;
    }
    if (!taskForm.project_id) {
      addToast('Project is required', 'error');
      return;
    }
    const status = COLUMN_STATUS[taskColumn] || 'To Do';
    const payload = {
      title: taskForm.title.trim(),
      project_id: parseInt(taskForm.project_id),
      assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
      priority: taskForm.priority,
      label: taskForm.label,
      due_date: taskForm.due,
      status
    };
    try {
      const res = await apiFetch(editingTaskId ? `/tasks/${editingTaskId}` : '/tasks', {
        method: editingTaskId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast(editingTaskId ? 'Task updated successfully!' : 'Task added successfully!', 'success');
        setShowTaskModal(false);
        fetchBoard();
      } else {
        const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save task');
        addToast(msg, 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleDeleteTask = async (card) => {
    if (!requireActionPermission('projects', 'tasks', 'delete', null, addToast, 'You do not have permission to delete tasks. Please contact your administrator.')) {
      return;
    }
    if (!window.confirm(`Delete task "${card.title}"?`)) return;
    try {
      const res = await apiFetch(`/tasks/${card.id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Task deleted successfully!', 'success');
        fetchBoard();
      } else {
        addToast(res.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const sprint = board.sprint;
  const subtitle = sprint
    ? `${sprint.name} (${formatDate(sprint.start_date)} - ${formatDate(sprint.end_date)})`
    : 'No active sprint';

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", width:'100%', boxSizing:'border-box' }}>

      {/* ── CREATE/EDIT SPRINT MODAL ── */}
      {showSprintModal && (
        <>
          <div 
            onClick={() => setShowSprintModal(false)} 
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
                  <Zap size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {editingSprintId ? 'Edit Sprint' : 'Create New Sprint'}
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0 0' }}>
                    Define sprint cycle, project scope, timeline and sprint goal
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSprintModal(false)} 
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <form id="sprintForm" onSubmit={handleCreateSprint}>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 1</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sprint Configuration</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Sprint Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sprint 14" 
                        value={sprintForm.name} 
                        onChange={e => setSprintForm(p=>({...p,name:e.target.value}))} 
                        required 
                        style={{ width: '100%', height: '42px', padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Project</label>
                      <AppDropdown
                        value={sprintForm.project_id}
                        onChange={v => setSprintForm(p => ({ ...p, project_id: v }))}
                        options={[{ value: '', label: 'Select Project' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Start Date</label>
                      <input 
                        type="date" 
                        value={sprintForm.startDate} 
                        onChange={e => setSprintForm(p=>({...p,startDate:e.target.value}))} 
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>End Date</label>
                      <input 
                        type="date" 
                        value={sprintForm.endDate} 
                        onChange={e => setSprintForm(p=>({...p,endDate:e.target.value}))} 
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Sprint Status</label>
                      <AppDropdown
                        value={sprintForm.status}
                        onChange={v => setSprintForm(p => ({ ...p, status: v }))}
                        options={[{ value: 'Planning', label: 'Planning' }, { value: 'Active', label: 'Active' }, { value: 'Completed', label: 'Completed' }]}
                        size="md"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Sprint Goal</label>
                    <textarea 
                      placeholder="Describe key deliverable targets for this sprint..." 
                      value={sprintForm.goal} 
                      onChange={e => setSprintForm(p=>({...p,goal:e.target.value}))} 
                      style={{ width: '100%', height: '70px', minHeight: '60px', maxHeight: '120px', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '18px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
              <button 
                type="button" 
                onClick={() => setShowSprintModal(false)} 
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
                form="sprintForm" 
                style={{
                  height: '42px',
                  padding: '0 26px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} /> {editingSprintId ? 'Save Sprint' : 'Create Sprint'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── ADD TASK MODAL ── */}
      {showTaskModal && (
        <>
          <div 
            onClick={() => setShowTaskModal(false)} 
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
                  <CheckSquare size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {editingTaskId ? 'Edit Sprint Task' : 'Add Sprint Task'}
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0 0' }}>
                    Add to column: <strong>{board.columns.find(c=>c.id===taskColumn)?.label}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowTaskModal(false)} 
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <form id="taskForm" onSubmit={handleCreateTask}>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 1</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Task Attributes</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Task Title <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Enter task title" 
                        value={taskForm.title} 
                        onChange={e => setTaskForm(p=>({...p,title:e.target.value}))} 
                        required 
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
                        value={taskForm.project_id}
                        onChange={v => setTaskForm(p => ({ ...p, project_id: v }))}
                        options={[{ value: '', label: 'Select Project' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Assignee</label>
                      <AppDropdown
                        value={taskForm.assignee_id}
                        onChange={v => setTaskForm(p => ({ ...p, assignee_id: v }))}
                        options={[{ value: '', label: 'Unassigned' }, ...(employees || []).map(e => ({ value: String(e.id), label: e.name }))]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Priority</label>
                      <AppDropdown
                        value={taskForm.priority}
                        onChange={v => setTaskForm(p => ({ ...p, priority: v }))}
                        options={[{ value: 'High', label: '🔴 High' }, { value: 'Medium', label: '🟡 Medium' }, { value: 'Low', label: '🟢 Low' }]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Label</label>
                      <AppDropdown
                        value={taskForm.label}
                        onChange={v => setTaskForm(p => ({ ...p, label: v }))}
                        options={Object.keys(LABEL_COLOR).map(l => ({ value: l, label: l }))}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Due Date</label>
                      <input 
                        type="date" 
                        value={taskForm.due} 
                        onChange={e => setTaskForm(p=>({...p,due:e.target.value}))} 
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Board Column</label>
                      <AppDropdown
                        value={taskColumn}
                        onChange={v => setTaskColumn(v)}
                        options={(board?.columns || []).map(c => ({ value: c.id, label: c.label }))}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '18px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
              <button 
                type="button" 
                onClick={() => setShowTaskModal(false)} 
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
                form="taskForm" 
                style={{
                  height: '42px',
                  padding: '0 26px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} /> {editingTaskId ? 'Save Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#111827', whiteSpace:'nowrap' }}>Sprint Board</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>{subtitle}{sprint && board.progress ? ` · ${board.progress.pct}% done` : ''}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', flexShrink:0 }}>
          {sprint && (
            <>
              {hasPermission(null, null, 'projects', 'sprint_board', 'edit') && (
                <button onClick={openEditSprint} style={{ height:38, padding:'0 16px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0 }}><Pencil size={14} /> Edit Sprint</button>
              )}
              {hasPermission(null, null, 'projects', 'sprint_board', 'delete') && (
                <button onClick={handleDeleteSprint} style={{ height:38, padding:'0 16px', background:'#fff', border:'1px solid #FECACA', borderRadius:8, fontSize:13, fontWeight:600, color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0 }}><Trash2 size={14} /> Delete Sprint</button>
              )}
            </>
          )}
          {hasPermission(null, null, 'projects', 'sprint_board', 'create') && (
            <button onClick={openCreateSprint} style={{ height:38, padding:'0 18px', background:'#2563EB', border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0 }}><Plus size={15} /> Create Sprint</button>
          )}
        </div>
      </div>
      {loading && <div style={{ padding:20, textAlign:'center', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>Loading sprint board...</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16, overflowX:'auto' }}>
        {board.columns.map(col => {
          const colCards = board.cards ? (board.cards[col.id] || []) : [];
          return (
            <div key={col.id} style={{ minWidth:220 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:col.bg, borderRadius:'10px 10px 0 0', border:'1px solid #E5E7EB', borderBottom:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:col.color }} />
                  <span style={{ fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>{col.label}</span>
                </div>
                <span style={{ width:20, height:20, borderRadius:'50%', background:'#fff', border:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:col.color }}>{colCards.length}</span>
              </div>
              <div style={{ background:'#F8FAFC', border:'1px solid #E5E7EB', borderTop:'none', borderRadius:'0 0 10px 10px', padding:'10px 10px', display:'flex', flexDirection:'column', gap:10, minHeight:300 }}>
                {colCards.length === 0 && <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', padding:'8px 0', whiteSpace:'nowrap' }}>No tasks</div>}
                {colCards.map((c,i) => <KanbanCard key={i} card={c} onEdit={openEditTask} onDelete={handleDeleteTask} />)}
                <button onClick={() => openAddTask(col.id)} style={{ marginTop:4, width:'100%', height:32, borderRadius:8, border:'1px dashed #D1D5DB', background:'transparent', color:'#9CA3AF', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, whiteSpace:'nowrap' }} onMouseEnter={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#2563EB';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#9CA3AF';}}><Plus size={12}/> Add Task</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}