import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function TeamLeaveModule() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);

  const loadLeavesData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/leaves/applications');
      const dataArr = Array.isArray(res) ? res : (res && res.success && Array.isArray(res.data) ? res.data : []);
      
      const formatted = dataArr.map((l, idx) => ({
        id: l.id || idx + 1,
        empId: l.employee_id ? `EMP${String(l.employee_id).padStart(4, '0')}` : `EMP00${19 + idx}`,
        name: l.employee_name || l.applicant_name || 'Team Member',
        role: l.department || 'Software Development',
        type: l.leave_name || l.leave_type || 'Casual Leave',
        dates: l.start_date ? `${l.start_date} - ${l.end_date || l.start_date}` : '22 Aug 2026',
        days: l.days || 1,
        reason: l.reason || 'Personal leave request',
        status: l.status || 'Pending'
      }));
      setLeaves(formatted);
    } catch (err) {
      console.error("Failed to load leave records from database:", err);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeavesData();
  }, []);

  const filtered = leaves.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.empId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB'
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm font-semibold text-slate-600">Loading database team leave applications...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6">

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(37,99,235,0.25)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Team Leave Overview (View-Only)</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#DBEAFE' }}>
            Leave Applications for Team Members
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: '8px 16px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={16} /> View Only
        </div>
      </div>

      {/* Table & Filters Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>

          {/* Left group: Search + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: 1 }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search team member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '13px',
                  color: '#1E293B',
                  background: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
              />
            </div>

            {/* Status Filter */}
            <AppDropdown
                value={statusFilter}
                onChange={v => setStatusFilter(v)}
                options={[{value:'All',label:'All Statuses'},{value:'Pending',label:'Pending'},{value:'Approved',label:'Approved'},{value:'Rejected',label:'Rejected'}]}
                size="sm"
              />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
            <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
            No team leave requests found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-bold">{l.name}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{l.empId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{l.type}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{l.dates}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{l.days} Day(s)</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        l.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        l.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default TeamLeaveModule;
