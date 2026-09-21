import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Check, X, Clock, CheckCircle, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canEdit, showPermissionDenied } from '../../lib/permissions';

export default function LeaveApproval() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permissions state
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [userPermissions, setUserPermissions] = useState(null);

  // Statistics KPI
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

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

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/leaves/applications');
      if (Array.isArray(data)) {
        setApplications(data);
        
        // Calculate status counts
        const pending = data.filter(a => a.status === 'Pending').length;
        const approved = data.filter(a => a.status === 'Approved').length;
        const rejected = data.filter(a => a.status === 'Rejected').length;
        setStats({ pending, approved, rejected });
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to load approval requests", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const canApproveAction = canEdit(userPermissions, userRole, 'leave', 'leave_approval');

  const handleAction = async (id, newStatus) => {
    if (!canApproveAction) {
      showPermissionDenied("You do not have permission to approve or reject leave applications.");
      return;
    }

    const auth = localStorage.getItem('hrms_auth');
    let managerId = null;
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        const userObj = parsed.user || parsed;
        managerId = userObj.employee_id || userObj.employeeId || userObj.id || null;
      } catch (e) {}
    }

    try {
      const res = await apiFetch(`/leaves/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          approved_by: managerId
        })
      });

      if (res && (res.success || res.message)) {
        addToast(res.message || `Leave application ${newStatus.toLowerCase()} successfully!`, "success");
        loadApplications();
      } else {
        addToast((res && (res.message || res.error)) || "Failed to update application status", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update application status", "error");
    }
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB',
  };

  const getPriorityStyle = (priority) => {
    return priority === 'High' ? { color: '#ef4444', bg: '#fef2f2' } : { color: '#64748b', bg: '#f1f5f9' };
  };

  // Only show pending for approval actions
  const pendingRequests = applications.filter(app => {
    const matchName = (app.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      `EMP${String(app.employee_id).padStart(3,'0')}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName && app.status === 'Pending';
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        {[
          { title: 'Pending Approval', value: stats.pending, icon: <Clock size={20} color="#F59E0B" />, bg: '#FFFBEB' },
          { title: 'Approved Total', value: stats.approved, icon: <CheckCircle size={20} color="#10B981" />, bg: '#ECFDF5' },
          { title: 'Rejected Total', value: stats.rejected, icon: <XCircle size={20} color="#EF4444" />, bg: '#FEF2F2' },
          { title: 'Escalated Requests', value: '1', icon: <AlertCircle size={20} color="#8B5CF6" />, bg: '#F5F3FF' }
        ].map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{kpi.value}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
        
        {/* Main Table Area */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <AppDropdown value={deptFilter} onChange={(val) => setDeptFilter(val)} options={[{value:'All Departments',label:'All Departments'},{value:'Design',label:'Design'},{value:'Engineering',label:'Engineering'}]} size="sm" />
              <div style={{ position: 'relative', width: '240px' }}>
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

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Employee</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Leave Type</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Duration</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Applied On</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Priority</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading approvals...</td>
                  </tr>
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No pending approval requests.</td>
                  </tr>
                ) : (
                  pendingRequests.map((app) => {
                    const s = new Date(app.start_date);
                    const e = new Date(app.end_date);
                    const days = isNaN(s) || isNaN(e) ? 1 : Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
                    const duration = `${days} Day${days > 1 ? 's' : ''}`;
                    const pStyle = getPriorityStyle(app.priority || 'Normal');
                    
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.employee_name || 'User')}&background=f1f5f9&color=64748b`} alt={app.employee_name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{app.employee_name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>EMP{String(app.employee_id).padStart(3,'0')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{app.leave_code || app.leave_name || 'CL'}</td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>{duration}</td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>{new Date(app.applied_on || new Date()).toLocaleDateString()}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', backgroundColor: pStyle.bg, color: pStyle.color }}>
                            {app.priority || 'Normal'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {canApproveAction ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button 
                                onClick={() => handleAction(app.id, 'Approved')}
                                style={{ background: '#ecfdf5', border: 'none', cursor: 'pointer', color: '#10b981', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleAction(app.id, 'Rejected')}
                                style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={12} /> View Only
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Approval Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  <span>Approval Rate</span>
                  <span style={{ fontWeight: '600' }}>85%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  <span>SLA Met</span>
                  <span style={{ fontWeight: '600' }}>92%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', background: '#2952E3', borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
