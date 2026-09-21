import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, ChevronDown, Users, Award, UserCheck, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch } from '../../lib/api';

export function PerformanceReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: { score: '0.00', appraisals: 0, promotions: 0, goals: '0%' },
    ratingPie: [],
    summary: []
  });

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const shortMonth = d.toLocaleString('en-US', { month: 'short' });
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      
      options.push({
        value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: `${shortMonth} 1 – ${shortMonth} ${lastDay}, ${year}`
      });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/reports/performance?month=${encodeURIComponent(selectedMonth)}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load performance reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ['Department', 'Avg Rating', 'Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'];
    const rows = data.summary.map(r => [r.dept, r.avg, r.out, r.exc, r.meets, r.needs, r.un]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `performance_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading Performance Reports...</div>;
  }

  const KpiCard = ({ label, value, pct, iconBg, iconColor, icon: Icon }) => (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(15,23,42,.05)', padding: '16px 20px', flex: '1 1 0', minWidth: 140,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
        {pct && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{pct}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: '0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <button onClick={() => navigate('/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0 }}>
            <ArrowLeft size={16} /> Back to Reports
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Performance Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Track corporate goals and employee review summaries</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151',
          }}>
            <Calendar size={14} color="#6B7280" />
            <AppDropdown
              value={selectedMonth}
              onChange={v => setSelectedMonth(v)}
              options={monthOptions}
              size="sm"
              style={{ minWidth: 160 }}
            />
          </div>

          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
            background: '#FFF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Avg. Appraisal Rating" value={data.kpis.score} pct="out of 5.0" iconBg="#DBEAFE" iconColor="#2563EB" icon={Sparkles} />
        <KpiCard label="Appraisals Done" value={data.kpis.appraisals} pct="completed" iconBg="#DCFCE7" iconColor="#16A34A" icon={UserCheck} />
        <KpiCard label="Total Promotions" value={data.kpis.promotions} pct="this month" iconBg="#FEF3C7" iconColor="#D97706" icon={Award} />
        <KpiCard label="Goal Completion Rate" value={data.kpis.goals} pct="average progress" iconBg="#FEE2E2" iconColor="#DC2626" icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        
        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(15,23,42,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Performance Summary by Department</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  {['Department', 'Avg Rating', 'Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 44 }}>
                    <td style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.dept}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151', fontWeight: 600 }}>{r.avg}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151' }}>{r.out}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151' }}>{r.exc}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151' }}>{r.meets}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151' }}>{r.needs}</td>
                    <td style={{ padding: '0 12px', fontSize: 12, color: '#374151' }}>{r.un}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut Chart */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(15,23,42,.06)', padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111827' }}>Rating Distribution</h3>
          {data.ratingPie.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>No Performance ratings logged yet</div>
          ) : (
            <>
            <div style={{ width: '100%', height: 160, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.ratingPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                    {data.ratingPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{data.kpis.appraisals}</span>
                <span style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Reviews</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {data.ratingPie.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} /> {item.name}
                  </span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}

export default PerformanceReports;
