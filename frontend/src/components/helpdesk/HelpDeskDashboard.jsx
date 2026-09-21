import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { 
  Calendar, ChevronDown, Filter, FileText, Clock, CheckCircle, 
  Star, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, AlertCircle, Headphones
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';

const KpiCard = ({ label, value, subtext, isPositive, iconBg, iconColor, icon: Icon }) => (
  <div style={{
    background: '#FFF',
    borderRadius: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(15,23,42,.04)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '1 1 0',
    minWidth: 0,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: iconBg, color: iconColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</span>
        {subtext && (
          <span style={{ fontSize: 10, fontWeight: 600, color: isPositive ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {subtext}
          </span>
        )}
      </div>
    </div>
  </div>
);

export function HelpDeskDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState('Daily');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/tickets/stats/dashboard');
      if (res && res.kpis) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load helpdesk dashboard stats:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpis = data?.kpis || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    satisfactionScore: '0.0 / 5'
  };

  const ticketsOverTime = data?.ticketsOverTime || [];
  const statusPie = data?.statusPie || [];
  const categoryPie = data?.categoryPie || [];
  const slaPie = data?.slaPie || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── BREADCRUMB & HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Help Desk Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Real-time overview of live support tickets, resolution rates, and SLA metrics</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={fetchStats}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
              background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} color="#6B7280" /> Refresh
          </button>
        </div>
      </div>

      {/* ── 5 KPI CARDS IN A SINGLE ROW ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%', flexWrap: 'wrap' }}>
        <KpiCard label="Total Tickets"       value={kpis.totalTickets}      subtext="Live tracked" isPositive={true}  iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Open Tickets"        value={kpis.openTickets}       subtext={kpis.openTickets > 0 ? "Requires attention" : "All cleared"} isPositive={kpis.openTickets === 0} iconBg="#FEF2F2" iconColor="#EF4444" icon={Clock} />
        <KpiCard label="In Progress"         value={kpis.inProgressTickets} subtext="Active handling" isPositive={true}  iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Resolved Tickets"    value={kpis.resolvedTickets}   subtext="Resolved successfully" isPositive={true}  iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Satisfaction Score"  value={kpis.satisfactionScore} subtext="Avg Rating" isPositive={true} iconBg="#FEF3C7" iconColor="#D97706" icon={Star} />
      </div>

      {/* ── TOP ROW: Tickets Over Time Line Chart (70%) + Tickets by Status Donut Chart (30%) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
        
        {/* Left: Tickets Over Time */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Tickets Over Time</h3>
            <AppDropdown 
              value={timeView}
              onChange={v => setTimeView(v)}
              options={[{value:'Daily',label:'Daily'},{value:'Weekly',label:'Weekly'}]} 
              size="sm" 
            />
          </div>
          <div style={{ width: '100%', height: 180 }}>
            {ticketsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Line type="monotone" dataKey="tickets" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No historical ticket records available
              </div>
            )}
          </div>
        </div>

        {/* Right: Tickets by Status */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Tickets by Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" stroke="none">
                    {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpis.totalTickets}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusPie.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {item.name}
                  </span>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM ROW: 3 WIDGETS (Category Donut + SLA Donut + Recent Activity Feed) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* Widget 1: Tickets by Category */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Tickets by Category</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" stroke="none">
                    {categoryPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpis.totalTickets}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categoryPie.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {item.name}
                  </span>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 2: SLA Performance */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>SLA Performance</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={slaPie} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" stroke="none">
                    {slaPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpis.totalTickets}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slaPie.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {item.name}
                  </span>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 3: Recent Activity */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, paddingBottom: 6, borderBottom: i < recentActivities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    <div style={{ color: '#1E293B', fontWeight: 600 }}>{act.title}</div>
                    {act.subject && <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.subject}</div>}
                  </div>
                  <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{act.time}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                No recent activity logged
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default HelpDeskDashboard;
