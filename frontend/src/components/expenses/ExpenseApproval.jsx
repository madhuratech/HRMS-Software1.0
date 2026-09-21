import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Download, ChevronDown, Clock, CheckCircle, XCircle, Layers } from 'lucide-react';
import { apiFetch, formatDate } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canEdit } from '../../lib/permissions';

export function ExpenseApproval() {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [claimsList, setClaimsList] = useState([]);
  const [meta, setMeta] = useState({ departments: [] });
  const [dashboard, setDashboard] = useState({
    kpis: { totalClaims: 0, pendingClaims: 0, approvedClaims: 0, rejectedClaims: 0, totalReimbursement: 0 }
  });
  
  const [deptFilter, setDeptFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const metaRes = await apiFetch('/expenses/meta');
      if (metaRes.success) setMeta(metaRes.data);

      let url = '/expenses/claims?status=Pending&';
      if (deptFilter) url += `department_id=${deptFilter}&`;

      const claimsRes = await apiFetch(url);
      if (claimsRes.success) setClaimsList(claimsRes.data || []);

      const dbRes = await apiFetch('/expenses/dashboard');
      if (dbRes.success) setDashboard(dbRes.data);
    } catch (err) {
      addToast('Failed to load expense approvals', 'error');
    } finally {
      setLoading(false);
    }
  }, [deptFilter, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id, status) => {
    try {
      const res = await apiFetch(`/expenses/claims/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        addToast(`Claim status updated to ${status.toLowerCase()}`, 'success');
        fetchData();
      } else {
        addToast(res.message || 'Action failed', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Expense Approvals...</div>;
  }

  const KpiCard = ({ label, value, subtext, iconBg, iconColor, icon: Icon }) => (
    <div style={{
      background: '#FFF',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 4px rgba(15,23,42,.06)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      overflow: 'hidden',
      minWidth: 0,
      flex: '1 1 0'
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
        <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Expense Approval</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Review and approve employee expense claims</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <div style={{ position: 'relative' }}>
            <AppDropdown
                value={deptFilter}
                onChange={v => setDeptFilter(v)}
                options={[{value:'',label:'All Departments'}]}
                size="sm"
              />
            <ChevronDown size={13} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Pending Approval" value={dashboard.kpis.pendingClaims} iconBg="#FEF3C7" iconColor="#D97706" icon={Clock} />
        <KpiCard label="Approved" value={dashboard.kpis.approvedClaims} iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle} />
        <KpiCard label="Rejected" value={dashboard.kpis.rejectedClaims} iconBg="#FEF2F2" iconColor="#EF4444" icon={XCircle} />
        <KpiCard label="Total Claim Amount" value={`₹ ${dashboard.kpis.totalReimbursement.toLocaleString('en-IN')}`} iconBg="#EFF6FF" iconColor="#2563EB" icon={Layers} />
      </div>

      {/* Pending Approval List Table */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Pending Approval List</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Claim ID', 'Employee', 'Department', 'Purpose', 'Claim Date', 'Amount', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claimsList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    No pending expense claims awaiting approval.
                  </td>
                </tr>
              ) : (
                claimsList.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>CLM-{r.id}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.department_name || 'Unassigned'}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.title}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>₹ {parseFloat(r.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      {canEdit('expenses', 'expense_approval') && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAction(r.id, 'Approved')} style={{
                            background: '#10B981', border: 'none', color: '#FFF', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>
                            Approve
                          </button>
                          <button onClick={() => handleAction(r.id, 'Rejected')} style={{
                            background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>
                            Reject
                          </button>
                        </div>
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

export default ExpenseApproval;
