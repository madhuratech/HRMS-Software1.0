import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit, canDelete } from '../../lib/permissions';
import { 
  Search, ChevronDown, Plus, Eye, FileText, Clock, CheckCircle, 
  AlertCircle, ArrowUpRight, ArrowDownRight, X, Trash2, Edit2, Loader2, RefreshCw, Filter
} from 'lucide-react';

const KpiCard = ({ label, value, subtext, isPositive, iconBg, iconColor, icon: Icon }) => (
  <div style={{
    background: '#FFF',
    borderRadius: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(15,23,42,.04)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '1 1 0',
    minWidth: 0,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: iconBg, color: iconColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</span>
        {subtext && (
          <span style={{ fontSize: 10, fontWeight: 600, color: isPositive ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {subtext}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function HelpDeskTickets() {
  const { addToast } = useToast();
  const [ticketsList, setTicketsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectTicket, setInspectTicket] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    employee: '',
    department: '',
    category: '',
    priority: 'Medium',
    assignedTo: '',
    description: '',
    status: 'Open'
  });

  const loadMetadata = async () => {
    try {
      const [cats, priors, emps, depts] = await Promise.all([
        apiFetch('/tickets/categories').catch(() => []),
        apiFetch('/tickets/priorities').catch(() => []),
        apiFetch('/employees?status=Active').catch(() => apiFetch('/employees').catch(() => [])),
        apiFetch('/employees/lookup/departments').catch(() => apiFetch('/organization/departments').catch(() => []))
      ]);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(priors)) setPriorities(priors);
      if (Array.isArray(emps)) setEmployees(emps);
      if (Array.isArray(depts)) setDepartments(depts);
    } catch (e) {
      console.error("Failed to load metadata:", e);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'All Categories' && selectedCategory !== 'All Departments') {
        queryParams.push(`category=${encodeURIComponent(selectedCategory)}`);
      }
      if (selectedStatus && selectedStatus !== 'All' && selectedStatus !== 'All Status') {
        queryParams.push(`status=${encodeURIComponent(selectedStatus)}`);
      }
      const qStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await apiFetch(`/tickets${qStr}`);
      if (Array.isArray(data)) {
        setTicketsList(data);
      }
    } catch (e) {
      console.error("Failed to load tickets:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [searchTerm, selectedCategory, selectedStatus]);

  const handleEmployeeChange = (empName) => {
    const selectedEmp = employees.find(e => e.name === empName);
    const empDept = selectedEmp ? (selectedEmp.dept_name || selectedEmp.department || '') : '';
    setFormData(prev => ({
      ...prev,
      employee: empName,
      department: empDept || prev.department
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category) return;
    setIsSubmitting(true);
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: formData.title.trim(),
          category: formData.category,
          priority: formData.priority || 'Medium',
          requester: formData.employee || 'Admin',
          department: formData.department || 'General',
          description: formData.description,
          assigned_to: formData.assignedTo || 'Helpdesk Support'
        })
      });
      await loadTickets();
      setShowAddModal(false);
      setFormData({ title: '', employee: '', department: '', category: '', priority: 'Medium', assignedTo: '', description: '', status: 'Open' });
      addToast('Support ticket created successfully!', 'success');
    } catch (err) {
      console.error("Failed to create ticket:", err);
      addToast(err.message || "Failed to create ticket", 'error');
    }
    setIsSubmitting(false);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setStatusUpdating(true);
    try {
      await apiFetch(`/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await loadTickets();
      if (inspectTicket && (inspectTicket.id === ticketId || inspectTicket.db_id === ticketId)) {
        setInspectTicket({ ...inspectTicket, status: newStatus });
      }
      addToast(`Ticket status updated to "${newStatus}"`, 'success');
    } catch (err) {
      console.error("Failed to update status:", err);
      addToast(err.message || "Failed to update ticket status", 'error');
    }
    setStatusUpdating(false);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await apiFetch(`/tickets/${ticketId}`, { method: 'DELETE' });
      await loadTickets();
      if (inspectTicket && (inspectTicket.id === ticketId || inspectTicket.db_id === ticketId)) {
        setInspectTicket(null);
      }
      addToast('Ticket deleted successfully', 'success');
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      addToast(err.message || "Failed to delete ticket", 'error');
    }
  };

  // Dynamic KPI calculations from active tickets list
  const totalCount = ticketsList.length;
  const openCount = ticketsList.filter(t => t.status === 'Open').length;
  const inProgressCount = ticketsList.filter(t => t.status === 'In Progress').length;
  const pendingCount = ticketsList.filter(t => t.status === 'Pending').length;
  const resolvedCount = ticketsList.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Pagination calculation
  const totalPages = Math.ceil(ticketsList.length / itemsPerPage) || 1;
  const paginatedTickets = ticketsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    ...categories.map(c => ({ value: c.name, label: c.name }))
  ];

  const statusOptions = [
    { value: 'All', label: 'All Status' },
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  // Options for Form Dropdowns
  const formCategoryOptions = categories.length > 0
    ? categories.map(c => ({ value: c.name, label: c.name }))
    : [
        { value: 'IT Support', label: 'IT Support' },
        { value: 'HR Support', label: 'HR Support' },
        { value: 'Payroll', label: 'Payroll' },
        { value: 'Facilities & Assets', label: 'Facilities & Assets' }
      ];

  const formPriorityOptions = priorities.length > 0
    ? priorities.map(p => ({ value: p.name, label: p.name }))
    : [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Urgent', label: 'Urgent' }
      ];

  const formEmployeeOptions = employees.map(emp => {
    const code = emp.employee_id || (emp.id ? `EMP${String(emp.id).padStart(3, '0')}` : '');
    const dept = emp.dept_name || emp.department || '';
    return {
      value: emp.name,
      label: emp.name,
      sublabel: `${code}${code && dept ? ' • ' : ''}${dept}`,
      avatar: emp.profile_photo || null
    };
  });

  const formDepartmentOptions = departments.map(d => {
    const deptName = typeof d === 'string' ? d : (d.dept_name || d.name || '');
    return {
      value: deptName,
      label: deptName
    };
  });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Tickets</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage and track all support tickets with live status workflows</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets..."
              style={{
                height: 38, paddingLeft: 34, paddingRight: 14,
                background: '#FFF', border: '1px solid #E5E7EB',
                borderRadius: 8, fontSize: 13, color: '#111827',
                outline: 'none', width: 200,
              }}
            />
          </div>

          {/* Dynamic Category Dropdown */}
          <div style={{ minWidth: 160 }}>
            <AppDropdown 
              value={selectedCategory}
              onChange={v => { setSelectedCategory(v); setCurrentPage(1); }}
              options={categoryOptions.length > 1 ? categoryOptions : [
                { value: 'All', label: 'All Categories' },
                { value: 'IT Support', label: 'IT Support' },
                { value: 'HR Support', label: 'HR Support' },
                { value: 'Payroll', label: 'Payroll' }
              ]} 
              size="sm" 
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: 140 }}>
            <AppDropdown 
              value={selectedStatus}
              onChange={v => { setSelectedStatus(v); setCurrentPage(1); }}
              options={statusOptions} 
              size="sm" 
            />
          </div>

          {/* Primary Action Button */}
          {canCreate('helpdesk', 'support_tickets') && (
            <button onClick={() => setShowAddModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
              background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            }}>
              <Plus size={16} /> New Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── 5 KPI CARDS IN A SINGLE ROW ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%', flexWrap: 'wrap' }}>
        <KpiCard label="Total Tickets" value={totalCount} subtext="Active database" isPositive={true}  iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Open"          value={openCount}   subtext={openCount > 0 ? "Needs triage" : "Clear"}  isPositive={openCount === 0} iconBg="#FEF2F2" iconColor="#EF4444" icon={Clock} />
        <KpiCard label="In Progress"   value={inProgressCount}   subtext="In review"  isPositive={true}  iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Pending"       value={pendingCount}   subtext="Awaiting response"  isPositive={false} iconBg="#EFF6FF" iconColor="#818CF8" icon={AlertCircle} />
        <KpiCard label="Resolved"      value={resolvedCount}   subtext="Closed tickets" isPositive={true}  iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
      </div>

      {/* ── MAIN DATA TABLE: Tickets List ── */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Ticket ID', 'Subject', 'Category', 'Priority', 'Requester', 'Status', 'Created On', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                    <Loader2 className="animate-spin inline-block mr-2" size={18} /> Loading tickets...
                  </td>
                </tr>
              ) : paginatedTickets.length > 0 ? (
                paginatedTickets.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#2563EB', whiteSpace: 'nowrap' }}>{r.id}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>
                      <span title={r.description || r.subject}>{r.subject}</span>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.cat}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: r.priority === 'High' || r.priority === 'Urgent' ? '#FEF2F2' : r.priority === 'Medium' ? '#FEF3C7' : '#F3F4F6',
                        color: r.priority === 'High' || r.priority === 'Urgent' ? '#EF4444' : r.priority === 'Medium' ? '#D97706' : '#6B7280',
                      }}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.requester}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Resolved' || r.status === 'Closed' ? '#ECFDF5' : r.status === 'In Progress' ? '#FEF3C7' : r.status === 'Pending' ? '#EFF6FF' : '#FEF2F2',
                        color: r.status === 'Resolved' || r.status === 'Closed' ? '#059669' : r.status === 'In Progress' ? '#D97706' : r.status === 'Pending' ? '#818CF8' : '#EF4444',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button 
                          onClick={() => setInspectTicket(r)}
                          title="View Ticket Details"
                          style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 4 }}
                        >
                          <Eye size={16} />
                        </button>
                        {canDelete('helpdesk', 'support_tickets') && (
                          <button 
                            onClick={() => handleDeleteTicket(r.id)}
                            title="Delete Ticket"
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No tickets found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Showing {ticketsList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, ticketsList.length)} of {ticketsList.length} entries
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    background: page === currentPage ? '#2563EB' : '#FFF',
                    color: page === currentPage ? '#FFF' : '#374151',
                    fontSize: 12, fontWeight: page === currentPage ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE SUPPORT TICKET MODAL ── */}
      {showAddModal && canCreate('helpdesk', 'support_tickets') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '760px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '22px',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            {/* Header */}
            <div style={{
              position: 'relative',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <FileText size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    Create Support Ticket
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Submit a new help desk support ticket to IT, HR, or Finance coordinators.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Subject / Title <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. VPN Authentication Failure"
                      className="hrms-input"
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        padding: '0 14px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#1E293B',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Category <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <AppDropdown
                      value={formData.category}
                      onChange={v => setFormData({ ...formData, category: v })}
                      options={formCategoryOptions}
                      placeholder="Select Category"
                      size="md"
                      searchable
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Priority
                    </label>
                    <AppDropdown
                      value={formData.priority}
                      onChange={v => setFormData({ ...formData, priority: v })}
                      options={formPriorityOptions}
                      placeholder="Select Priority"
                      size="md"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Requester / Employee Name
                    </label>
                    <AppDropdown
                      value={formData.employee}
                      onChange={handleEmployeeChange}
                      options={formEmployeeOptions}
                      placeholder="Select Employee / Requester"
                      size="md"
                      searchable
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Department
                    </label>
                    <AppDropdown
                      value={formData.department}
                      onChange={v => setFormData({ ...formData, department: v })}
                      options={formDepartmentOptions}
                      placeholder="Select Department"
                      size="md"
                      searchable
                    />
                  </div>

                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                      Description / Issue Details
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide troubleshooting details or context..."
                      className="hrms-input"
                      style={{
                        width: '100%',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#1E293B',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 28px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="hrms-secondary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: '600',
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
                    color: '#475569',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hrms-btn-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 24px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                    color: '#FFF',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TICKET DETAILS & STATUS INSPECTOR MODAL ── */}
      {inspectTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '680px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '22px',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            <div style={{
              position: 'relative',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0
                }}>
                  <Clock size={20} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', color: '#FFF' }}>
                      {inspectTicket.id}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{inspectTicket.date}</span>
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: '700', color: '#FFFFFF' }}>{inspectTicket.subject}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectTicket(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#FFF'
                }}
              >
                <X size={16} color="#FFFFFF" />
              </button>
            </div>

            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Category</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{inspectTicket.cat}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Priority</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{inspectTicket.priority}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Requester</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{inspectTicket.requester}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Department</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{inspectTicket.department || 'General'}</span>
                </div>
              </div>

              {inspectTicket.description && (
                <div>
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Issue Description</label>
                  <div style={{ padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                    {inspectTicket.description}
                  </div>
                </div>
              )}

              <div>
                <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Update Workflow Status</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map(st => (
                    <button
                      key={st}
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(inspectTicket.id, st)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        border: inspectTicket.status === st ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                        background: inspectTicket.status === st ? '#EFF6FF' : '#FFF',
                        color: inspectTicket.status === st ? '#2563EB' : '#475569'
                      }}
                    >
                      {inspectTicket.status === st ? `✓ ${st}` : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 28px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setInspectTicket(null)}
                className="hrms-secondary-btn"
                style={{
                  borderRadius: '10px',
                  padding: '9px 20px',
                  fontWeight: '600',
                  border: '1px solid #CBD5E1',
                  background: '#FFF',
                  color: '#475569',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

