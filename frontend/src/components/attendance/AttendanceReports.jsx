import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Calendar as CalendarIcon, Filter, Download, FileText, Activity, ChevronDown, Check, X, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiFetch, getAuthToken } from '../../lib/api';

export default function AttendanceReports() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'gps'

  // Summary Report states (original UI mockup data)
  const reportsData = [
    { id: '1', name: 'Monthly Attendance Report', type: 'Summary Report', period: 'May 1 - May 31, 2024', generated: 'May 31, 2024 10:30 AM', author: 'Admin' },
    { id: '2', name: 'Department Attendance Report', type: 'Department Report', period: 'May 1 - May 31, 2024', generated: 'May 31, 2024 10:25 AM', author: 'Admin' },
    { id: '3', name: 'Overtime Report', type: 'Overtime Report', period: 'May 1 - May 31, 2024', generated: 'May 31, 2024 10:20 AM', author: 'Admin' },
    { id: '4', name: 'Late Arrival Report', type: 'Late Report', period: 'May 1 - May 31, 2024', generated: 'May 31, 2024 10:15 AM', author: 'Admin' },
    { id: '5', name: 'Absenteeism Report', type: 'Absenteeism Report', period: 'May 1 - May 31, 2024', generated: 'May 31, 2024 10:10 AM', author: 'Admin' },
    { id: '6', name: 'Daily Attendance Summary', type: 'Daily Report', period: 'May 20, 2024', generated: 'May 20, 2024 07:00 PM', author: 'Admin' },
  ];

  const barData = [
    { name: 'May 1', present: 46, absent: 8, leave: 5, late: 12 },
    { name: '', present: 40, absent: 12, leave: 6, late: 10 },
    { name: '', present: 38, absent: 15, leave: 8, late: 9 },
    { name: 'May 8', present: 42, absent: 10, leave: 7, late: 15 },
    { name: '', present: 35, absent: 8, leave: 12, late: 11 },
    { name: '', present: 38, absent: 9, leave: 5, late: 8 },
    { name: 'May 15', present: 46, absent: 7, leave: 9, late: 14 },
    { name: '', present: 43, absent: 11, leave: 6, late: 10 },
    { name: '', present: 39, absent: 14, leave: 8, late: 12 },
    { name: 'May 22', present: 41, absent: 9, leave: 7, late: 13 },
    { name: '', present: 37, absent: 12, leave: 5, late: 9 },
    { name: '', present: 45, absent: 6, leave: 10, late: 11 },
    { name: 'May 31', present: 48, absent: 5, leave: 8, late: 15 },
  ];

  const pieData = [
    { name: 'Design', value: 48, color: '#3b82f6' },
    { name: 'HR', value: 36, color: '#10b981' },
    { name: 'Sales', value: 42, color: '#f59e0b' },
    { name: 'Development', value: 55, color: '#f97316' },
    { name: 'Marketing', value: 28, color: '#a855f7' },
    { name: 'Finance', value: 36, color: '#ec4899' },
  ];

  // GPS Geofence Report states
  const [gpsLogs, setGpsLogs] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);

  useEffect(() => {
    // Load list of employees for filters
    const loadEmployees = async () => {
      try {
        const res = await apiFetch('/employees/list'); // Fallback or list endpoint
        if (Array.isArray(res)) {
          setEmployees(res);
        } else if (res && res.employees) {
          setEmployees(res.employees);
        }
      } catch (e) {
        console.error("Failed to load employee list", e);
      }
    };
    loadEmployees();
  }, []);

  const generateGpsReport = async () => {
    setLoadingGps(true);
    try {
      const res = await apiFetch(`/attendance/reports?startDate=${startDate}&endDate=${endDate}&employeeId=${selectedEmployee}`);
      if (res.success) {
        setGpsLogs(res.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingGps(false);
  };

  useEffect(() => {
    if (activeTab === 'gps') {
      generateGpsReport();
    }
  }, [activeTab]);

  const handleExport = async (type) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/attendance/reports/${type}?startDate=${startDate}&endDate=${endDate}&employeeId=${selectedEmployee}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gps_attendance_report_${Date.now()}.${type === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <div className="hrms-content">
      {/* Tab Switchers */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'summary' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'summary' ? '#2563eb' : '#64748b', fontWeight: activeTab === 'summary' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('gps')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'gps' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'gps' ? '#2563eb' : '#64748b', fontWeight: activeTab === 'gps' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}
        >
          GPS Geofencing
        </button>
      </div>

      {activeTab === 'summary' ? (
        // Summary Tab Content (Mock design preserved)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 290px', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="hrms-card hrms-stat-card" style={{ padding: '20px 24px' }}>
                <div className="hrms-stat-title" style={{ color: '#475569', marginBottom: '12px' }}>Present Days</div>
                <div className="hrms-flex-between" style={{ alignItems: 'baseline' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>512</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                    <span className="hrms-text-xs" style={{ fontWeight: '600' }}>70.41%</span>
                  </div>
                </div>
              </div>
              <div className="hrms-card hrms-stat-card" style={{ padding: '20px 24px' }}>
                <div className="hrms-stat-title" style={{ color: '#475569', marginBottom: '12px' }}>Absent Days</div>
                <div className="hrms-flex-between" style={{ alignItems: 'baseline' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>128</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                    <span className="hrms-text-xs" style={{ fontWeight: '600' }}>17.62%</span>
                  </div>
                </div>
              </div>
              <div className="hrms-card hrms-stat-card" style={{ padding: '20px 24px' }}>
                <div className="hrms-stat-title" style={{ color: '#475569', marginBottom: '12px' }}>Leave Days</div>
                <div className="hrms-flex-between" style={{ alignItems: 'baseline' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#a855f7' }}>72</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7' }}>
                    <span className="hrms-text-xs" style={{ fontWeight: '600' }}>9.90%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hrms-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div className="hrms-flex-between" style={{ marginBottom: '24px' }}>
                <h3 className="hrms-font-semibold hrms-text-primary" style={{ margin: 0, fontSize: '15px' }}>Attendance Trend</h3>
              </div>
              <div style={{ flex: 1, position: 'relative', minHeight: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="present" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={6} />
                    <Bar dataKey="absent" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={6} />
                    <Bar dataKey="leave" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={6} />
                    <Bar dataKey="late" fill="#a855f7" radius={[2, 2, 0, 0]} barSize={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="hrms-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 className="hrms-font-semibold hrms-text-primary" style={{ margin: '0 0 24px 0', fontSize: '15px' }}>Department Wise Summary</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '100px', height: '100px', position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={48} paddingAngle={0} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {pieData.map((item, idx) => (
                    <div key={idx} className="hrms-flex-between" style={{ whiteSpace: 'nowrap' }}>
                      <div className="hrms-flex-start" style={{ gap: '8px', flexShrink: 0 }}>
                        <div style={{ width: '9px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></div>
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="hrms-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 className="hrms-font-semibold hrms-text-primary" style={{ margin: 0 }}>Reports List</h3>
            </div>
            <div className="hrms-table-container">
              <table className="hrms-table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Report Type</th>
                    <th>Period</th>
                    <th>Generated On</th>
                    <th>Generated By</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <span className="hrms-font-medium hrms-text-primary">{report.name}</span>
                      </td>
                      <td>{report.type}</td>
                      <td>{report.period}</td>
                      <td>{report.generated}</td>
                      <td>{report.author}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // GPS Geofence Report Tab Content
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* Filters card */}
          <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#334155' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#334155' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Employee</label>
              <AppDropdown
                value={selectedEmployee}
                onChange={v => setSelectedEmployee(v)}
                options={[{value:'',label:'All Employees'}]}
                size="sm"
              />
            </div>

            <button
              onClick={generateGpsReport}
              style={{ height: 38, padding: '0 20px', marginTop: 18, background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Generate Report
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, marginTop: 18 }}>
              <button
                onClick={() => handleExport('pdf')}
                style={{ height: 38, padding: '0 16px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                style={{ height: 38, padding: '0 16px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Excel (CSV)
              </button>
            </div>
          </div>

          {/* GPS logs list */}
          <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Employee</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Date & Time</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Punch</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Location</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Distance</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Inside Radius</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Browser/OS</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>IP Address</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingGps ? (
                    <tr>
                      <td colSpan="9" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading reports...</td>
                    </tr>
                  ) : gpsLogs.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No GPS attendance records found for specified range.</td>
                    </tr>
                  ) : (
                    gpsLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{log.employee_name}</td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#4B5563' }}>{new Date(log.punch_time).toLocaleString()}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563', fontWeight: 600 }}>{log.punch_type}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>{log.location_name || 'Outside Geofence'}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>{log.distance ? `${parseFloat(log.distance).toFixed(1)}m` : '0m'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: log.inside_radius === 'Yes' ? '#ECFDF5' : '#FEF2F2',
                            color: log.inside_radius === 'Yes' ? '#059669' : '#DC2626'
                          }}>
                            {log.inside_radius === 'Yes' ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#6B7280', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.device_info}>
                          {log.browser}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: log.status === 'Success' ? '#EFF6FF' : '#FEF2F2',
                            color: log.status === 'Success' ? '#2563EB' : '#DC2626'
                          }}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
