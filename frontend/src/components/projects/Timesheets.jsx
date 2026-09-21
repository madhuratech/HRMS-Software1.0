import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Plus, Edit2, ChevronLeft, ChevronRight, Calendar, X, Trash2, Clock } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { apiFetch, formatDate, getInitials } from '../../lib/api';
import { requireActionPermission, hasPermission } from '../../lib/permissions';

const STATUS_S = { Approved:{ bg:'#DCFCE7', color:'#15803D' }, Pending:{ bg:'#FEF3C7', color:'#D97706' }, Rejected:{ bg:'#FEE2E2', color:'#DC2626' } };
const AVATAR   = [{ bg:'#DBEAFE', c:'#1D4ED8' },{ bg:'#FCE7F3', c:'#9D174D' },{ bg:'#D1FAE5', c:'#065F46' },{ bg:'#FEF3C7', c:'#92400E' },{ bg:'#EDE9FE', c:'#5B21B6' }];

const KpiCard = ({ label, value, unit, iconBg, iconColor, icon }) => (
  <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', padding:'16px 20px', flex:'1 1 0', minWidth:120 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><span style={{ width:30, height:30, borderRadius:8, background:iconBg, color:iconColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{icon}</span><span style={{ fontSize:12, fontWeight:500, color:'#6B7280', whiteSpace: 'nowrap' }}>{label}</span></div>
    <div style={{ display:'flex', alignItems:'baseline', gap:4 }}><span style={{ fontSize:26, fontWeight:700, color:'#111827' }}>{value}</span><span style={{ fontSize:12, color:'#6B7280' }}>{unit}</span></div>
  </div>
);

const weekRange = () => {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - day);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const iso = d => d.toISOString().slice(0, 10);
  return { week_start: iso(monday), week_end: iso(sunday) };
};

export default function Timesheets() {
  const { addToast } = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalHours:0, billableHours:0, nonBillableHours:0, pendingCount:0 });
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', project_id: '', log_date: '', hours: '', billable: 'Billable',
    task_description: '', status: 'Pending',
  });

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (employeeFilter) q.set('employee_id', employeeFilter);
    if (projectFilter) q.set('project_id', projectFilter);
    if (statusFilter) q.set('status', statusFilter);
    if (period === 'monthly') q.set('month', new Date().toISOString().slice(0, 7));
    if (period === 'weekly') { const w = weekRange(); q.set('week_start', w.week_start); q.set('week_end', w.week_end); }
    q.set('page', String(page));
    q.set('limit', String(limit));
    return q.toString();
  }, [search, employeeFilter, projectFilter, statusFilter, period, page]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await apiFetch('/projects/meta');
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setEmployees(res.data.employees || []);
      }
    } catch (err) { console.error('Failed to load timesheet meta:', err); }
  }, []);

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/timesheets?${buildQuery()}`);
      if (res.success && res.data) {
        setRows(res.data.timesheets || []);
        setTotal(res.data.total || 0);
      } else {
        addToast(res.message || 'Failed to fetch timesheets', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, addToast]);

  const fetchSummary = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (employeeFilter) q.set('employee_id', employeeFilter);
      if (projectFilter) q.set('project_id', projectFilter);
      if (period === 'monthly') q.set('month', new Date().toISOString().slice(0, 7));
      if (period === 'weekly') { const w = weekRange(); q.set('week_start', w.week_start); q.set('week_end', w.week_end); }
      const res = await apiFetch(`/timesheets/summary?${q.toString()}`);
      if (res.success && res.data) setSummary(res.data);
    } catch (err) { console.error('Failed to fetch timesheet summary:', err); }
  }, [employeeFilter, projectFilter, period]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => { setPage(1); }, [search, employeeFilter, projectFilter, statusFilter, period]);

  const openLogTime = () => {
    if (!requireActionPermission('projects', 'timesheets', 'create', null, addToast, 'You do not have permission to log time. Please contact your administrator.')) {
      return;
    }
    setEditingId(null);
    setFormData({ employee_id:'', project_id:'', log_date: new Date().toISOString().slice(0, 10), hours:'', billable:'Billable', task_description:'', status:'Pending' });
    setShowModal(true);
  };

  const openEdit = (r) => {
    if (!requireActionPermission('projects', 'timesheets', 'edit', null, addToast, 'You do not have permission to edit timesheets. Please contact your administrator.')) {
      return;
    }
    setEditingId(r.id);
    setFormData({
      employee_id: String(r.employee_id || ''),
      project_id: String(r.project_id || ''),
      log_date: r.log_date ? r.log_date.slice(0,10) : '',
      hours: r.hours,
      billable: r.billable === 'Billable' ? 'Billable' : 'Non-Billable',
      task_description: r.task_description || '',
      status: r.status || 'Pending'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const actNeeded = editingId ? 'edit' : 'create';
    if (!requireActionPermission('projects', 'timesheets', actNeeded, null, addToast, `You do not have permission to ${actNeeded} timesheets. Please contact your administrator.`)) {
      return;
    }
    if (!formData.employee_id || !formData.project_id || !formData.hours) {
      addToast('Employee, Project and Hours are required', 'error');
      return;
    }
    const payload = {
      employee_id: parseInt(formData.employee_id),
      project_id: parseInt(formData.project_id),
      log_date: formData.log_date,
      hours: parseFloat(formData.hours),
      billable: formData.billable,
      status: formData.status,
      task_description: formData.task_description
    };
    try {
      const res = await apiFetch(editingId ? `/timesheets/${editingId}` : '/timesheets', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast(editingId ? 'Timesheet updated successfully!' : 'Time logged successfully!', 'success');
        setShowModal(false);
        fetchTimesheets();
        fetchSummary();
      } else {
        const msg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to save timesheet');
        addToast(msg, 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const handleDelete = async (r) => {
    if (!requireActionPermission('projects', 'timesheets', 'delete', null, addToast, 'You do not have permission to delete timesheets. Please contact your administrator.')) {
      return;
    }
    if (!window.confirm(`Delete timesheet entry for ${r.employee_name} (${r.hours}h)?`)) return;
    try {
      const res = await apiFetch(`/timesheets/${r.id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Timesheet deleted successfully!', 'success');
        fetchTimesheets();
        fetchSummary();
      } else {
        addToast(res.message || 'Failed to delete timesheet', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const periodLabel = period === 'weekly'
    ? `${formatDate(weekRange().week_start)} - ${formatDate(weekRange().week_end)}`
    : `${new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' })}`;

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", width:'100%', boxSizing:'border-box' }}>

      {/* ── LOG TIME MODAL ── */}
      {showModal && (editingId ? hasPermission(null, null, 'projects', 'timesheets', 'edit') : hasPermission(null, null, 'projects', 'timesheets', 'create')) && (
        <>
          <div 
            onClick={() => setShowModal(false)} 
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
                  <Clock size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {editingId ? 'Edit Timesheet Entry' : 'Log Project Time'}
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0 0' }}>
                    Record time spent, billable status and task details
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
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
              <form id="timesheetForm" onSubmit={handleSave}>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>SECTION 1</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Timesheet Entry Details</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Employee <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <AppDropdown
                        value={formData.employee_id}
                        onChange={v => setFormData(p => ({ ...p, employee_id: v }))}
                        options={[{ value: '', label: 'Select Employee' }, ...(employees || []).map(e => ({ value: String(e.id), label: e.name }))]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Project <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <AppDropdown
                        value={formData.project_id}
                        onChange={v => setFormData(p => ({ ...p, project_id: v }))}
                        options={[{ value: '', label: 'Select Project' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Date</label>
                      <input 
                        type="date" 
                        value={formData.log_date} 
                        onChange={e => setFormData(p=>({...p,log_date:e.target.value}))} 
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Hours Logged <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="number" 
                        min="0.5" 
                        max="24" 
                        step="0.5" 
                        placeholder="e.g. 8" 
                        value={formData.hours} 
                        onChange={e => setFormData(p=>({...p,hours:e.target.value}))} 
                        required 
                        style={{ width: '100%', height: '42px', padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Billable Type</label>
                      <AppDropdown
                        value={formData.billable}
                        onChange={v => setFormData(p => ({ ...p, billable: v }))}
                        options={[{ value: 'Billable', label: 'Billable' }, { value: 'Non-Billable', label: 'Non-Billable' }]}
                        size="md"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Approval Status</label>
                      <AppDropdown
                        value={formData.status}
                        onChange={v => setFormData(p => ({ ...p, status: v }))}
                        options={[{ value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }]}
                        size="md"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Task Description</label>
                    <textarea 
                      placeholder="Describe the tasks completed during this time..." 
                      value={formData.task_description} 
                      onChange={e => setFormData(p=>({...p,task_description:e.target.value}))} 
                      style={{ width: '100%', height: '64px', minHeight: '60px', maxHeight: '120px', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#1E293B', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
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
                onClick={() => setShowModal(false)} 
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
                form="timesheetForm" 
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
                <Plus size={15} /> {editingId ? 'Save Timesheet' : 'Log Time'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#111827', whiteSpace:'nowrap' }}>Timesheets</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>Track time logged by team members</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#374151', whiteSpace:'nowrap', flexShrink:0 }}>
            <Calendar size={14}/> {periodLabel}
          </div>
          <div style={{ minWidth: 120 }}>
            <AppDropdown
              value={period}
              onChange={v => setPeriod(v)}
              options={[{ value: 'all', label: 'All Time' }, { value: 'monthly', label: 'This Month' }, { value: 'weekly', label: 'This Week' }]}
              size="sm"
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <AppDropdown
              value={employeeFilter}
              onChange={v => setEmployeeFilter(v)}
              options={[{ value: '', label: 'All Employees' }, ...(employees || []).map(e => ({ value: String(e.id), label: e.name }))]}
              size="sm"
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <AppDropdown
              value={projectFilter}
              onChange={v => setProjectFilter(v)}
              options={[{ value: '', label: 'All Projects' }, ...(projects || []).map(p => ({ value: String(p.id), label: p.project_name || p.name }))]}
              size="sm"
            />
          </div>
          {hasPermission(null, null, 'projects', 'timesheets', 'create') && (
            <button 
              onClick={openLogTime} 
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
              <Plus size={15}/> Log Time
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard label="Total Hours"      value={summary.totalHours} unit="h" iconBg="#DBEAFE" iconColor="#2563EB" icon="⏱" />
        <KpiCard label="Billable Hours"   value={summary.billableHours} unit="h" iconBg="#DCFCE7" iconColor="#16A34A" icon="💰" />
        <KpiCard label="Non-Billable Hrs" value={summary.nonBillableHours} unit="h" iconBg="#FEF3C7" iconColor="#D97706" icon="📋" />
        <KpiCard label="Pending Approval" value={summary.pendingCount} unit="" iconBg="#FEE2E2" iconColor="#DC2626" icon="⚠" />
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <input
          placeholder="Search employee, project or task..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280, height: 38, padding: '0 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' }}
        />
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(15,23,42,.05)', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', whiteSpace:'nowrap' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #E5E7EB' }}>
                {['Employee','Project','Date','Hours','Billable','Approval Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap', background:'#FAFAFA' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding:'20px', textAlign:'center', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>Loading timesheets...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding:'20px', textAlign:'center', fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>No timesheet entries found</td></tr>
              )}
              {!loading && rows.map((r, i) => {
                const av = AVATAR[i % AVATAR.length];
                return (
                  <tr key={r.id} style={{ height:56, borderBottom:'1px solid #F3F4F6' }}>
                    <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:av.bg, color:av.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{getInitials(r.employee_name)}</div>
                        <span style={{ fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>{r.employee_name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'0 14px', fontSize:13, color:'#374151', whiteSpace:'nowrap' }}>{r.project_name || '—'}</td>
                    <td style={{ padding:'0 14px', fontSize:13, color:'#374151', whiteSpace:'nowrap' }}>{formatDate(r.log_date)}</td>
                    <td style={{ padding:'0 14px', fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap' }}>{r.hours}h</td>
                    <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background: r.billable==='Billable'?'#DCFCE7':'#F3F4F6', color: r.billable==='Billable'?'#15803D':'#6B7280', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{r.billable}</span>
                    </td>
                    <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:STATUS_S[r.status]?.bg || '#F3F4F6', color:STATUS_S[r.status]?.color || '#6B7280', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{r.status}</span>
                    </td>
                    <td style={{ padding:'0 14px', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission(null, null, 'projects', 'timesheets', 'edit') && (
                          <button onClick={() => openEdit(r)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#2563EB',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Edit2 size={13}/></button>
                        )}
                        {hasPermission(null, null, 'projects', 'timesheets', 'delete') && (
                          <button onClick={() => handleDelete(r)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:'#DC2626',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Trash2 size={13}/></button>
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
    </div>
  );
}