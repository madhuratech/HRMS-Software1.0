import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { User, Calendar, Clock } from 'lucide-react';
import { useToast } from '../ui/Toast';
import EmployeeAvatar from './EmployeeAvatar';
import './employee-module.css';
import { apiFetch } from '../../lib/api';

export default function EmploymentHistory() {
  const { addToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [profileError, setProfileError] = useState(null);

  const authRaw = localStorage.getItem('hrms_auth');
  let userRole = 'SUPER_ADMIN';
  let authUserId = '11';
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw);
      const userObj = parsed.user || parsed;
      if (parsed.role) userRole = parsed.role;
      if (userObj && userObj.id) authUserId = String(userObj.id);
    } catch (e) { }
  }
  const isEmployeeRole = userRole === 'EMPLOYEE';
  const isTeamLeaderRole = userRole === 'TEAM_LEADER' || userRole === 'Team Leader';

  const [currentEmpId, setCurrentEmpId] = useState(() => {
    if (isEmployeeRole) return authUserId;
    return localStorage.getItem('selectedEmployeeId') || authUserId || '1';
  });

  const handleEmployeeSelect = (newId) => {
    if (!newId) return;
    localStorage.setItem('selectedEmployeeId', String(newId));
    setCurrentEmpId(String(newId));
  };

  // Fetch employees list for dropdown
  useEffect(() => {
    if (isEmployeeRole) return;

    if (isTeamLeaderRole) {
      apiFetch('/employees/team-members')
        .then(res => {
          if (res && Array.isArray(res.members)) {
            setAllEmployees(res.members);
          } else if (Array.isArray(res)) {
            setAllEmployees(res);
          }
        })
        .catch(err => console.error("Error fetching team members:", err));
    } else {
      apiFetch('/employees')
        .then(data => {
          if (Array.isArray(data)) setAllEmployees(data);
        })
        .catch(err => console.error("Error fetching all employees:", err));
    }
  }, [isEmployeeRole, isTeamLeaderRole]);

  // Fetch employee profile and history whenever currentEmpId changes
  useEffect(() => {
    if (!currentEmpId) return;
    setLoading(true);
    setProfileError(null);

    apiFetch(`/employees/${currentEmpId}/profile`)
      .then(data => {
        if (data && data.error) {
          setProfileError(data.error);
          setProfile(null);
          setLoading(false);
        } else {
          setProfile(data);
          return apiFetch(`/employees/${currentEmpId}/history`);
        }
      })
      .then(histData => {
        if (Array.isArray(histData)) {
          setHistory(histData);
        } else if (histData && Array.isArray(histData.history)) {
          setHistory(histData.history);
        } else {
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading employment history:", err);
        setProfileError(err.message || "Failed to load employment history.");
        setLoading(false);
      });
  }, [currentEmpId]);

  const dropdownOptions = allEmployees.map(emp => ({
    value: String(emp.id),
    label: `${emp.name} (EMP${String(emp.id).padStart(4, '0')})`
  }));

  if (loading) {
    return (
      <div className="hrms-content flex items-center justify-center min-h-[300px]" style={{ padding: '60px', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="hrms-text-muted hrms-mt-4" style={{ fontSize: '14px' }}>Loading employment history timeline...</p>
      </div>
    );
  }

  return (
    <div className="hrms-content">
      {/* Header */}
      <div className="hrms-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
          Employment History & Timeline
        </h1>

        {/* Wide Employee Selector Dropdown */}
        {!isEmployeeRole && dropdownOptions.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '14px',
            padding: '8px 14px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
            minWidth: '320px'
          }}>
            <User size={18} color="#2563EB" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Employee:
            </span>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <AppDropdown
                value={String(currentEmpId)}
                onChange={(val) => handleEmployeeSelect(val)}
                options={dropdownOptions}
                placeholder="Select Employee..."
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      {profileError && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '14px', marginBottom: '24px' }}>
          {profileError}
        </div>
      )}

      {/* Main Profile Summary & Timeline Card */}
      <div className="hrms-card" style={{
        maxWidth: '850px',
        margin: '0 auto',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05)',
        padding: '24px 32px',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        scrollbarWidth: 'thin'
      }}>
        {/* Profile Details Header Box */}
        {profile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '20px',
            borderRadius: '16px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <EmployeeAvatar
              name={profile.name}
              photoUrl={profile.profilePhoto}
              size={64}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>{profile.name}</h2>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                  {`EMP${String(profile.id).padStart(4, '0')}`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                {profile.roleName || 'Staff'} • {profile.deptName || 'General Department'} • {profile.branchName || 'Head Office'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Joining Date</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        )}

        <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#2563EB" /> Career Milestones & History
        </h3>

        {/* Timeline Component */}
        {history.length === 0 ? (
          <div className="hrms-timeline">
            {profile && (
              <div className="hrms-timeline-item">
                <div className="hrms-timeline-dot" style={{ backgroundColor: '#2563EB', border: '4px solid #FFFFFF', boxShadow: '0 0 0 2px #2563EB' }} />
                <div className="hrms-timeline-content" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div className="hrms-flex-between hrms-mb-4" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#2563EB" />
                      {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Joining'} — Present
                    </span>
                    <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                      Current Assignment
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px 0' }}>
                    {profile.roleName || 'Employee'}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
                    {profile.deptName || 'General'} Department | {profile.branchName || 'Head Office'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Reporting Manager</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{profile.managerName || '—'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Gross Salary</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '700', color: '#059669' }}>
                        INR {profile.salary ? parseFloat(profile.salary).toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hrms-timeline">
            {history.map((item, index) => (
              <div key={item.id || index} className="hrms-timeline-item">
                <div
                  className="hrms-timeline-dot"
                  style={{
                    backgroundColor: index === 0 ? '#2563EB' : '#94A3B8',
                    border: '4px solid #FFFFFF',
                    boxShadow: index === 0 ? '0 0 0 2px #2563EB' : '0 0 0 1px #CBD5E1'
                  }}
                />
                <div
                  className="hrms-timeline-content"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="hrms-flex-between hrms-mb-4" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#2563EB" />
                      {new Date(item.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {index === 0 && (
                      <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        Latest Event
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 10px 0' }}>
                    {item.change_type}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    {item.old_value && (
                      <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#475569' }}>Previous:</span>
                        <span>{item.old_value}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#2563EB' }}>New Value / Details:</span>
                      <span style={{ fontWeight: '600' }}>{item.new_value}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
