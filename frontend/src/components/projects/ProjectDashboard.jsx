import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Plus, Edit2, ChevronLeft, ChevronRight, Calendar, Link2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { apiFetch, formatDate, getInitials } from '../../lib/api';

const STATUS_S = { 'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' }, 'Completed': { bg: '#DCFCE7', color: '#15803D' }, 'On Hold': { bg: '#FEF3C7', color: '#D97706' }, 'Overdue': { bg: '#FEE2E2', color: '#DC2626' }, 'Not Started': { bg: '#F3F4F6', color: '#6B7280' }, 'Planning': { bg: '#EDE9FE', color: '#5B21B6' } };
const PRIORITY_S = { 'High': { bg: '#FEE2E2', color: '#DC2626' }, 'Medium': { bg: '#FEF3C7', color: '#D97706' }, 'Low': { bg: '#DCFCE7', color: '#15803D' } };
const AVATAR = [{ bg: '#DBEAFE', c: '#1D4ED8' }, { bg: '#FCE7F3', c: '#9D174D' }, { bg: '#D1FAE5', c: '#065F46' }, { bg: '#FEF3C7', c: '#92400E' }, { bg: '#EDE9FE', c: '#5B21B6' }];

const pill = (label, map) => {
  const s = map[label] || { bg: '#F3F4F6', color: '#6B7280' };
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
};

const KpiCard = ({ label, value, iconBg, iconColor, icon }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: '18px 20px', flex: '1 1 0', minWidth: 140 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 6 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ color: '#9CA3AF' }}>Backend</span>
      <span style={{ color: '#9CA3AF' }}>reported</span>
    </div>
  </div>
);

export default function ProjectDashboard() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0, inProgress: 0, completed: 0, onHold: 0, notStarted: 0, delayed: 0,
    statusPie: [], monthlyTrend: [], topProjects: [], recentProjects: []
  });


  const fetchDashboard = useCallback(async () => {
    try {
      setLoaded(false);
      const res = await apiFetch('/projects/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
        setTimeout(() => setLoaded(true), 150);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const pieData = stats.statusPie && stats.statusPie.length ? stats.statusPie : [];
  const lineData = stats.monthlyTrend && stats.monthlyTrend.length ? stats.monthlyTrend : [];
  const topProjects = stats.topProjects && stats.topProjects.length ? stats.topProjects : [];
  const recent = stats.recentProjects && stats.recentProjects.length ? stats.recentProjects : [];
  const totalValue = stats.totalProjects || 0;

  const exportCsv = () => {
    if (!recent.length) return;
    const headers = ['Project Name', 'Project Manager', 'Start Date', 'End Date', 'Status', 'Priority'];
    const rows = recent.map(r => [r.name, r.manager, r.start, r.end, r.status, r.priority]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects-dashboard.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Project Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Overview of all projects and key metrics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}><Download size={14} /> Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Total Projects" value={stats.totalProjects} iconBg="#DBEAFE" iconColor="#2563EB" icon="📋" />
        <KpiCard label="In Progress" value={stats.inProgress} iconBg="#DBEAFE" iconColor="#2563EB" icon="▶" />
        <KpiCard label="Completed" value={stats.completed} iconBg="#DCFCE7" iconColor="#16A34A" icon="✓" />
        <KpiCard label="On Hold" value={stats.onHold} iconBg="#FEF3C7" iconColor="#D97706" icon="⏸" />
        <KpiCard label="Overdue" value={stats.delayed} iconBg="#FEE2E2" iconColor="#DC2626" icon="⚠" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Donut */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Projects Overview</h3>
          {pieData.length === 0 ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No data yet</div>
          ) : (
            <>
            <div style={{ width: '100%', height: 140, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">{pieData.map((e,i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} /></PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{totalValue}</span>
                <span style={{ fontSize: 10, color: '#6B7280' }}>Total</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
              {pieData.map((d,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} /><span style={{ fontSize: 11, color: '#374151' }}>{d.name}</span></div>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{d.value} ({totalValue && d.value ? `${Math.round((d.value/totalValue)*100)}%` : '0%'})</span>
                </div>
              ))}
            </div>
            </>
          )}
        </div>

        {/* Line Chart */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Projects Progress</h3>
          <div style={{ height: 220 }}>
            {lineData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No data yet</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="InProgress" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} name="In Progress" />
                <Line type="monotone" dataKey="Completed"  stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} name="Completed" />
                <Line type="monotone" dataKey="Overdue"    stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }} name="Overdue" />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Projects */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Top 5 Projects by Progress</h3>
          {topProjects.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', color: '#9CA3AF', fontSize: 13, padding: 30 }}>No data yet</div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topProjects.map((p, i) => (
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
          )}
        </div>
      </div>

      {/* Recent Projects Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.05)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Recent Projects</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recent.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No projects found.</div>
          ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                {['Project Name','Project Manager','Start Date','End Date','Progress','Status','Priority','Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => {
                const av = AVATAR[i % AVATAR.length];
                return (
                  <tr key={r.id || i} style={{ height: 52, borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.name}</td>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: av.bg, color: av.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{getInitials(r.manager)}</div>
                        <span style={{ fontSize: 13, color: '#374151' }}>{r.manager}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{formatDate(r.start)}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{formatDate(r.end)}</td>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 5, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: loaded ? `${r.pct}%` : '0%', background: '#2563EB', borderRadius: 999, transition: 'width 900ms ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{r.pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 16px' }}>{pill(r.status, STATUS_S)}</td>
                    <td style={{ padding: '0 16px' }}>{pill(r.priority, PRIORITY_S)}</td>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ width: 26, height: 26, borderRadius: 5, border: 'none', background: 'transparent', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Link2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Showing {recent.length} recent {recent.length === 1 ? 'project' : 'projects'}</span>
        </div>
      </div>
    </div>
  );
}