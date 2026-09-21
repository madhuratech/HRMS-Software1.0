import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, ChevronDown, Clock, UserCheck, UserX, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch } from '../../lib/api';

export function LeaveReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: { pending: 0, approved: 0, rejected: 0, avgDays: '0 Days' },
    leaveType: [],
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
      const res = await apiFetch(`/reports/leave?month=${encodeURIComponent(selectedMonth)}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load leave reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ['Department', 'Requests Raised', 'Approved', 'Rejected', 'Total Leave Days'];
    const rows = data.summary.map(r => [r.dept, r.req, r.app, r.rej, r.days]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Leave Reports...</div>;
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Leave Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Analyze employee leave data</p>
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

          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
            background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Pending Applications" value={data.kpis.pending} pct="Needs review" iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Approved Applications" value={data.kpis.approved} pct="Leaves granted" iconBg="#DCFCE7" iconColor="#16A34A" icon={UserCheck} />
        <KpiCard label="Rejected Applications" value={data.kpis.rejected} pct="Leaves denied" iconBg="#FEE2E2" iconColor="#DC2626" icon={UserX} />
        <KpiCard label="Avg. Duration" value={data.kpis.avgDays} pct="Per approved request" iconBg="#DBEAFE" iconColor="#2563EB" icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Department', 'Requests Raised', 'Approved', 'Rejected', 'Total Leave Days'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap', background: '#FAFAFA' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.map((m, i) => (
                  <tr key={i} style={{ height: 52, borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.dept}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{m.req}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{m.app}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{m.rej}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{m.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Distribution Chart */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Leave Distribution</h3>
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.leaveType} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                  {data.leaveType.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {data.leaveType.map((item, i) => (
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

export default LeaveReports;
