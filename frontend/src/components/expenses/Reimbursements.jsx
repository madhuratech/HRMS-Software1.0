import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, ChevronDown, FileText, CheckCircle, Clock, XCircle, Layers } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canEdit, canExport } from '../../lib/permissions';

export function Reimbursements() {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [reimbList, setReimbList] = useState([]);
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
      const res = await apiFetch('/expenses/reimbursements');
      if (res.success) setReimbList(res.data || []);

      const dbRes = await apiFetch('/expenses/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load reimbursements list', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async (id) => {
    const txId = prompt('Enter Bank Transaction / Reference ID:');
    if (txId === null) return;
    try {
      const res = await apiFetch(`/expenses/reimbursements/${id}/process`, {
        method: 'PUT',
        body: JSON.stringify({
          payment_method: 'Bank Transfer',
          transaction_id: txId || 'TXN-' + Math.floor(Math.random() * 9000000),
          paid_date: new Date().toISOString().slice(0, 10),
          status: 'Paid'
        })
      });
      if (res.success) {
        addToast('Payment processed successfully', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Processing failed', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    }
  };

  const handleExport = () => {
    const headers = ['Reimbursement ID', 'Employee', 'Department', 'Purpose', 'Date', 'Amount', 'Status', 'Paid On', 'Transaction ID'];
    const rows = reimbList.map(r => [r.id, r.employee_name, r.department_name, r.purpose, formatDate(r.claim_date), r.amount, r.status, r.paid_date ? formatDate(r.paid_date) : '-', r.transaction_id || '-']);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reimbursement_payouts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Reimbursements...</div>;
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

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Reimbursements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Track and manage all reimbursements</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {canExport('expenses', 'expense_reimbursements') && (
            <button onClick={handleExport} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
              background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Download size={14} /> Export Report
            </button>
          )}
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Total Claims Approved" value={reimbList.length} iconBg="#EFF6FF" iconColor="#2563EB" icon={FileText} />
        <KpiCard label="Paid Reimbursements" value={reimbList.filter(r => r.status === 'Paid').length} iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Pending Reimbursements" value={reimbList.filter(r => r.status === 'Pending').length} iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Total Reimbursed Value" value={`₹ ${dashboard.kpis.totalReimbursement.toLocaleString('en-IN')}`} iconBg="#EFF6FF" iconColor="#2563EB" icon={Layers} />
      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Left: Reimbursement Over Time Line Chart */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Reimbursement Over Time</h3>
          {dashboard.monthlyTrend.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No payouts processed yet</div>
          ) : (
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Reimbursement by Department Horizontal Bar */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Reimbursement by Department</h3>
          {dashboard.deptStats.length === 0 ? (
            <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No payouts processed yet</div>
          ) : (
            <div style={{ width: '100%', height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dashboard.deptStats} margin={{ top: 0, right: 30, left: 25, bottom: 0 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#374151' }} width={75} />
                  <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Main Table: Recent Reimbursements */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Reimbursements</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Reimbursement ID', 'Employee', 'Department', 'Purpose', 'Claim Date', 'Amount', 'Status', 'Paid On', 'Transaction ID', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reimbList.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    No reimbursement records found.
                  </td>
                </tr>
              ) : (
                reimbList.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>RMB-{r.id}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.department_name || 'Unassigned'}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.claim_title}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{formatDate(r.claim_date)}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>₹ {parseFloat(r.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Paid' ? '#ECFDF5' : '#FEF3C7',
                        color: r.status === 'Paid' ? '#059669' : '#D97706',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.paid_date ? formatDate(r.paid_date) : '-'}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.transaction_id || '-'}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      {r.status === 'Pending' && canEdit('expenses', 'expense_reimbursements') && (
                        <button onClick={() => handlePay(r.id)} style={{
                          background: '#2563EB', border: 'none', color: '#FFF', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                        }}>
                          Pay Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Reimbursements;
