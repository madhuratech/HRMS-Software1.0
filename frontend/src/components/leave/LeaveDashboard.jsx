import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserMinus, Calendar, Clock, Percent, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const trendData = [
  { name: '1 May', casual: 40, sick: 24, privilege: 24, earned: 15 },
  { name: '6 May', casual: 30, sick: 13, privilege: 22, earned: 20 },
  { name: '11 May', casual: 20, sick: 48, privilege: 22, earned: 18 },
  { name: '16 May', casual: 27, sick: 39, privilege: 20, earned: 28 },
  { name: '21 May', casual: 18, sick: 48, privilege: 21, earned: 19 },
  { name: '26 May', casual: 23, sick: 38, privilege: 25, earned: 25 },
  { name: '31 May', casual: 34, sick: 43, privilege: 21, earned: 21 },
];

export default function LeaveDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    onLeaveToday: 0,
    leavesTaken: 0,
    pendingApprovals: 0,
    leaveEncashment: '₹0.00'
  });
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [leaveByDepartment, setLeaveByDepartment] = useState([]);
  const [leaveDistribution, setLeaveDistribution] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/leaves/dashboard-stats');
      if (data.success) {
        setKpis(data.kpis);
        setOnLeaveToday(data.onLeaveToday || []);
        setLeaveByDepartment(data.leaveByDepartment || []);
        setLeaveDistribution(data.leaveDistribution || []);
      }
    } catch (e) {
      console.error("Failed to load leave dashboard stats", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column'
  };

  // Calculate sum of values for pie chart total count display
  const totalDistributionValue = leaveDistribution.reduce((sum, item) => sum + (item.value || 0), 0);

  // Helper colors for badges
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'CL': return { color: '#3b82f6', bg: '#eff6ff' };
      case 'SL': return { color: '#10b981', bg: '#ecfdf5' };
      case 'PL': return { color: '#f59e0b', bg: '#fffbeb' };
      default: return { color: '#8b5cf6', bg: '#f5f3ff' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
        <button style={{ background: '#fff', border: '1px solid #E5E7EB', color: '#475569', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          This Month <ChevronDown size={14} /> <Calendar size={14} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[
          { title: 'Total Employees', value: kpis.totalEmployees, icon: <Users size={20} color="#2952E3" />, bg: '#EEF2FF', border: 'none' },
          { title: 'On Leave Today', value: kpis.onLeaveToday, icon: <UserMinus size={20} color="#2952E3" />, bg: '#EEF2FF', border: 'none' },
          { title: 'Leaves Taken', subtitle: 'This Month', value: kpis.leavesTaken, icon: <Calendar size={20} color="#2952E3" />, bg: '#EEF2FF', border: 'none' },
          { title: 'Pending Approval', value: kpis.pendingApprovals, icon: <Clock size={20} color="#F59E0B" />, bg: '#FFFBEB', border: '1px solid #FCD34D' },
          { title: 'Leave Encashment', subtitle: 'This Month', value: kpis.leaveEncashment, icon: <Calendar size={20} color="#2952E3" />, bg: '#EEF2FF', border: 'none' }
        ].map((kpi, idx) => (
          <div key={idx} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: kpi.border || '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{kpi.title}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', lineHeight: '1' }}>{loading ? '—' : kpi.value}</div>
              {kpi.subtitle && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{kpi.subtitle}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Monthly Leave Trend */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Leave Trend</h3>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} verticalAlign="top" align="center" />
                  <Line type="monotone" dataKey="casual" name="Casual Leave" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sick" name="Sick Leave" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="privilege" name="Privilege Leave" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="earned" name="Earned Leave" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Summary Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Leave by Department</h3>
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Department</th>
                    <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Employees</th>
                    <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Leaves Taken</th>
                    <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>Loading department statistics...</td>
                    </tr>
                  ) : leaveByDepartment.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>No department statistics found.</td>
                    </tr>
                  ) : (
                    leaveByDepartment.map((dept, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{dept.dept}</td>
                        <td style={{ padding: '12px 24px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{dept.emp}</td>
                        <td style={{ padding: '12px 24px', fontSize: '12px', color: '#3b82f6', fontWeight: '600', textAlign: 'center' }}>{dept.taken}</td>
                        <td style={{ padding: '12px 24px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{dept.pending}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Leave Type Distribution */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Leave Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
                {loading || leaveDistribution.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '12px' }}>
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leaveDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                        {leaveDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{totalDistributionValue}</span>
                  <span style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: '1.2' }}>Total Leaves</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {leaveDistribution.map((item, idx) => {
                  const pct = totalDistributionValue > 0 ? (item.value / totalDistributionValue * 100).toFixed(1) : '0.0';
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></div>
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{item.value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today's On Leave */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Today's On Leave</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '12px' }}>Loading...</div>
              ) : onLeaveToday.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                  No employees are on leave today.
                </div>
              ) : (
                onLeaveToday.map((emp, idx) => {
                  const style = getBadgeStyle(emp.type);
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={emp.avatar ? emp.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=f1f5f9&color=64748b`} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.role}</div>
                        </div>
                      </div>
                      <div style={{ padding: '4px 8px', borderRadius: '6px', background: style.bg, color: style.color, fontSize: '10px', fontWeight: '700' }}>
                        {emp.type}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{ fontSize: '12px', color: '#2952E3', fontWeight: '600', cursor: 'pointer' }}>View All</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
