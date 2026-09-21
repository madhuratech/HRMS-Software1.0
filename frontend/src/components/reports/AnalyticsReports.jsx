import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Download, Calendar, Filter, ChevronLeft, ChevronRight, ChevronDown, UserCheck, Users, UserX, Clock, DollarSign, Briefcase, Award, FolderKanban } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';

/* ─────────────────── COLOR SYSTEM ─────────────────── */
const PRIMARY = '#2952E3';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER  = '#EF4444';
const NEUTRAL = '#64748B';

/* ─────────────────── KPI CARD COMPONENT ─────────────────── */
const KpiCard = ({ label, value, subtext, up, icon: Icon, iconBg, iconColor }) => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E5E7EB',
    boxShadow: '0 8px 24px rgba(15,23,42,.04)',
    padding: '18px 20px',
    flex: '1 1 0',
    minWidth: 140,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{label}</span>
      {Icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg || '#EFF6FF', color: iconColor || PRIMARY,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} />
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{value}</div>
      {subtext && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12 }}>
          {up !== undefined && (
            <span style={{ fontWeight: 600, color: up ? SUCCESS : DANGER }}>
              {up ? '↑' : '↓'} {subtext.split(' ')[0]}
            </span>
          )}
          <span style={{ color: '#94A3B8' }}>{up !== undefined ? subtext.substring(subtext.indexOf(' ')) : subtext}</span>
        </div>
      )}
    </div>
  </div>
);

/* ─────────────────── TABLE PILL HELPER ─────────────────── */
const Badge = ({ text, type }) => {
  let bg = '#F1F5F9';
  let color = '#475569';
  if (type === 'success' || text === 'Active' || text === 'Present' || text === 'Approved' || text === 'Hired' || text === 'On Track' || text === 'Completed') {
    bg = '#DCFCE7'; color = '#15803D';
  } else if (type === 'warning' || text === 'Leave' || text === 'Late' || text === 'Pending' || text === 'In Progress' || text === 'Meets Expectations') {
    bg = '#FEF3C7'; color = '#D97706';
  } else if (type === 'danger' || text === 'Resigned' || text === 'Absent' || text === 'Rejected' || text === 'Delayed' || text === 'Needs Improvement') {
    bg = '#FEE2E2'; color = '#DC2626';
  } else if (text === 'New Joiners' || text === 'Half Day') {
    bg = '#DBEAFE'; color = '#1D4ED8';
  }

  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      background: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
};

/* ─────────────────── 1. EMPLOYEE REPORTS ─────────────────── */
const EmployeeReportsView = () => {
  const DEPT_PIE = [
    { name: 'Engineering', value: 72, percent: '29.0%', color: PRIMARY },
    { name: 'Human Resources', value: 32, percent: '12.9%', color: SUCCESS },
    { name: 'Sales & Marketing', value: 42, percent: '16.9%', color: WARNING },
    { name: 'Finance', value: 28, percent: '11.3%', color: DANGER },
    { name: 'Operations', value: 36, percent: '14.5%', color: '#8B5CF6' },
    { name: 'Support', value: 38, percent: '15.4%', color: '#06B6D4' },
  ];

  const AGE_BAR = [
    { range: '18-25', count: 28 },
    { range: '26-30', count: 64 },
    { range: '31-35', count: 58 },
    { range: '36-40', count: 42 },
    { range: '41-45', count: 32 },
    { range: '46+', count: 24 },
  ];

  const GENDER_PIE = [
    { name: 'Male', value: 156, percent: '62.9%', color: PRIMARY },
    { name: 'Female', value: 92, percent: '37.1%', color: '#EC4899' },
  ];

  const EMP_SUMMARY = [
    { dept: 'Engineering', total: 72, active: 65, leave: 3, joiners: 5, resigned: 1, age: 31.2, exp: '4.2 Yrs' },
    { dept: 'Human Resources', total: 32, active: 28, leave: 1, joiners: 2, resigned: 0, age: 29.8, exp: '3.6 Yrs' },
    { dept: 'Sales & Marketing', total: 42, active: 36, leave: 2, joiners: 3, resigned: 1, age: 33.1, exp: '4.8 Yrs' },
    { dept: 'Finance', total: 28, active: 25, leave: 1, joiners: 1, resigned: 0, age: 34.5, exp: '5.1 Yrs' },
    { dept: 'Operations', total: 36, active: 31, leave: 2, joiners: 2, resigned: 1, age: 32.3, exp: '4.0 Yrs' },
    { dept: 'Support', total: 38, active: 33, leave: 2, joiners: 3, resigned: 2, age: 28.9, exp: '3.2 Yrs' },
  ];

  const DESIGNATIONS_BAR = [
    { title: 'Software Engineer', count: 45 },
    { title: 'Senior Developer', count: 28 },
    { title: 'HR Manager', count: 12 },
    { title: 'Sales Executive', count: 24 },
    { title: 'Product Manager', count: 10 },
  ];

  return (
    <>
      {/* 7 KPI Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Employees" value="248" subtext="8 (3.33%) vs last month" up icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Active Employees" value="214" subtext="12 (5.94%) vs last month" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
        <KpiCard label="On Leave" value="18" subtext="2 (10%) vs last month" up={false} icon={Clock} iconBg="#FEF3C7" iconColor={WARNING} />
        <KpiCard label="New Joiners" value="16" subtext="4 (33.33%) vs last month" up icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Resigned" value="5" subtext="1 (16.67%) vs last month" up={false} icon={UserX} iconBg="#FEE2E2" iconColor={DANGER} />
        <KpiCard label="Average Age" value="32.4" subtext="Years old avg" icon={Users} iconBg="#F3E8FF" iconColor="#8B5CF6" />
        <KpiCard label="Avg Experience" value="4.5 Yrs" subtext="Company tenure" icon={Briefcase} iconBg="#E0F2FE" iconColor="#0284C7" />
      </div>

      {/* Top 3 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left Donut: Department */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Employees by Department</h3>
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DEPT_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {DEPT_PIE.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>248</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Total</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {DEPT_PIE.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} /> {item.name}
                </span>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{item.value} ({item.percent})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Bar: Age Distribution */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Employees by Age Group</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGE_BAR} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" fill={PRIMARY} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Donut: Gender */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Gender Distribution</h3>
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={GENDER_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {GENDER_PIE.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>248</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Total</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            {GENDER_PIE.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} /> {item.name}
                </span>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{item.value} ({item.percent})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Employee Summary Table */}
      <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(15,23,42,.04)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Employee Summary</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                {['Department', 'Total Employees', 'Active Employees', 'On Leave', 'New Joiners', 'Resigned', 'Avg Age', 'Experience'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMP_SUMMARY.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', height: 48 }}>
                  <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{row.dept}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.total}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.active}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.leave}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.joiners}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.resigned}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.age}</td>
                  <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{row.exp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Designations Horizontal Bar */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Top Designations</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DESIGNATIONS_BAR} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={PRIMARY} barSize={16} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Employee List */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Recent Employee Additions</h3>
            <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, cursor: 'pointer' }}>View All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Rahul Sharma', dept: 'Engineering', role: 'Software Engineer', date: '01 May 2024' },
              { name: 'Priya Patel', dept: 'Sales', role: 'Sales Executive', date: '10 May 2024' },
              { name: 'Amit Kumar', dept: 'Design', role: 'UI Designer', date: '12 May 2024' },
              { name: 'Sneha Reddy', dept: 'HR', role: 'HR Specialist', date: '15 May 2024' },
            ].map((emp, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DBEAFE', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {emp.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{emp.role} • {emp.dept}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{emp.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────── 2. ATTENDANCE REPORTS ─────────────────── */
const AttendanceReportsView = () => {
  const TREND_LINE = [
    { date: '01 May', Present: 210, Absent: 18, Late: 12, HalfDay: 8 },
    { date: '05 May', Present: 215, Absent: 15, Late: 10, HalfDay: 8 },
    { date: '10 May', Present: 200, Absent: 22, Late: 16, HalfDay: 10 },
    { date: '15 May', Present: 220, Absent: 12, Late: 8, HalfDay: 8 },
    { date: '20 May', Present: 205, Absent: 20, Late: 14, HalfDay: 9 },
    { date: '25 May', Present: 218, Absent: 14, Late: 9, HalfDay: 7 },
    { date: '31 May', Present: 212, Absent: 18, Late: 11, HalfDay: 7 },
  ];

  const DEPT_ATTENDANCE = [
    { dept: 'Engineering', pct: 92.35 },
    { dept: 'Human Resources', pct: 91.20 },
    { dept: 'Sales & Marketing', pct: 90.50 },
    { dept: 'Finance', pct: 93.10 },
    { dept: 'Operations', pct: 92.00 },
    { dept: 'IT', pct: 90.75 },
    { dept: 'Support', pct: 89.40 },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Employees" value="248" subtext="Total strength" icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Present" value="200" subtext="80.65% Present rate" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
        <KpiCard label="Absent" value="20" subtext="8.06% Absent rate" up={false} icon={UserX} iconBg="#FEE2E2" iconColor={DANGER} />
        <KpiCard label="Late" value="18" subtext="7.26% Late arrivals" up={false} icon={Clock} iconBg="#FEF3C7" iconColor={WARNING} />
        <KpiCard label="Half Day" value="10" subtext="4.03% Half days" up={false} icon={Clock} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Avg Attendance" value="92.42%" subtext="Overall average" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
        <KpiCard label="Overtime Hours" value="142h" subtext="Total OT logged" icon={Clock} iconBg="#F3E8FF" iconColor="#8B5CF6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Attendance Trend */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Attendance Overview Trend</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_LINE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Present" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Absent" stroke={DANGER} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Late" stroke={WARNING} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="HalfDay" stroke={SUCCESS} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Attendance */}
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Attendance by Department</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_ATTENDANCE} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" tick={{ fill: '#334155', fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="pct" fill={PRIMARY} barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────── 3. LEAVE REPORTS ─────────────────── */
const LeaveReportsView = () => {
  const LEAVE_TYPE = [
    { name: 'Casual Leave', value: 96, percent: '38.7%', color: PRIMARY },
    { name: 'Sick Leave', value: 53, percent: '21.4%', color: DANGER },
    { name: 'Earned Leave', value: 52, percent: '21.0%', color: SUCCESS },
    { name: 'Maternity Leave', value: 35, percent: '14.1%', color: WARNING },
    { name: 'Paternity Leave', value: 12, percent: '4.8%', color: '#8B5CF6' },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Leave Requests" value="124" subtext="Submitted this month" icon={Clock} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Approved" value="96" subtext="77.42% Approved" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
        <KpiCard label="Pending" value="18" subtext="14.52% Under review" icon={Clock} iconBg="#FEF3C7" iconColor={WARNING} />
        <KpiCard label="Rejected" value="10" subtext="8.06% Rejected" up={false} icon={UserX} iconBg="#FEE2E2" iconColor={DANGER} />
        <KpiCard label="Total Leave Days" value="248" subtext="Total days taken" icon={Calendar} iconBg="#EFF6FF" iconColor={PRIMARY} />
        <KpiCard label="Avg Leave/Employee" value="1.0" subtext="Days per employee" icon={Users} iconBg="#F3E8FF" iconColor="#8B5CF6" />
        <KpiCard label="Comp-Off Days" value="14" subtext="Approved comp-off" icon={Award} iconBg="#E0F2FE" iconColor="#0284C7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Leave by Type</h3>
          <div style={{ width: '100%', height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LEAVE_TYPE} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" stroke="none">
                  {LEAVE_TYPE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>248</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Total Days</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {LEAVE_TYPE.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} /> {item.name}
                </span>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{item.value} ({item.percent})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Leave Summary by Department</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                  {['Department', 'Total Requests', 'Approved', 'Rejected', 'Leave Days'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { dept: 'Engineering', req: 32, app: 25, rej: 2, days: 64 },
                  { dept: 'Human Resources', req: 16, app: 12, rej: 1, days: 28 },
                  { dept: 'Sales & Marketing', req: 24, app: 20, rej: 2, days: 48 },
                  { dept: 'Finance', req: 14, app: 10, rej: 1, days: 22 },
                  { dept: 'Operations', req: 20, app: 15, rej: 2, days: 40 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', height: 42 }}>
                    <td style={{ padding: '0 14px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{row.dept}</td>
                    <td style={{ padding: '0 14px', fontSize: 13, color: '#334155' }}>{row.req}</td>
                    <td style={{ padding: '0 14px', fontSize: 13, color: '#334155' }}>{row.app}</td>
                    <td style={{ padding: '0 14px', fontSize: 13, color: '#334155' }}>{row.rej}</td>
                    <td style={{ padding: '0 14px', fontSize: 13, fontWeight: 600, color: PRIMARY }}>{row.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────── 4. PAYROLL REPORTS ─────────────────── */
const PayrollReportsView = () => (
  <>
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <KpiCard label="Total Employees" value="248" subtext="On payroll" icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Total Payroll Cost" value="₹1,24,80,000" subtext="Gross monthly payroll" icon={DollarSign} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Net Pay" value="₹1,08,30,000" subtext="Total disbursed" up icon={DollarSign} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="Deductions" value="₹16,50,000" subtext="PF, ESI & Loans" icon={DollarSign} iconBg="#FEF3C7" iconColor={WARNING} />
      <KpiCard label="Taxes" value="₹11,00,000" subtext="TDS Deducted" icon={DollarSign} iconBg="#FEE2E2" iconColor={DANGER} />
      <KpiCard label="Avg Salary" value="₹50,323" subtext="Per employee avg" icon={DollarSign} iconBg="#F3E8FF" iconColor="#8B5CF6" />
      <KpiCard label="Bonus Paid" value="₹8,50,000" subtext="Incentives & bonus" icon={Award} iconBg="#E0F2FE" iconColor="#0284C7" />
    </div>
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Payroll Summary by Department</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
            {['Department', 'Employees', 'Payroll Cost', 'Net Pay', 'Deductions', 'Taxes'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { dept: 'Engineering', emp: 72, cost: '₹48,00,000', net: '₹41,60,000', ded: '₹4,80,000', tax: '₹1,60,000' },
            { dept: 'Sales & Marketing', emp: 42, cost: '₹28,00,000', net: '₹24,28,000', ded: '₹2,80,000', tax: '₹92,000' },
            { dept: 'Finance', emp: 28, cost: '₹18,00,000', net: '₹15,68,000', ded: '₹1,80,000', tax: '₹58,000' },
            { dept: 'Operations', emp: 36, cost: '₹18,00,000', net: '₹15,68,000', ded: '₹1,70,000', tax: '₹56,000' },
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', height: 48 }}>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{r.dept}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.emp}</td>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: PRIMARY }}>{r.cost}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.net}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.ded}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.tax}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

/* ─────────────────── 5. RECRUITMENT REPORTS ─────────────────── */
const RecruitmentReportsView = () => (
  <>
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <KpiCard label="Total Openings" value="28" subtext="Active job posts" icon={Briefcase} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Applications" value="256" subtext="Received applications" up icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Interviews" value="68" subtext="Conducted this month" icon={Clock} iconBg="#FEF3C7" iconColor={WARNING} />
      <KpiCard label="Offers Made" value="18" subtext="Offers sent out" icon={Award} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Hired" value="16" subtext="Successfully onboarded" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="Time To Hire" value="22 Days" subtext="Average duration" icon={Clock} iconBg="#F3E8FF" iconColor="#8B5CF6" />
      <KpiCard label="Offer Acceptance" value="88.8%" subtext="Acceptance rate" up icon={Award} iconBg="#ECFDF5" iconColor={SUCCESS} />
    </div>
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Hiring Funnel</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { stage: 'Applications', count: 256, pct: '100%', color: PRIMARY },
          { stage: 'Screening', count: 120, pct: '46.88%', color: '#3B82F6' },
          { stage: 'Interviews', count: 68, pct: '26.56%', color: WARNING },
          { stage: 'Offers', count: 18, pct: '7.03%', color: '#8B5CF6' },
          { stage: 'Hired', count: 16, pct: '6.25%', color: SUCCESS },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120, fontSize: 13, fontWeight: 600, color: '#334155' }}>{f.stage}</span>
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: f.pct, background: f.color, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10, color: '#FFF', fontSize: 11, fontWeight: 700 }}>
                {f.count} ({f.pct})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

/* ─────────────────── 6. PERFORMANCE REPORTS ─────────────────── */
const PerformanceReportsView = () => (
  <>
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <KpiCard label="Total Employees" value="248" subtext="Reviewed employees" icon={Users} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Outstanding" value="32" subtext="12.90% Exceptional" up icon={Award} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="Exceeds Expectations" value="68" subtext="27.42% High performers" up icon={Award} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="Meets Expectations" value="102" subtext="41.13% Satisfactory" icon={UserCheck} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Needs Improvement" value="32" subtext="12.90% Underperforming" up={false} icon={UserX} iconBg="#FEF3C7" iconColor={WARNING} />
      <KpiCard label="Unsatisfactory" value="14" subtext="5.65% Critical attention" up={false} icon={UserX} iconBg="#FEE2E2" iconColor={DANGER} />
      <KpiCard label="Average Rating" value="3.82 / 5" subtext="Company average" icon={Award} iconBg="#F3E8FF" iconColor="#8B5CF6" />
    </div>
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Performance by Department</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
            {['Department', 'Avg Rating', 'Outstanding', 'Exceeds', 'Meets', 'Needs Improv.', 'Unsatisfactory'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { dept: 'Engineering', rating: '4.12', out: 12, exc: 18, meets: 30, needs: 8, un: 4 },
            { dept: 'Sales & Marketing', rating: '3.85', out: 8, exc: 14, meets: 15, needs: 3, un: 2 },
            { dept: 'Finance', rating: '3.90', out: 4, exc: 10, meets: 12, needs: 1, un: 1 },
            { dept: 'Operations', rating: '3.70', out: 5, exc: 12, meets: 16, needs: 2, un: 1 },
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', height: 48 }}>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{r.dept}</td>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 700, color: PRIMARY }}>{r.rating}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.out}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.exc}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.meets}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.needs}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{r.un}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

/* ─────────────────── 7. PROJECT REPORTS ─────────────────── */
const ProjectReportsView = () => (
  <>
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <KpiCard label="Total Projects" value="24" subtext="Active portfolio" icon={FolderKanban} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Active" value="16" subtext="In progress" up icon={FolderKanban} iconBg="#EFF6FF" iconColor={PRIMARY} />
      <KpiCard label="Completed" value="4" subtext="Delivered" up icon={UserCheck} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="On Hold" value="2" subtext="Paused" icon={Clock} iconBg="#FEF3C7" iconColor={WARNING} />
      <KpiCard label="Delayed" value="2" subtext="Behind schedule" up={false} icon={UserX} iconBg="#FEE2E2" iconColor={DANGER} />
      <KpiCard label="Progress %" value="65%" subtext="Average completion" up icon={Award} iconBg="#ECFDF5" iconColor={SUCCESS} />
      <KpiCard label="Total Milestones" value="142" subtext="Across all projects" icon={FolderKanban} iconBg="#F3E8FF" iconColor="#8B5CF6" />
    </div>
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.04)', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Project Status & Milestones</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
            {['Project Name', 'Manager', 'Progress', 'Status', 'Milestones Completed'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { name: 'HRM Software', mgr: 'Rahul Sharma', pct: 75, status: 'In Progress', ms: '12 / 16' },
            { name: 'Mobile App Development', mgr: 'Priya Patel', pct: 60, status: 'In Progress', ms: '8 / 12' },
            { name: 'Website Redesign', mgr: 'Amit Kumar', pct: 45, status: 'In Progress', ms: '4 / 10' },
            { name: 'CRM Integration', mgr: 'Sneha Kapoor', pct: 30, status: 'In Progress', ms: '3 / 8' },
          ].map((p, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', height: 48 }}>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{p.name}</td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{p.mgr}</td>
              <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: PRIMARY }}>{p.pct}%</td>
              <td style={{ padding: '0 16px' }}><Badge text={p.status} /></td>
              <td style={{ padding: '0 16px', fontSize: 13, color: '#334155' }}>{p.ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

/* ─────────────────── MAIN REPORTS CONTAINER ─────────────────── */
export function AnalyticsReports({ reportType = 'employee' }) {
  const activeTab = reportType;

  const REPORT_NAMES = {
    employee: 'Employee Reports',
    attendance: 'Attendance Reports',
    leave: 'Leave Reports',
    payroll: 'Payroll Reports',
    recruitment: 'Recruitment Reports',
    performance: 'Performance Reports',
    project: 'Project Reports',
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── HEADER TOOLBAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1E293B' }}>
            {REPORT_NAMES[activeTab] || 'Reports'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Comprehensive workforce analytics and metrics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#334155',
            boxShadow: '0 1px 2px rgba(0,0,0,.05)',
          }}>
            <Calendar size={14} color="#64748B" />
            <AppDropdown value={`${new Date().getFullYear()} options={[{value:'val',label:'1 – $ $, $`}'}]} size="sm" />
          </div>

          <div style={{ position: 'relative' }}>
            <AppDropdown options={[{value:'All Departments',label:'All Departments'},{value:'Engineering',label:'Engineering'},{value:'Human Resources',label:'Human Resources'},{value:'Sales & Marketing',label:'Sales & Marketing'},{value:'Finance',label:'Finance'}]} size="sm" />
            <ChevronDown size={14} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13,
            fontWeight: 600, color: '#334155', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.05)',
          }}>
            <Download size={14} color="#64748B" /> Export Report
          </button>

          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
            background: PRIMARY, border: 'none', borderRadius: 8, fontSize: 13,
            fontWeight: 600, color: '#FFF', cursor: 'pointer', boxShadow: '0 2px 4px rgba(41,82,227,.25)',
          }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* ── REPORT CONTENT RENDERER ── */}
      {activeTab === 'employee' && <EmployeeReportsView />}
      {activeTab === 'attendance' && <AttendanceReportsView />}
      {activeTab === 'leave' && <LeaveReportsView />}
      {activeTab === 'payroll' && <PayrollReportsView />}
      {activeTab === 'recruitment' && <RecruitmentReportsView />}
      {activeTab === 'performance' && <PerformanceReportsView />}
      {activeTab === 'project' && <ProjectReportsView />}

    </div>
  );
}

export default AnalyticsReports;