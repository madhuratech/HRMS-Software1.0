import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Briefcase, Users, CalendarDays, FileCheck, UserCheck, TrendingUp, TrendingDown, MoreHorizontal, X, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Label } from 'recharts';

export default function RecruitmentDashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const getAuthToken = () => {
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.token || 'mock_jwt_token';
      } catch (e) {
        return 'mock_jwt_token';
      }
    }
    return 'mock_jwt_token';
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };

      // Fetch Stats
      const statsRes = await fetch('/app/requirements/dashboard', { headers });
      const statsData = await statsRes.json();

      // Fetch Recent Jobs
      const jobsRes = await fetch('/app/requirements?limit=5', { headers });
      const jobsData = await jobsRes.json();

      if (statsData.success && jobsData.success) {
        setStats(statsData.data);
        setRecentJobs(jobsData.data.requirements || []);
      } else {
        setErrorMsg(statsData.message || jobsData.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #F1F5F9',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: '"Inter", sans-serif' }}>
        <p style={{ color: '#64748B' }}>Loading Recruitment Dashboard...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: '"Inter", sans-serif', gap: '16px' }}>
        <AlertTriangle size={48} color="#EF4444" />
        <p style={{ color: '#EF4444', fontWeight: '600' }}>{errorMsg}</p>
        <button onClick={fetchDashboardData} style={{ padding: '8px 16px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  // Map Live KPI Data
  const totalOpenings = stats?.total?.[0]?.count || 0;
  const openReqs = stats?.open?.[0]?.count || 0;
  const pendingApproval = stats?.pendingApproval?.[0]?.count || 0;
  const criticalHiring = stats?.critical?.[0]?.count || 0;
  const monthOpenings = stats?.monthOpenings?.[0]?.count || 0;

  const kpis = [
    { title: 'Total Openings', value: totalOpenings.toString(), trend: '10%', isUp: true, icon: <Briefcase size={16} color="#2952E3" />, bgColor: '#EFF6FF', arrowBg: '#EFF6FF', arrowColor: '#2952E3' },
    { title: 'Open Requirements', value: openReqs.toString(), trend: '15%', isUp: true, icon: <Users size={16} color="#10B981" />, bgColor: '#ECFDF5', arrowBg: '#ECFDF5', arrowColor: '#10B981' },
    { title: 'Pending Approval', value: pendingApproval.toString(), trend: '5%', isUp: false, icon: <CalendarDays size={16} color="#8B5CF6" />, bgColor: '#F5F3FF', arrowBg: '#F5F3FF', arrowColor: '#8B5CF6' },
    { title: 'Critical Hiring', value: criticalHiring.toString(), trend: '20%', isUp: true, icon: <FileCheck size={16} color="#EF4444" />, bgColor: '#FEF2F2', arrowBg: '#FEF2F2', arrowColor: '#EF4444' },
    { title: 'This Month Openings', value: monthOpenings.toString(), trend: '114%', isUp: true, icon: <UserCheck size={16} color="#10B981" />, bgColor: '#ECFDF5', arrowBg: '#ECFDF5', arrowColor: '#10B981' },
  ];

  // Map Line Graph data using Monthly Trend
  const lineChartData = (stats?.monthlyTrend || []).map(item => ({
    date: item.month,
    Openings: item.count
  }));

  // Fallback if empty
  if (lineChartData.length === 0) {
    lineChartData.push({ date: 'No Data', Openings: 0 });
  }

  // Map status donut data
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
  const statusPieData = (stats?.statusChart || []).map((item, idx) => ({
    name: item.status,
    value: item.count,
    color: COLORS[idx % COLORS.length]
  }));

  const totalStatusCount = statusPieData.reduce((acc, curr) => acc + curr.value, 0);

  // Map hiring manager statistics
  const topJobs = (stats?.hiringManagerStats || []).map(item => ({
    title: item.manager_name,
    apps: item.count
  }));

  // Funnel Data derived from status count
  const funnelData = [
    { stage: 'Total Openings', value: totalOpenings, color: '#3B82F6' },
    { stage: 'Open', value: openReqs, color: '#6366F1' },
    { stage: 'Pending Approval', value: pendingApproval, color: '#8B5CF6' },
    { stage: 'Critical', value: criticalHiring, color: '#A855F7' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', background: '#F8FAFC', paddingBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Recruitment Dashboard</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Overview of recruitment activities and key metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{kpi.title}</div>
            </div>
            <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginLeft: '44px', lineHeight: '1' }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '44px', fontSize: '12px', color: '#94A3B8' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: kpi.arrowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.arrowColor }}>
                {kpi.isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
              </div>
              <span style={{ color: kpi.arrowColor, fontWeight: '600' }}>{kpi.trend}</span> vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: '24px' }}>
        
        {/* Openings Over Time Area Chart */}
        <div style={{ ...cardStyle, padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Openings Trend</h3>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="top" align="center" height={36} />
                <Area type="monotone" dataKey="Openings" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications by Status Donut */}
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Requirements by Status</h3>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '150px', height: '150px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} innerRadius={55} outerRadius={70} paddingAngle={0} dataKey="value" cx="50%" cy="50%" stroke="none">
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label value={totalStatusCount.toString()} position="center" fill="#1E293B" style={{ fontSize: '24px', fontWeight: '700' }} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', color: '#64748B' }}>Total</div>
            </div>
            
            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginLeft: '20px' }}>
              {statusPieData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '500' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></div>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#1E293B' }}>{item.value}</span>
                    <span style={{ color: '#94A3B8' }}>({((item.value / (totalStatusCount || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements by Hiring Manager */}
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Hiring Manager Stats</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', fontWeight: '600', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
            <span>Manager</span>
            <span>Requirements</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', flex: 1 }}>
            {topJobs.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '20px' }}>No stats available</div>
            ) : (
              topJobs.map((job, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#334155', fontWeight: '500' }}>{job.title}</span>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>{job.apps}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Recent Job Openings Table */}
        <div style={{ ...cardStyle, padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Recent Job Openings</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>Job Title</th>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>Department</th>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>Location</th>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>Type</th>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Vacancies</th>
                  <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '600', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>No recent openings</td>
                  </tr>
                ) : (
                  recentJobs.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#334155', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>{row.job_title}</td>
                      <td style={{ padding: '12px 0', fontSize: '12px', color: '#475569', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>{row.department_name}</td>
                      <td style={{ padding: '12px 0', fontSize: '12px', color: '#475569', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>{row.location}</td>
                      <td style={{ padding: '12px 0', fontSize: '12px', color: '#475569', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>{row.employment_type}</td>
                      <td style={{ padding: '12px 0', fontSize: '12px', fontWeight: '600', color: '#1E293B', textAlign: 'center', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>{row.vacancies}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', borderBottom: index !== recentJobs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funnel Widget Row */}
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Recruitment Funnel</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            
            {/* SVG Funnel */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <svg width="140" height="180" viewBox="0 0 140 180">
                <polygon points="0,0 140,0 115,40 25,40" fill="#3B82F6" />
                <polygon points="26,42 114,42 98,82 42,82" fill="#6366F1" opacity="0.9" />
                <polygon points="43,84 97,84 84,124 56,124" fill="#8B5CF6" opacity="0.8" />
                <polygon points="57,126 83,126 73,166 67,166" fill="#A855F7" opacity="0.7" />
              </svg>
            </div>

            {/* Funnel Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginLeft: '16px', flex: 1 }}>
              {funnelData.map((stage, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '500' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: stage.color }}></div>
                    {stage.stage}
                  </div>
                  <div style={{ fontWeight: '600', color: '#1E293B' }}>{stage.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
