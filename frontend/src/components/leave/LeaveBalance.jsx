import React, { useState, useEffect, useMemo } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Download, Briefcase, HeartPulse, Award, Clock, Calendar } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { getAvatarUrl } from '../../lib/utils';

export default function LeaveBalance() {
  const [data, setData] = useState({
    leaveTypes: [],
    summary: { cl: '0 Days', sl: '0 Days', el: '0 Days', comp: '0 Hours', byType: [] },
    records: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [monthFilter, setMonthFilter] = useState('August 2026');

  const getAuthUser = () => {
    try {
      const authRaw = localStorage.getItem('hrms_auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed) {
          return {
            id: parsed.user?.id,
            role: parsed.role || parsed.user?.role || localStorage.getItem('userRole') || 'SUPER_ADMIN',
            name: parsed.user?.name || parsed.name || localStorage.getItem('userName') || 'User'
          };
        }
      }
    } catch (e) {}
    return { id: null, role: localStorage.getItem('userRole') || 'SUPER_ADMIN', name: localStorage.getItem('userName') || 'User' };
  };

  const auth = getAuthUser();
  const isEmployee = String(auth.role).toUpperCase().replace(/_/g, ' ') === 'EMPLOYEE';

  const loadBalances = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/leaves/all-balances');
      if (res && res.records) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load leave balances:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB',
  };

  // Dynamic leave types from backend
  const leaveTypesList = useMemo(() => {
    if (data.leaveTypes && data.leaveTypes.length > 0) {
      return data.leaveTypes;
    }
    return [
      { code: 'CL', name: 'Casual Leave' },
      { code: 'SL', name: 'Sick Leave' }
    ];
  }, [data.leaveTypes]);

  // Dynamic department options from data
  const deptOptions = useMemo(() => {
    const depts = new Set((data.records || []).map(r => r.dept).filter(Boolean));
    return [
      { value: 'All Departments', label: 'All Departments' },
      ...Array.from(depts).map(d => ({ value: d, label: d }))
    ];
  }, [data.records]);

  // Card styles & icons
  const getCardStyle = (code, index) => {
    const c = String(code || '').toUpperCase();
    if (c === 'CL') return { icon: <Briefcase size={20} color="#3B82F6" />, bg: '#EFF6FF' };
    if (c === 'SL') return { icon: <HeartPulse size={20} color="#10B981" />, bg: '#ECFDF5' };
    if (c === 'EL') return { icon: <Award size={20} color="#8B5CF6" />, bg: '#F5F3FF' };
    if (c === 'COMP') return { icon: <Clock size={20} color="#F59E0B" />, bg: '#FFFBEB' };
    const palette = [
      { color: '#3B82F6', bg: '#EFF6FF' },
      { color: '#10B981', bg: '#ECFDF5' },
      { color: '#8B5CF6', bg: '#F5F3FF' },
      { color: '#F59E0B', bg: '#FFFBEB' },
      { color: '#EC4899', bg: '#FDF2F8' },
      { color: '#06B6D4', bg: '#ECFEFF' }
    ];
    const pick = palette[index % palette.length];
    return { icon: <Calendar size={20} color={pick.color} />, bg: pick.bg };
  };

  // Generate dynamic KPI summary cards per leave type
  const kpiCards = useMemo(() => {
    const cards = leaveTypesList.map((lt, idx) => {
      const design = getCardStyle(lt.code, idx);
      const summaryItem = data.summary?.byType?.find(b => b.code === lt.code);
      const val = summaryItem ? summaryItem.total : (data.summary?.[lt.code.toLowerCase()] || '0 Days');
      return {
        title: `${lt.name || lt.code} (${lt.code})`,
        value: val,
        icon: design.icon,
        bg: design.bg
      };
    });

    // Check if comp-off exists and should be shown
    const hasCompOff = data.records?.some(r => r.comp > 0) || (data.summary?.comp && data.summary.comp !== '0 Hours');
    if (hasCompOff && !leaveTypesList.some(lt => lt.code === 'COMP')) {
      cards.push({
        title: 'Comp Off',
        value: data.summary?.comp || '0 Hours',
        icon: <Clock size={20} color="#F59E0B" />,
        bg: '#FFFBEB'
      });
    }

    return cards;
  }, [leaveTypesList, data.summary, data.records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return (data.records || []).filter(r => {
      const nameMatch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const deptMatch = deptFilter === 'All Departments' || r.dept === deptFilter;
      return nameMatch && deptMatch;
    });
  }, [data.records, searchTerm, deptFilter]);

  const hasCompOff = useMemo(() => {
    return (data.records || []).some(r => r.comp > 0) || (data.summary?.comp && data.summary.comp !== '0 Hours');
  }, [data.records, data.summary]);

  const totalColumns = 2 + leaveTypesList.length + (hasCompOff ? 1 : 0) + 1;

  const handleExport = () => {
    if (!filteredRecords.length) return;
    const headers = ['Employee Name', 'Department', ...leaveTypesList.map(lt => `${lt.name || lt.code} (${lt.code})`), ...(hasCompOff ? ['Comp Off (Hrs)'] : []), 'Total (Days)'];
    const rows = filteredRecords.map(r => [
      `"${r.name}"`,
      `"${r.dept}"`,
      ...leaveTypesList.map(lt => {
        const val = r.balances?.[lt.code] !== undefined ? r.balances[lt.code] : (r[lt.code.toLowerCase()] ?? 0);
        return Number(val).toFixed(1);
      }),
      ...(hasCompOff ? [Number(r.comp || 0).toFixed(2)] : []),
      Number(r.total || 0).toFixed(1)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leave_balances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      
      {/* Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {kpiCards.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{kpi.value}</div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        
        {/* Toolbar */}
        {!isEmployee && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 auto' }}>
              <AppDropdown 
                value={monthFilter} 
                onChange={setMonthFilter}
                options={[{value:'August 2026',label:'August 2026'},{value:'July 2026',label:'July 2026'},{value:'June 2026',label:'June 2026'}]} 
                size="sm" 
              />

              <AppDropdown 
                value={deptFilter} 
                onChange={setDeptFilter}
                options={deptOptions} 
                size="sm" 
              />

              <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '340px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search employee..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFBFC', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            <button 
              onClick={handleExport}
              style={{ background: '#fff', border: '1px solid #E5E7EB', color: '#2563EB', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <Download size={16} /> Export
            </button>
          </div>
        )}

        {/* Dynamic Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>Employee</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>Department</th>
                {leaveTypesList.map((lt) => (
                  <th key={lt.code} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {lt.name || lt.code} ({lt.code})
                  </th>
                ))}
                {hasCompOff && (
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Comp Off (Hrs)
                  </th>
                )}
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  Total (Days)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalColumns} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading leave balances...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No leave balances found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={getAvatarUrl(emp.profile_photo, emp.name, emp.id)} 
                          alt={emp.name} 
                          style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{emp.dept}</td>
                    {leaveTypesList.map((lt, cIdx) => {
                      const val = emp.balances?.[lt.code] !== undefined 
                        ? emp.balances[lt.code] 
                        : (emp[lt.code.toLowerCase()] !== undefined ? emp[lt.code.toLowerCase()] : 0);
                      const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
                      const color = colors[cIdx % colors.length];
                      return (
                        <td key={lt.code} style={{ padding: '16px 24px', fontSize: '13px', color, fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {Number(val).toFixed(1)}
                        </td>
                      );
                    })}
                    {hasCompOff && (
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#f59e0b', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {Number(emp.comp || 0).toFixed(2)}
                      </td>
                    )}
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#2563eb', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {Number(emp.total || 0).toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
          Showing {filteredRecords.length} entries
        </div>

      </div>
    </div>
  );
}
