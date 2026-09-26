import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Clock, CheckCircle, Clock4, ShieldCheck, Check, X, Eye, Plus, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { apiFetch } from '../../lib/api';
import { getAvatarUrl } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { canCreate, canEdit } from '../../lib/permissions';

const trendData = [
  { name: 'Jan', used: 12, earned: 15 },
  { name: 'Feb', used: 18, earned: 12 },
  { name: 'Mar', used: 25, earned: 20 },
  { name: 'Apr', used: 10, earned: 25 },
  { name: 'May', used: 14, earned: 22 },
  { name: 'Jun', used: 16, earned: 18 },
  { name: 'Jul', used: 12, earned: 20 },
  { name: 'Aug', used: 8, earned: 16 }
];

export default function CompOff() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [compOffList, setCompOffList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState([]);
  const [userCompBalance, setUserCompBalance] = useState('0h 00m');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  // Permissions state
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [userPermissions, setUserPermissions] = useState(null);

  const getAuthUser = () => {
    try {
      const authRaw = localStorage.getItem('hrms_auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed) {
          const role = (parsed.role || parsed.user?.role || localStorage.getItem('userRole') || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
          const empId = parsed.user?.employee_id || parsed.user?.employeeId || parsed.user?.id || parsed.employeeId;
          const name = parsed.user?.name || parsed.name || localStorage.getItem('userName') || 'Employee';
          const code = parsed.user?.employee_code || parsed.user?.employeeCode || parsed.user?.emp_id;
          return { role, empId: empId ? Number(empId) : null, name, code, raw: parsed };
        }
      }
    } catch (e) { }
    return { role: 'EMPLOYEE', empId: null, name: 'Employee', code: null, raw: null };
  };

  const authUser = getAuthUser();
  const isEmployee = !['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'TEAMLEADER', 'TEAMLEAD'].includes(userRole.toUpperCase().replace(/[\s_-]+/g, ''));
  const canApprove = ['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'TEAMLEADER', 'TEAMLEAD'].includes(userRole.toUpperCase().replace(/[\s_-]+/g, ''));

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const auth = localStorage.getItem('hrms_auth');
        if (auth) {
          const parsed = JSON.parse(auth);
          setUserRole(parsed.role || (parsed.user && parsed.user.role) || 'EMPLOYEE');
        }
        const data = await apiFetch('/rbac/user-permissions');
        if (data && data.success && data.permissions) {
          setUserPermissions(data.permissions);
        }
      } catch (err) { }
    };
    fetchPerms();
  }, []);

  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    department: 'Engineering',
    workedDate: new Date().toISOString().split('T')[0],
    earnedDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalDays: '1',
    reason: '',
    reportingManager: 'Management',
    status: 'Pending'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Comp Off records (scoped on backend)
      const list = await apiFetch('/leaves/comp-off');
      if (Array.isArray(list)) setCompOffList(list);

      // 2. Fetch Active Employees
      const emps = await apiFetch('/employees?status=Active');
      if (Array.isArray(emps)) {
        setEmployees(emps);
      }

      // 3. Fetch Balances
      const balRes = await apiFetch('/leaves/all-balances');
      if (balRes && balRes.records) {
        setBalanceSummary(balRes.records);
        const myBal = balRes.records.find(r => r.id === authUser.empId);
        if (myBal) {
          setUserCompBalance(`${Math.round(myBal.comp * 8)}h 00m`);
        } else if (balRes.summary && balRes.summary.comp) {
          setUserCompBalance(balRes.summary.comp);
        }
      }
    } catch (e) {
      console.error("Failed to load comp off data:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    let initEmpId = '';
    let initEmpName = '';
    let initDept = 'Engineering';

    if (isEmployee) {
      initEmpId = authUser.empId;
      initEmpName = authUser.name;
      const empObj = employees.find(e => e.id === authUser.empId || e.name === authUser.name);
      if (empObj) initDept = empObj.dept_name || 'Engineering';
    } else if (employees.length > 0) {
      initEmpId = employees[0].id;
      initEmpName = employees[0].name;
      initDept = employees[0].dept_name || 'Engineering';
    }

    setFormData({
      employee_id: initEmpId,
      employee_name: initEmpName,
      department: initDept,
      workedDate: new Date().toISOString().split('T')[0],
      earnedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalDays: '1',
      reason: '',
      reportingManager: 'Management',
      status: 'Pending'
    });
    setFormError('');
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!canApprove) {
      addToast("Forbidden: You do not have permission to approve comp-off requests", "error");
      return;
    }
    // Optimistic UI update
    setCompOffList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus, approved_by: authUser.name || 'Management' } : item));
    try {
      const res = await apiFetch(`/leaves/comp-off/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, approved_by: authUser.name || 'Management' })
      });
      if (res && res.success) {
        addToast(`Comp Off status updated to ${newStatus}`, "success");
      } else {
        addToast((res && (res.message || res.error)) || "Failed to update status", "error");
      }
      loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
      loadData();
    }
  };

  const handleCreateCompOff = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.workedDate) {
      setFormError("Worked date is required.");
      return;
    }
    if (!formData.totalDays || parseFloat(formData.totalDays) <= 0) {
      setFormError("Earned days must be greater than 0.");
      return;
    }
    if (!formData.reason || !formData.reason.trim()) {
      setFormError("Reason is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await apiFetch('/leaves/comp-off', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: formData.employee_id,
          worked_date: formData.workedDate,
          earned_date: formData.earnedDate,
          expiry_date: formData.expiryDate,
          total_days: formData.totalDays,
          reason: formData.reason.trim(),
          status: 'Pending'
        })
      });

      if (res && res.success) {
        addToast("Comp Off request created successfully!", "success");
        setShowModal(false);
        loadData();
      } else {
        const errMsg = (res && (res.message || res.error)) || "Failed to create comp off request";
        setFormError(errMsg);
        addToast(errMsg, "error");
      }
    } catch (err) {
      console.error("Failed to create comp off:", err);
      setFormError("Failed to create comp off request");
      addToast("Failed to create comp off request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#ecfdf5', color: '#10b981' };
      case 'Pending': return { bg: '#fffbeb', color: '#f59e0b' };
      case 'Rejected': return { bg: '#fef2f2', color: '#ef4444' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  // Filter list
  const filteredList = compOffList.filter(item => {
    const nameMatch = (item.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'All Status' || item.status === statusFilter;
    const deptMatch = deptFilter === 'All Departments' || item.dept === deptFilter;
    return nameMatch && statusMatch && deptMatch;
  });

  // Calculate dynamic KPIs
  const pendingCount = compOffList.filter(c => c.status === 'Pending').length;
  const approvedCount = compOffList.filter(c => c.status === 'Approved').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Compensatory Off Management</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Track overtime credits, compensatory leave accruals, and approvals</p>
        </div>
        {canCreate('leave', 'comp_off') && (
          <button
            onClick={handleOpenModal}
            style={{
              background: '#2563EB', color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} /> Request Comp Off
          </button>
        )}
      </div>

      {/* Dynamic KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        {[
          { title: isEmployee ? 'My Available Comp Off' : 'Total Available Comp Off', subtitle: isEmployee ? 'Your Balance' : 'Company Wide', value: userCompBalance, icon: <ShieldCheck size={20} color="#2563EB" />, bg: '#EEF2FF' },
          { title: 'Pending Requests', subtitle: 'Awaiting Action', value: String(pendingCount), icon: <Clock size={20} color="#EF4444" />, bg: '#FEF2F2' },
          { title: 'Approved Requests', subtitle: 'Credited', value: String(approvedCount), icon: <CheckCircle size={20} color="#F59E0B" />, bg: '#FFFBEB' },
          { title: 'Total Applications', subtitle: 'All Time', value: String(compOffList.length), icon: <Clock4 size={20} color="#10B981" />, bg: '#ECFDF5' }
        ].map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{kpi.subtitle}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>

        {/* Main Left Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                {isEmployee ? 'My Comp Off Requests' : 'Recent Comp Off Requests'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <AppDropdown value={deptFilter} options={[{ value: 'All Departments', label: 'All Departments' }, { value: 'Human Resources', label: 'Human Resources' }, { value: 'Engineering', label: 'Engineering' }]} size="sm" />
                <AppDropdown value={statusFilter} options={[{ value: 'All Status', label: 'All Status' }, { value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }]} size="sm" />
                <div style={{ position: 'relative', width: '200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Worked Date</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Overtime</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Earned</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Reason</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Approved By</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading comp off requests...</td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No comp off requests found.</td>
                    </tr>
                  ) : (
                    filteredList.map((req) => {
                      const statusStyle = getStatusStyle(req.status);
                      return (
                        <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={getAvatarUrl(req.avatar, req.employee_name, req.employee_id || req.id)}
                                alt={req.employee_name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block' }}>{req.employee_name}</span>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{req.dept || 'Staff'}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                            {req.worked_date ? new Date(req.worked_date).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{req.overtime_hours}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>{req.earned_days}</td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{req.reason || '—'}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{req.approved_by || '—'}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              {canApprove ? (
                                <>
                                  {req.status === 'Pending' && (
                                    <>
                                      <button
                                        title="Approve"
                                        onClick={() => handleUpdateStatus(req.id, 'Approved')}
                                        style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', cursor: 'pointer', color: '#10b981', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Check size={14} /> Approve
                                      </button>
                                      <button
                                        title="Reject"
                                        onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                                        style={{ background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <X size={14} /> Reject
                                      </button>
                                    </>
                                  )}
                                  {req.status !== 'Pending' && (
                                    <button
                                      title="Reset Status"
                                      onClick={() => handleUpdateStatus(req.id, 'Pending')}
                                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}
                                    >
                                      Reset
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Area */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Comp Off Utilization Trend</h3>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="earned" name="Earned Days" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="used" name="Used Days" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
              {isEmployee ? 'My Leave Summary' : 'Employee Balances'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(balanceSummary.length > 0 ? balanceSummary.slice(0, 5) : employees.slice(0, 5)).map((emp, idx) => {
                const compHours = emp.comp !== undefined ? `${Math.round(emp.comp * 8)}h` : '8h';
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{emp.name}</span>
                      <span style={{ color: '#2563EB', fontWeight: '600' }}>{compHours} Comp Available</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(15, (emp.comp || 1) * 10))}%`, height: '100%', background: '#2563EB', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Add Comp Off Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>

            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '20px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'grid', placeItems: 'center', placeContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', flexShrink: 0, lineHeight: 0, padding: 0 }}>
                  <Award size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Request Comp Off
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Submit a request to credit compensatory off hours
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', placeContent: 'center', cursor: 'pointer', zIndex: 1, transition: 'all 0.2s', flexShrink: 0, marginLeft: 'auto', lineHeight: 0, padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            <form onSubmit={handleCreateCompOff} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              {isEmployee ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Employee <span style={{ color: '#64748B', fontWeight: '400' }}>[Read Only]</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.employee_name || authUser.name}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, background: '#F8FAFC', color: '#1E293B', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Employee ID <span style={{ color: '#64748B', fontWeight: '400' }}>[Read Only]</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={authUser.employee_code || authUser.code || (formData.employee_id ? `EMP${String(formData.employee_id).padStart(4, '0')}` : '')}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, background: '#F8FAFC', color: '#64748B', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Employee *</label>
                  <AppDropdown
                    value={formData.employee_id}
                    onChange={val => {
                      const sel = employees.find(e => e.id === val);
                      setFormData(prev => ({ ...prev, employee_id: val, employee_name: sel ? sel.name : '' }));
                    }}
                    options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.employee_code || e.emp_code || (e.id ? `EMP${String(e.id).padStart(4, '0')}` : '')})` }))}
                    size="sm"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Worked Date *</label>
                  <input type="date" required value={formData.workedDate} onChange={e => setFormData({ ...formData, workedDate: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Earned Days *</label>
                  <input type="number" step="0.5" min="0.5" max="10" required value={formData.totalDays} onChange={e => setFormData({ ...formData, totalDays: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Reason *</label>
                <textarea rows="3" required value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for compensatory off (e.g. Weekend sprint deployment support)..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              {formError && (
                <div style={{ color: '#EF4444', fontSize: '12px', fontWeight: '600', background: '#FEF2F2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: isSubmitting ? '#94A3B8' : '#2563EB', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Save Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
