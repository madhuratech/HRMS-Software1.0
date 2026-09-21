import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, ChevronDown, FolderKanban, UserCheck, Clock, UserX } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiFetch } from '../../lib/api';

const PRIMARY = '#2563EB';

export function ProjectReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState({
    kpis: { total: 0, active: 0, overdue: 0, hours: '0 Hrs' },
    statusPie: [],
    deptBar: [],
    progressList: []
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
    setLoaded(false);
    try {
      const res = await apiFetch(`/reports/project?month=${encodeURIComponent(selectedMonth)}`);
      if (res.success && res.data) {
        setData(res.data);
        setTimeout(() => setLoaded(true), 150);
      }
    } catch (err) {
      console.error('Failed to load project reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ['Project Name', 'Progress', 'Status'];
    const rows = data.progressList.map(r => [r.name, r.pct + '%', r.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `project_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Project Reports...</div>;
  }

  const KpiCard = ({ label, value, iconBg, iconColor, icon: Icon }) => (
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Project Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Evaluate progress rates and resources logged per project</p>
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
        <KpiCard label="Total Projects" value={data.kpis.total} iconBg="#DBEAFE" iconColor="#2563EB" icon={FolderKanban} />
        <KpiCard label="Active Projects" value={data.kpis.active} iconBg="#DCFCE7" iconColor="#16A34A" icon={UserCheck} />
        <KpiCard label="Overdue Projects" value={data.kpis.overdue} iconBg="#FEE2E2" iconColor="#DC2626" icon={UserX} />
        <KpiCard label="Timesheet Hours" value={data.kpis.hours} iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
        
        {/* Top Projects Progress */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Top Projects by Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.progressList.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{p.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: loaded ? `${p.pct}%` : '0%', background: '#2563EB', borderRadius: 999, transition: 'width 900ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Project Status</h3>
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                  {data.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Department Wise Projects List */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Department Wise Projects</h3>
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.deptBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="dept" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default ProjectReports;
