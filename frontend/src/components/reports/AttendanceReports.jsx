import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, ChevronDown, Users, UserCheck, Clock, UserX } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { apiFetch } from '../../lib/api';

const PRIMARY = '#2563EB';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER  = '#EF4444';

export function AttendanceReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: { rate: '100%', present: 0, late: 0, absent: 0, half: 0 },
    trendLine: [],
    deptAttendance: [],
    summary: [],
    topAbsentees: []
  });

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const shortMonth = d.toLocaleString('en-US', { month: 'short' });
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      
      options.push({
        value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: `${shortMonth} 1 – ${shortMonth} ${lastDay}, ${year}`
      });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/reports/attendance?month=${encodeURIComponent(selectedMonth)}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load attendance reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ['Department', 'Total Employees', 'Present', 'Absent', 'Late', 'Half Day', 'Attendance Rate'];
    const rows = data.summary.map(r => [r.dept, r.total, r.present, r.absent, r.late, r.half, r.pct]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Attendance Reports...</div>;
  }

  const KpiCard = ({ label, value, pct, iconBg, iconColor, icon: Icon }) => (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: '16px 20px', flex: '1 1 0', minWidth: 140,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
        {pct && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{pct}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <button onClick={() => navigate('/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0 }}>
            <ArrowLeft size={16} /> Back to Reports
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Attendance Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Analyze daily workforce presence and patterns</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer',
          }}>
            <Calendar size={14} color="#6B7280" /> May 1 – May 31, 2024 <ChevronDown size={14} color="#6B7280" />
          </button>

          <div style={{ position: 'relative' }}>
            <AppDropdown options={[{value:'All Departments',label:'All Departments'}, ...(data.summary || [])]} size="sm" />
            <ChevronDown size={14} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
            background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards (5 Cards) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Avg. Attendance Rate" value={data.kpis.rate} pct="91.24% target rate" iconBg="#DBEAFE" iconColor="#2563EB" icon={Users} />
        <KpiCard label="Present Today" value={data.kpis.present} pct="4 new entries today" iconBg="#DCFCE7" iconColor="#16A34A" icon={UserCheck} />
        <KpiCard label="Late Entries" value={data.kpis.late} pct="3.2% late entry rate" iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Absentees" value={data.kpis.absent} pct="6 approved leaves today" iconBg="#FEE2E2" iconColor="#DC2626" icon={UserX} />
        <KpiCard label="Half Days" value={data.kpis.half} pct="2 requests pending" iconBg="#F1F5F9" iconColor="#475569" icon={Clock} />
      </div>

      {/* Top 2 Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Attendance Trend */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Attendance Trend</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Present" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#FFF' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Absent" stroke={DANGER} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#FFF' }} />
                <Line type="monotone" dataKey="Late" stroke={WARNING} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#FFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance by Department */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Attendance by Department (%)</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.deptAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="dept" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[80, 100]} />
                <Tooltip />
                <Bar dataKey="pct" fill={PRIMARY} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Attendance Summary Table + Top Absentees Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        
        {/* Table */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Attendance Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                  {['Department', 'Total Employees', 'Present', 'Absent', 'Late', 'Half Day', 'Avg. Attendance'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 42 }}>
                    <td style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.dept}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.total}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.present}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.absent}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.late}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.half}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Absentees */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Top Absentees (This Month)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.topAbsentees.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: 10, borderBottom: i === data.topAbsentees.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{item.dept}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 600 }}>{item.days} Days</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default AttendanceReports;
