import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, ChevronDown, Users, UserCheck, Clock, UserX } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiFetch } from '../../lib/api';

const PRIMARY = '#2563EB';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER  = '#EF4444';

export function EmployeeReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: { total: 0, active: 0, leave: 0, joiners: 0, resigned: 0 },
    deptPie: [],
    ageBar: [],
    genderPie: [],
    summary: []
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
      const res = await apiFetch(`/reports/employee?month=${encodeURIComponent(selectedMonth)}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load employee reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ['Department', 'Total Employees', 'Active Employees', 'On Leave', 'New Joiners', 'Resigned', 'Avg. Age', 'Avg. Experience'];
    const rows = data.summary.map(r => [r.dept, r.total, r.active, r.leave, r.joiners, r.resigned, r.age, r.exp]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employee_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Employee Reports...</div>;
  }

  const KpiCard = ({ label, value, subtext, up, iconBg, iconColor, icon: Icon }) => (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: up ? SUCCESS : DANGER }}>
            {up ? '↑' : '↓'} {subtext.split(' ')[0]}
          </span>
          <span style={{ color: '#9CA3AF' }}>{subtext.substring(subtext.indexOf(' '))}</span>
        </div>
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Employee Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Comprehensive overview of your workforce</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151',
          }}>
            <Calendar size={14} color="#6B7280" />
            <AppDropdown
              value={selectedMonth}
              onChange={v => setSelectedMonth(v)}
              options={monthOptions}
              size="sm"
              style={{ minWidth: 160 }}
            />
          </div>

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
        <KpiCard label="Total Employees" value={data.kpis.total} subtext="8 (3.33%) vs last month" up iconBg="#DBEAFE" iconColor="#2563EB" icon={Users} />
        <KpiCard label="Active Employees" value={data.kpis.active} subtext="12 (5.94%) vs last month" up iconBg="#DCFCE7" iconColor="#16A34A" icon={UserCheck} />
        <KpiCard label="On Leave" value={data.kpis.leave} subtext="2 (10%) vs last month" up={false} iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="New Joiners" value={data.kpis.joiners} subtext="4 (33.33%) vs last month" up iconBg="#DBEAFE" iconColor="#2563EB" icon={Users} />
        <KpiCard label="Resigned" value={data.kpis.resigned} subtext="1 (16.67%) vs last month" up={false} iconBg="#FEE2E2" iconColor="#DC2626" icon={UserX} />
      </div>

      {/* Top 2 Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Employees by Department */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Employees by Department</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 170, height: 170, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.deptPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                    {data.deptPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{data.kpis.total}</span>
                <span style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {data.deptPie.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} /> {item.name}
                  </span>
                  <span style={{ fontWeight: 500, color: '#6B7280' }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employees by Age Group */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Employees by Age Group</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ageBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="range" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Employees Summary Table + Gender Distribution Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        
        {/* Table */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Employees Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                  {['Department', 'Total Employees', 'Active Employees', 'On Leave', 'New Joiners', 'Resigned', 'Avg. Age', 'Avg. Experience'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 42 }}>
                    <td style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.dept}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.total}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.active}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.leave}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.joiners}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.resigned}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.age}</td>
                    <td style={{ padding: '0 14px', fontSize: 12, color: '#374151' }}>{r.exp}</td>
                  </tr>
                ))}
                <tr style={{ height: 44, fontWeight: 700, background: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>Total</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>{data.kpis.total}</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>{data.kpis.active}</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>{data.kpis.leave}</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>{data.kpis.joiners}</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>{data.kpis.resigned}</td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>
                    {(data.summary.reduce((s, r) => s + r.age, 0) / (data.summary.length || 1)).toFixed(1)}
                  </td>
                  <td style={{ padding: '0 14px', fontSize: 12, color: '#111827' }}>
                    {(data.summary.reduce((s, r) => s + parseFloat(r.exp), 0) / (data.summary.length || 1)).toFixed(1)} Yrs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gender Distribution */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Gender Distribution</h3>
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.genderPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                  {data.genderPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{data.kpis.total}</span>
              <span style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Total</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {data.genderPie.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} /> {item.name}
                </span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{item.value} ({item.percent})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default EmployeeReports;
