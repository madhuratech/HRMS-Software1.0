import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { 
  Calendar, ChevronDown, Download, FileText, CheckCircle, Clock, 
  Star, RefreshCw, Loader2, BarChart2, TrendingUp, ShieldAlert
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
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
      {subtext && <div style={{ fontSize: 10, color: isPositive ? '#16A34A' : '#64748B', marginTop: 3 }}>{subtext}</div>}
    </div>
  </div>
);

export function HelpDeskReports() {
  const { addToast } = useToast();
  const [reportData, setReportData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState('Daily');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rep, dash] = await Promise.all([
        apiFetch('/tickets/reports/summary').catch(() => null),
        apiFetch('/tickets/stats/dashboard').catch(() => null)
      ]);
      if (rep) setReportData(rep);
      if (dash) setDashboardData(dash);
    } catch (err) {
      console.error("Failed to load helpdesk reports:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const kpis = reportData?.kpis || {
    totalTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: "0m",
    avgResolutionTime: "0h",
    satisfactionScore: "0.0 / 5"
  };

  const detailedReport = reportData?.detailedReport || [];
  const ticketsOverTime = dashboardData?.ticketsOverTime || [];
  const categoryPie = dashboardData?.categoryPie || [];
  const slaPie = dashboardData?.slaPie || [];

  const handleExportCSV = () => {
    if (!detailedReport || detailedReport.length === 0) {
      addToast("No report data available to export", 'info');
      return;
    }

    const headers = ["Category", "Total Tickets", "Open", "In Progress", "Pending", "Resolved", "Overdue", "Avg Response Time", "Avg Resolution Time", "Satisfaction Score"];
    const rows = detailedReport.map(r => [
      `"${r.cat}"`,
      r.total,
      r.open,
      r.progress,
      r.pending,
      r.resolved,
      r.overdue,
      `"${r.avgResp}"`,
      `"${r.avgRes}"`,
      r.sat
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HelpDesk_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Help Desk report exported to CSV successfully!", 'success');
  };

  const totalPages = Math.ceil(detailedReport.length / itemsPerPage) || 1;
  const paginatedReport = detailedReport.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Analyze and export dynamic help desk SLA and performance reports</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={fetchReports}
            title="Refresh Data"
            style={{
              height: 38, padding: '0 12px', background: '#FFF', border: '1px solid #E5E7EB',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
              background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export Report (CSV)
          </button>

          <button 
            onClick={fetchReports}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
              background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            }}
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* ── 5 KPI CARDS IN A SINGLE ROW ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%', flexWrap: 'wrap' }}>
        <KpiCard label="Total Tickets"        value={kpis.totalTickets}       subtext="Active in database" isPositive={true}  iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Resolved Tickets"     value={kpis.resolvedTickets}    subtext="Successfully closed" isPositive={true}  iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Avg Response Time"    value={kpis.avgResponseTime}    subtext="First contact SLA"  isPositive={true}  iconBg="#EFF6FF" iconColor="#2563EB" icon={Clock} />
        <KpiCard label="Avg Resolution Time"  value={kpis.avgResolutionTime}  subtext="Ticket turnaround"  isPositive={true}  iconBg="#EFF6FF" iconColor="#2563EB" icon={Clock} />
        <KpiCard label="Satisfaction Score"   value={kpis.satisfactionScore}   subtext="CSAT rating"        isPositive={true}  iconBg="#FEF3C7" iconColor="#D97706" icon={Star} />
      </div>

      {/* ── TOP ROW: 3 ANALYTICS CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Left: Tickets Over Time Line */}
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
          <div style={{ width: '100%', height: 160 }}>
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
                No time-series data
              </div>
            )}
          </div>
        </div>

        {/* Center: Tickets by Category Donut */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Tickets by Category</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={36} outerRadius={52} dataKey="value" stroke="none">
                    {categoryPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpis.totalTickets}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {categoryPie.slice(0, 4).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {item.name}
                  </span>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: SLA Performance Donut */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>SLA Performance</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={slaPie} cx="50%" cy="50%" innerRadius={36} outerRadius={52} dataKey="value" stroke="none">
                    {slaPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpis.totalTickets}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
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

      </div>

      {/* ── MAIN DATA TABLE: Detailed Report Table ── */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Detailed Category Breakdown</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Category', 'Total Tickets', 'Open', 'In Progress', 'Pending', 'Resolved', 'Overdue', 'Avg Response', 'Avg Resolution', 'Satisfaction'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                    <Loader2 className="animate-spin inline-block mr-2" size={18} /> Generating dynamic reports...
                  </td>
                </tr>
              ) : paginatedReport.length > 0 ? (
                paginatedReport.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.cat}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>{r.total}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#EF4444', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.open}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#D97706', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.progress}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#818CF8', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.pending}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.resolved}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.overdue}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.avgResp}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.avgRes}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ⭐ {r.sat}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No report data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Showing {detailedReport.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, detailedReport.length)} of {detailedReport.length} entries
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    background: page === currentPage ? '#2563EB' : '#FFF',
                    color: page === currentPage ? '#FFF' : '#374151',
                    fontSize: 12, fontWeight: page === currentPage ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default HelpDeskReports;
