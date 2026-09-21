import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, ChevronDown, Layers, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canExport } from '../../lib/permissions';

export function ExpenseReports() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    kpis: { totalClaims: 0, pendingClaims: 0, approvedClaims: 0, rejectedClaims: 0, totalReimbursement: 0 },
    categoryPie: [],
    monthlyTrend: [],
    deptStats: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dbRes = await apiFetch('/expenses/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load expense report details', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ['Category', 'Total Amount', 'Percentage'];
    const rows = dashboard.categoryPie.map(r => [r.name, '₹ ' + r.value.toLocaleString('en-IN'), r.percent]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Expense Reports...</div>;
  }

  const KpiCard = ({ label, value, subtext, iconBg, iconColor, icon: Icon }) => (
    <div style={{
      background: '#FFF',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 4px rgba(15,23,42,.06)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflow: 'hidden',
      minWidth: 0,
      flex: '1 1 0'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        </div>
      </div>
    </div>
  );

  const totalExpenseAmt = dashboard.categoryPie.reduce((s, r) => s + r.value, 0);

  const SUMMARY_ROWS = [
    { metric: 'Total Claims Count', amount: String(dashboard.kpis.totalClaims), pct: '100%' },
    { metric: 'Pending Claims Count', amount: String(dashboard.kpis.pendingClaims), pct: dashboard.kpis.totalClaims > 0 ? `${((dashboard.kpis.pendingClaims / dashboard.kpis.totalClaims) * 100).toFixed(1)}%` : '0%' },
    { metric: 'Approved Claims Count', amount: String(dashboard.kpis.approvedClaims), pct: dashboard.kpis.totalClaims > 0 ? `${((dashboard.kpis.approvedClaims / dashboard.kpis.totalClaims) * 100).toFixed(1)}%` : '0%' },
    { metric: 'Rejected Claims Count', amount: String(dashboard.kpis.rejectedClaims), pct: dashboard.kpis.totalClaims > 0 ? `${((dashboard.kpis.rejectedClaims / dashboard.kpis.totalClaims) * 100).toFixed(1)}%` : '0%' },
    { metric: 'Reimbursed Total Value', amount: `₹ ${dashboard.kpis.totalReimbursement.toLocaleString('en-IN')}`, pct: totalExpenseAmt > 0 ? `${((dashboard.kpis.totalReimbursement / totalExpenseAmt) * 100).toFixed(1)}%` : '0%' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Expense Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Comprehensive expense analytics and reporting</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {canExport('expenses', 'expense_reports') && (
            <button onClick={handleExport} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
              background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Download size={14} /> Export Report
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Total Expenses Paid" value={`₹ ${dashboard.kpis.totalReimbursement.toLocaleString('en-IN')}`} iconBg="#EFF6FF" iconColor="#2563EB" icon={Layers} />
        <KpiCard label="Total Claims filed" value={dashboard.kpis.totalClaims} iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Pending Claims" value={dashboard.kpis.pendingClaims} iconBg="#EFF6FF" iconColor="#2563EB" icon={Clock} />
        <KpiCard label="Approved Claims" value={dashboard.kpis.approvedClaims} iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Rejected Claims" value={dashboard.kpis.rejectedClaims} iconBg="#FEF2F2" iconColor="#EF4444" icon={XCircle} />
      </div>

      {/* 4 Analytics Grid Widgets (2x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Widget 1: Monthly Expense Trend */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Monthly Expense Trend</h3>
          {dashboard.monthlyTrend.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No data logged yet</div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Widget 2: Expenses by Category Donut Chart */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Expenses by Category</h3>
          {dashboard.categoryPie.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No data logged yet</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboard.categoryPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                      {dashboard.categoryPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1 }}>₹ {totalExpenseAmt.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Total</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dashboard.categoryPie.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      {item.name}
                    </span>
                    <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.percent} (₹ {item.value.toLocaleString('en-IN')})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Widget 3: Expenses by Department Horizontal Bar Chart */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Expenses by Department</h3>
          {dashboard.deptStats.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No data logged yet</div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dashboard.deptStats} margin={{ top: 0, right: 30, left: 25, bottom: 0 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#374151' }} width={75} />
                  <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Widget 4: Expense Summary Table */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Expense Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Metric</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Amount / Count</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {SUMMARY_ROWS.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 32 }}>
                  <td style={{ padding: '0 12px', fontSize: 12, fontWeight: 500, color: '#111827' }}>{r.metric}</td>
                  <td style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{r.amount}</td>
                  <td style={{ padding: '0 12px', fontSize: 12, color: '#6B7280', textAlign: 'right' }}>{r.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

export default ExpenseReports;
