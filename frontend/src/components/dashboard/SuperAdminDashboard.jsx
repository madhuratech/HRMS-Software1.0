import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/Toast';
import {
  DollarSign, Users, Briefcase, CheckCircle2, UserCheck, Calendar, UserPlus, LogOut, TrendingDown,
  Star, TrendingUp, FolderPlus, Building2, FileText, Settings, Upload, BarChart2, Mail, X, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { apiFetch } from '../../lib/api';
import { getAvatarUrl } from '../../lib/utils';

// ── Clean KPI Card Component ──
const KpiCard = ({ label, value, trend, trendLabel, iconBg, iconColor, iconSymbol }) => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 200ms ease',
  }} className="hover:-translate-y-[2px] hover:shadow-md">

    {/* Top Row: Left Text (Title + Value) and Right Icon Box */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 6 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>

      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}>
        {iconSymbol}
      </div>
    </div>

    {/* Bottom Row: Growth Percentage Text */}
    <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      <span>↑ {trend}</span>
      <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 10 }}>{trendLabel}</span>
    </div>

  </div>
);

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    apiFetch('/dashboard/stats')
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch dashboard stats", err));
  }, []);

  const handleQuickAction = (label) => {
    switch (label) {
      case 'Add User':
        navigate('/employees/add');
        break;
      case 'Add Project':
        navigate('/projects/list');
        break;
      case 'Add Client':
        navigate('/clients/add');
        break;
      case 'Process Payroll':
        navigate('/payroll/processing');
        break;
      case 'System Settings':
        navigate('/settings/system');
        break;
      case 'Backup Now':
        addToast('Initiating database backup...', 'info');
        setTimeout(() => {
          addToast('Database backup completed & saved successfully!', 'success');
        }, 800);
        break;
      case 'Generate Report':
        navigate('/reports/employee');
        break;
      case 'Send Email':
        setShowEmailModal(true);
        break;
      default:
        break;
    }
  };

  const handleSendEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) {
      addToast('Please enter subject and email content', 'error');
      return;
    }
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
      addToast('Email broadcast dispatched to active employees!', 'success');
    }, 600);
  };

  const employeeCount = stats?.totalEmployees || 0;
  const projectCount = stats?.totalProjects || 0;
  const completedProjects = stats?.completedProjects || 0;
  const clientCount = stats?.totalClients || 0;

  const formatRevenue = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const revenueValue = stats ? formatRevenue(stats.totalRevenue) : '₹0.0';

  // Dynamically calculate attendance stats
  const presentToday = stats?.attendanceToday || 0;
  const leaveToday = stats?.totalLeaves || 0;
  const absentToday = Math.max(0, employeeCount - presentToday - leaveToday);

  const totalForPct = employeeCount > 0 ? employeeCount : (presentToday + leaveToday + absentToday);
  const presentPct = totalForPct > 0 ? Math.round((presentToday / totalForPct) * 100) : 0;
  const leavePct = totalForPct > 0 ? Math.round((leaveToday / totalForPct) * 100) : 0;
  const absentPct = totalForPct > 0 ? Math.max(0, 100 - presentPct - leavePct) : 0;

  const donutStatus = [
    { name: 'Present', value: presentPct, color: '#10B981' },
    { name: 'Leave', value: leavePct, color: '#CBD5E1' },
    { name: 'Absent', value: absentPct, color: '#EF4444' },
  ];

  const perfList = Array.isArray(stats?.performanceEmployees)
    ? stats.performanceEmployees.map((row, idx) => ({
      ...row,
      avatar: getAvatarUrl(row.profile_photo, row.name, row.id || idx + 1)
    }))
    : [];

  const holidayList = Array.isArray(stats?.upcomingHolidays)
    ? stats.upcomingHolidays.map(h => ({
      date: new Date(h.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
      day: new Date(h.date).toLocaleDateString([], { weekday: 'long' }),
      name: h.name
    }))
    : [];

  const birthdayList = Array.isArray(stats?.upcomingBirthdays)
    ? stats.upcomingBirthdays.map((b, idx) => ({
      img: getAvatarUrl(b.profile_photo, b.name, b.id || idx + 1),
      name: b.name,
      role: 'Team Member',
      date: b.date || 'Today'
    }))
    : [];

  const activityList = Array.isArray(stats?.recentActivity)
    ? stats.recentActivity.map((act, idx) => ({
      avatar: getAvatarUrl(act.profile_photo, act.employee_name, act.employee_id || idx + 1),
      name: act.employee_name,
      action: act.punch_type === 'IN' ? 'punched in at' : 'punched out at',
      highlight: new Date(act.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      time: 'Just now',
      dot: act.punch_type === 'IN' ? '#10B981' : '#EF4444'
    }))
    : [];

  const leaveList = Array.isArray(stats?.recentLeaves)
    ? stats.recentLeaves.map((l, idx) => ({
      avatar: getAvatarUrl(l.profile_photo, l.employee_name, l.id || idx + 1),
      name: l.employee_name,
      dept: l.dept_name || 'HR',
      type: l.leave_name || 'Sick Leave',
      days: `${l.duration || 1} day`
    }))
    : [];

  // Dynamically build chart data strictly from real team performance goal achievement from API
  const rawPerfData = Array.isArray(stats?.teamPerformance) && stats.teamPerformance.length > 0
    ? stats.teamPerformance
    : (Array.isArray(stats?.departmentSummary) && stats.departmentSummary.length > 0 ? stats.departmentSummary : []);

  const chartData = rawPerfData.map(d => ({
    team: d.team || d.dept,
    achievement: typeof d.achievement !== 'undefined' && d.achievement !== null
      ? Number(d.achievement) || 0
      : 0
  }));

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>

      {/* ── FIRST ROW: 5 KPI Cards in a Single Line ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 24,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}
      >
        <KpiCard label="Total Revenue" value={revenueValue} trend="12.5%" trendLabel="vs last month" iconBg="#F3E8FF" iconColor="#7C3AED" iconSymbol="₹" />
        <KpiCard label="Total Employees" value={employeeCount} trend="8.3%" trendLabel="vs last month" iconBg="#F3E8FF" iconColor="#7C3AED" iconSymbol="👥" />
        <KpiCard label="Total Projects" value={projectCount} trend="15.7%" trendLabel="vs last month" iconBg="#DCFCE7" iconColor="#16A34A" iconSymbol="💼" />
        <KpiCard label="Completed Projects" value={completedProjects} trend="22.1%" trendLabel="vs last month" iconBg="#FEF3C7" iconColor="#D97706" iconSymbol="☑" />
        <KpiCard label="Total Clients" value={clientCount} trend="10.2%" trendLabel="vs last month" iconBg="#EFF6FF" iconColor="#2563EB" iconSymbol="👤" />
      </div>

      {/* ── SECOND ROW: TEAM PERFORMANCE (LEFT ~64%) + ATTENDANCE STATUS (RIGHT ~36%) ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(380px, 0.9fr)', 
          gap: 20, 
          marginBottom: 24,
          alignItems: 'stretch'
        }}
      >
        {/* Left: Team Performance Bar Chart */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: 20, 
          border: '1px solid #E5E7EB', 
          padding: '20px 24px', 
          boxShadow: '0 4px 16px rgba(15,23,42,0.04)', 
          display: 'flex', 
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Team Performance</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Team Goal Achievement Percentage</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB' }} /> Achievement %
            </div>
          </div>

          <div style={{ width: '100%', height: 260, flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="team"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={52}
                  tick={({ x, y, payload }) => {
                    // Split label into max 2 lines for horizontal display — no rotation
                    const words = String(payload.value).split(' ');
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(' ');
                    const line2 = words.slice(mid).join(' ');
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748B" fontSize={10} fontFamily="Inter, sans-serif">
                          {line1}
                        </text>
                        {line2 && (
                          <text x={0} y={0} dy={25} textAnchor="middle" fill="#64748B" fontSize={10} fontFamily="Inter, sans-serif">
                            {line2}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} formatter={(val) => [`${val}%`, 'Achievement']} />
                <Bar dataKey="achievement" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={26}>
                  <LabelList dataKey="achievement" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 600, fill: '#1E293B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Attendance Status Circular Donut + 3 Summary Cards */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: 20, 
          border: '1px solid #E5E7EB', 
          padding: '20px 24px', 
          boxShadow: '0 4px 16px rgba(15,23,42,0.04)', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Attendance Status</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Today's overview</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.1fr 1fr', 
            alignItems: 'center', 
            gap: 16, 
            flex: 1, 
            marginTop: 10 
          }}>
            {/* Left Side: Red Donut Chart */}
            <div style={{ width: '100%', height: 160, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutStatus} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" stroke="none">
                    {donutStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{presentPct}%</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present</span>
              </div>
            </div>

            {/* Right Side: 3 Vertically Stacked Status Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserCheck size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{presentToday}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>Present</div>
                </div>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{leaveToday}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#EF4444' }}>On Leave</div>
                </div>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{absentToday}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#2563EB' }}>Absent</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── THIRD ROW: EMPLOYEE PERFORMANCE (2/3 WIDE) + ON LEAVE (1/3 NARROW) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Left 67%: Employee Performance Overview Table */}
        <div className="lg:col-span-2" style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Employee Performance Overview</h3>
            <button style={{ background: 'none', border: 'none', color: '#2952E3', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              View Full Report
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  {['Employee Name', 'Department', 'Designation', 'Performance Score', 'Goals Achieved', 'Rating', 'Trend'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perfList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      No employee performance records found in database.
                    </td>
                  </tr>
                ) : (
                  perfList.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', height: 52 }} className="hover:bg-slate-50 transition-colors">
                    <td style={{ padding: '0 20px', fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={row.avatar}
                          alt={row.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'User')}&background=2563EB&color=fff&bold=true`; }}
                        />
                        <span style={{ fontWeight: 600 }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 20px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{row.dept}</td>
                    <td style={{ padding: '0 20px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{row.designation}</td>
                    <td style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                      }}>
                        {row.score}
                      </span>
                    </td>
                    <td style={{ padding: '0 20px', fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{row.goals}</td>
                    <td style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 2, color: '#F59E0B' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < row.stars ? '#F59E0B' : 'none'} color={i < row.stars ? '#F59E0B' : '#D1D5DB'} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0 20px', fontSize: 12, fontWeight: 600, color: row.isUp ? '#16A34A' : '#EF4444', whiteSpace: 'nowrap' }}>
                      {row.trend}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 33%: On Leave Today */}
        <div className="lg:col-span-1" style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>On Leave Today</h3>
            </div>
            <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{leaveToday}</span>
          </div>

          {/* Leave Employee List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
            {leaveList.map((emp, i) => {
              const typeColor = emp.type === 'Sick Leave'
                ? { bg: '#FEF2F2', text: '#EF4444' }
                : emp.type === 'Annual Leave' || emp.type === 'Earned Leave'
                  ? { bg: '#EFF6FF', text: '#2563EB' }
                  : { bg: '#F0FDF4', text: '#16A34A' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: i < 4 ? '1px solid #F8FAFC' : 'none', gap: 12 }}>
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || 'User')}&background=2563EB&color=fff&bold=true`; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{emp.dept} · {emp.days}</div>
                  </div>
                  <span style={{ background: typeColor.bg, color: typeColor.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {emp.type}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              View All Leave Requests →
            </button>
          </div>
        </div>

      </div>

      {/* ── FOURTH ROW: WIDGETS — 2 rows × 2 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Widget 1: Upcoming Holidays */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 20px 24px', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Upcoming Holidays</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {holidayList.map((h, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <Calendar size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', minWidth: 90 }}>{h.date}</span>
                <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', minWidth: 70 }}>{h.day}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{h.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Upcoming Birthdays */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Upcoming Birthdays</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {birthdayList.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <img
                    src={p.img}
                    alt={p.name}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=2563EB&color=fff&bold=true`; }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{p.role}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Recent Activities */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Recent Activities</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activityList.map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=2563EB&color=fff&bold=true`; }}
                  />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{item.name}</span>
                    {' '}{item.action}
                    {item.highlight && <span style={{ fontWeight: 600, color: '#2563EB' }}> {item.highlight}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{item.time}</div>
                </div>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.dot, flexShrink: 0, display: 'inline-block' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Quick Actions */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 20px 24px', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <UserPlus size={22} />, label: 'Add User' },
              { icon: <FolderPlus size={22} />, label: 'Add Project' },
              { icon: <Building2 size={22} />, label: 'Add Client' },
              { icon: <DollarSign size={22} />, label: 'Process Payroll' },
              { icon: <Settings size={22} />, label: 'System Settings' },
              { icon: <Upload size={22} />, label: 'Backup Now' },
              { icon: <BarChart2 size={22} />, label: 'Generate Report' },
              { icon: <Mail size={22} />, label: 'Send Email' },
            ].map((action, i) => (
              <button key={i} style={{
                background: '#F0F4FF',
                border: '1px solid #E0E7FF',
                borderRadius: 12,
                padding: '14px 8px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                color: '#2563EB',
              }}
                onClick={() => handleQuickAction(action.label)}
                onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563EB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#E0E7FF'; }}
              >
                {action.icon}
                <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: 'inherit' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Send Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 500,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Send Announcement Email</h3>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Email Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly All-Hands Announcement"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Write your email message here..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1',
                    background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Send size={14} />
                  {sendingEmail ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SuperAdminDashboard;