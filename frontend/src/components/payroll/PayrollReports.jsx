import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Search, LineChart, FileText, IndianRupee, PieChart as PieChartIcon, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PayrollReports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/payroll/reports')
      .then(data => {
        setReportsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load payroll reports:", err);
        setLoading(false);
      });
  }, []);

  const totalPayrollFormatted = reportsData?.totalPayroll ? `₹ ${(reportsData.totalPayroll / 100000).toFixed(1)} L` : '₹ 0.0 L';
  const ytdGrossFormatted = reportsData?.ytdGross ? `₹ ${(reportsData.ytdGross / 100000).toFixed(1)} L` : '₹ 0.0 L';
  const ytdDeductionsFormatted = reportsData?.ytdDeductions ? `₹ ${(reportsData.ytdDeductions / 100000).toFixed(1)} L` : '₹ 0.0 L';
  const ytdNetFormatted = reportsData?.ytdNet ? `₹ ${(reportsData.ytdNet / 100000).toFixed(1)} L` : '₹ 0.0 L';

  const kpiData = [
    { title: 'Total Payroll (Current)', value: totalPayrollFormatted, icon: <IndianRupee size={20} color="#2563EB" />, bgColor: '#EFF6FF' },
    { title: 'Gross Salary YTD', value: ytdGrossFormatted, icon: <LineChart size={20} color="#10B981" />, bgColor: '#ECFDF5' },
    { title: 'Total Deductions YTD', value: ytdDeductionsFormatted, icon: <PieChartIcon size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
    { title: 'Net Salary Paid YTD', value: ytdNetFormatted, icon: <FileText size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
  ];

  const barData = reportsData?.departmentSalaries || [];

  const pieData = [
    { name: 'Basic Salary (50%)', value: 50, color: '#2563EB' },
    { name: 'House Rent Allowance (20%)', value: 20, color: '#10B981' },
    { name: 'Special Allowances (30%)', value: 30, color: '#F59E0B' }
  ];

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    border: '1px solid #F1F5F9',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>

      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>Payroll Analytics & Reports</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Corporate compensation and department disbursement reports from the database</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {kpiData.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.title}</div>
              <div style={{ fontSize: '20px', color: '#1E293B', fontWeight: '800' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        
        {/* Department Salary Distribution */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>
            Department Salary Allocation
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            ) : barData.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                <AlertCircle size={28} style={{ marginBottom: '8px' }} />
                <span>No department salary structures configured yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="dept" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip formatter={(value) => [`₹ ${Number(value).toLocaleString('en-IN')}`, 'Salary Allocation']} />
                  <Bar dataKey="Salary" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Salary Component Breakdown */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>
            Statutory Component Ratios
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {pieData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                  <span style={{ color: '#475569' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
