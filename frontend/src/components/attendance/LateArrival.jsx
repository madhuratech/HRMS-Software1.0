import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { getAvatarUrl } from '../../lib/utils';
import { Calendar as CalendarIcon, Filter, MoreVertical, TrendingUp, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export default function LateArrival() {
  const [lateData, setLateData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/attendance/late-arrivals')
      .then(data => {
        if (Array.isArray(data)) {
          setLateData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load late arrivals:", err);
        setLoading(false);
      });
  }, []);

  const chartData = [
    { day: 'May 1', value: 5 }, { day: 'May 3', value: 12 }, { day: 'May 5', value: 8 },
    { day: 'May 7', value: 15 }, { day: 'May 9', value: 10 }, { day: 'May 11', value: 25 },
    { day: 'May 13', value: 18 }, { day: 'May 15', value: 30 }, { day: 'May 17', value: 20 },
    { day: 'May 19', value: 45 }, { day: 'May 21', value: 25 }, { day: 'May 23', value: 55 },
    { day: 'May 25', value: 40 }, { day: 'May 27', value: 50 }, { day: 'May 29', value: 65 },
  ];

  return (
    <div className="hrms-content">
      {/* Header and Toolbar */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '16px' }}>
        <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0, gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '220px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>May 1 - May 31, 2024</span>
            <CalendarIcon size={16} style={{ color: '#64748b' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '160px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Departments</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      <div style={{ width: '100%', flex: 1, display: 'flex' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Chart */}
            <div className="hrms-card" style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3 className="hrms-font-semibold hrms-text-primary" style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Late Arrivals Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>32</span>
                <span className="hrms-text-sm hrms-text-muted" style={{ marginBottom: '4px' }}>Total Late Arrivals</span>
                <span className="hrms-text-xs" style={{ color: '#64748b' }}><span style={{ color: '#10b981', fontWeight: '600' }}>↑ 12%</span> vs Apr 1 - Apr 30, 2024</span>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Widget */}
            <div className="hrms-card" style={{ padding: '24px' }}>
              <h3 className="hrms-font-semibold hrms-text-primary" style={{ margin: '0 0 24px 0', fontSize: '15px' }}>Top Late Employees</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {lateData.map((record) => (
                  <div key={record.id} className="hrms-flex-between">
                    <div className="hrms-user-info" style={{ gap: '12px' }}>
                      <img
                        src={getAvatarUrl(record.avatar, record.employee)}
                        alt={record.employee}
                        className="hrms-avatar"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.employee || 'User')}&background=2563EB&color=fff&bold=true`;
                        }}
                      />
                      <span className="hrms-font-medium hrms-text-primary" style={{ fontSize: '13px' }}>{record.employee}</span>
                    </div>
                    <span className="hrms-font-medium hrms-text-sm" style={{ color: '#64748b' }}>
                      {record.id === '1' ? '6 Times' : record.id === '2' ? '5 Times' : record.id === '3' ? '4 Times' : '3 Times'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="hrms-card" style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Employee</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Check In Time</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Late By</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lateData.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div className="hrms-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={getAvatarUrl(record.avatar, record.employee)}
                          alt={record.employee}
                          className="hrms-avatar"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.employee || 'User')}&background=2563EB&color=fff&bold=true`;
                          }}
                        />
                        <span className="hrms-font-medium hrms-text-primary">{record.employee}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', verticalAlign: 'middle', color: '#475569', fontSize: '13px' }}>{record.date}</td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', verticalAlign: 'middle', color: '#475569', fontSize: '13px', fontWeight: '500' }}>{record.checkIn}</td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', verticalAlign: 'middle', color: '#475569', fontSize: '13px' }}>{record.delay}</td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{
                        padding: '4px 12px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        backgroundColor: '#fef2f2',
                        color: '#ef4444'
                      }}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
