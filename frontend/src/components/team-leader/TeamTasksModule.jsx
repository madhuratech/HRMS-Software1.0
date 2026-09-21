import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Plus, Edit2, Trash2, X, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { usePermissions } from '../../context/PermissionContext';

export function TeamTasksModule() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [metaProjects, setMetaProjects] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: '',
    assignee_id: '',
    priority: 'High',
    dueDate: '',
    status: 'In Progress'
  });

  const loadTasksData = async () => {
    setLoading(true);
    try {
      // 1. Fetch metadata (Employees & Projects)
      const metaRes = await apiFetch('/projects/meta');
      if (metaRes && metaRes.success && metaRes.data) {
        const emps = metaRes.data.employees || [];
        const projs = metaRes.data.projects || [];
        setTeamMembers(emps);
        setMetaProjects(projs);
        if (emps.length > 0 && !form.assignee_id) {
          setForm(prev => ({ ...prev, assignee_id: String(emps[0].id) }));
        }
        if (projs.length > 0 && !form.project_id) {
          setForm(prev => ({ ...prev, project_id: String(projs[0].id) }));
        }
      }

      // 2. Fetch Tasks from Database
      const tasksRes = await apiFetch('/tasks');
      if (tasksRes && tasksRes.success && tasksRes.data && Array.isArray(tasksRes.data.tasks)) {
        const formatted = tasksRes.data.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          project: t.project_name || 'HRMS',
          assignee: t.assignee_name || t.assignee || 'Team Member',
          priority: t.priority || 'High',
          dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : '30 Aug 2026',
          status: t.status || 'In Progress'
        }));
        setTasks(formatted);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to load tasks database records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      project_id: metaProjects.length > 0 ? String(metaProjects[0].id) : '1',
      assignee_id: teamMembers.length > 0 ? String(teamMembers[0].id) : '1',
      priority: 'High',
      dueDate: '',
      status: 'In Progress'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || '',
      project_id: '1',
      assignee_id: '1',
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete task record from database?')) return;
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        project_id: parseInt(form.project_id) || 1,
        assignee_id: parseInt(form.assignee_id) || 1,
        priority: form.priority,
        due_date: form.dueDate || new Date().toISOString().split('T')[0],
        status: form.status
      };

      if (editingTask) {
        await apiFetch(`/tasks/${editingTask.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }

      setShowModal(false);
      loadTasksData();
    } catch (err) {
      console.error("Error saving task to database:", err);
      setShowModal(false);
    }
  };

  const filtered = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB'
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm font-semibold text-slate-600">Loading database team tasks...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6">

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(37,99,235,0.25)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Team Tasks</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#DBEAFE' }}>
            Task Assignment for Software Development Team
          </p>
        </div>
        {canCreate('projects', 'tasks') && (
          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>

      {/* Table & Controls Card */}
      <div style={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks or assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none"
            />
          </div>
          <div className="w-44">
            <AppDropdown
                value={statusFilter}
                onChange={v => setStatusFilter(v)}
                options={[{value:'All',label:'All Statuses'},{value:'Pending',label:'Pending'},{value:'In Progress',label:'In Progress'},{value:'Completed',label:'Completed'}]}
                size="sm"
              />
          </div>
        </div>

        {/* Task Table */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
            <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
            No tasks found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assigned Employee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  {(canEdit('projects', 'tasks') || canDelete('projects', 'tasks')) && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-bold">{t.title}</strong>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs block">{t.description}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{t.project}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.assignee}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        t.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{t.dueDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    {(canEdit('projects', 'tasks') || canDelete('projects', 'tasks')) && (
                      <td className="py-3 px-4 text-right space-x-2">
                        {canEdit('projects', 'tasks') && (
                          <button onClick={() => handleOpenEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={15} />
                          </button>
                        )}
                        {canDelete('projects', 'tasks') && (
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (editingTask ? canEdit('projects', 'tasks') : canCreate('projects', 'tasks')) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 520,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">{editingTask ? 'Edit Task Details' : 'Create & Assign Task'}</h3>
                <p className="text-xs text-slate-500">Database synchronized team task</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project *</label>
                  <AppDropdown value={form.project_id} options={[, ...(metaProjects || [])]} size="sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Employee *</label>
                  <AppDropdown value={form.assignee_id} options={[, ...(teamMembers || [])]} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <AppDropdown
                value={form.priority}
                onChange={v => setForm({ ...form, priority: v })}
                options={[{value:'High',label:'High'},{value:'Medium',label:'Medium'},{value:'Low',label:'Low'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <AppDropdown
                value={form.status}
                onChange={v => setForm({ ...form, status: v })}
                options={[{value:'Pending',label:'Pending'},{value:'In Progress',label:'In Progress'},{value:'Completed',label:'Completed'}]}
                size="sm"
              />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamTasksModule;
