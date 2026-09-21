import React, { useState, useEffect } from 'react';
import { BarChart3, Target, Star, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function TeamPerformanceModule() {
  const [loading, setLoading] = useState(true);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  const [totalGoalsCount, setTotalGoalsCount] = useState(0);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const goalsRes = await apiFetch('/goals');
        if (goalsRes && goalsRes.success && goalsRes.data && Array.isArray(goalsRes.data.goals)) {
          const goals = goalsRes.data.goals;
          setTotalGoalsCount(goals.length);
          if (goals.length > 0) {
            const sumPct = goals.reduce((acc, g) => acc + (Number(g.completion_percentage || g.progress) || 0), 0);
            const avg = Math.round(sumPct / goals.length);
            setOverallScore(avg);

            const formatted = goals.map((g, idx) => {
              const pct = Number(g.completion_percentage || g.progress) || 0;
              const ratingVal = (pct / 20).toFixed(1);
              return {
                id: g.id || idx + 1,
                name: g.employee_name || 'Team Member',
                empId: g.employee_id ? `EMP${String(g.employee_id).padStart(4, '0')}` : `GOAL-${g.id}`,
                role: g.goal_title || g.title || 'Goal Target',
                score: `${ratingVal} / 5.0`,
                goalPct: pct,
                kpis: `${pct}%`,
                status: g.status || (pct >= 100 ? 'Completed' : (pct > 0 ? 'On Track' : 'Not Started'))
              };
            });
            setTeamPerformance(formatted);
          } else {
            setOverallScore(0);
            setTeamPerformance([]);
          }
        } else {
          setOverallScore(0);
          setTotalGoalsCount(0);
          setTeamPerformance([]);
        }
      } catch (err) {
        console.error("Failed to load team performance from database:", err);
        setOverallScore(0);
        setTotalGoalsCount(0);
        setTeamPerformance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

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
        <p className="text-sm font-semibold text-slate-600">Loading database team performance...</p>
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
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Team Performance</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#DBEAFE' }}>
            Goal Achievement & KPI Analytics for Software Development Team
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
          <ShieldCheck size={16} /> Database Metrics
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Overall Team Score</span>
            <strong className="text-2xl font-extrabold text-slate-900">{overallScore}%</strong>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              {overallScore > 0 ? (overallScore >= 80 ? 'High Performing Team' : 'Progressing Team') : 'No Evaluation Data'}
            </span>
          </div>
        </div>

        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Target size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Goals Evaluated</span>
            <strong className="text-2xl font-extrabold text-blue-600">{totalGoalsCount}</strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">Active Objectives</span>
          </div>
        </div>

        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Avg Team Rating</span>
            <strong className="text-2xl font-extrabold text-slate-900">
              {overallScore > 0 ? (overallScore / 20).toFixed(1) : '0.0'} / 5.0
            </strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">Evaluation Score</span>
          </div>
        </div>
      </div>

      {/* Individual Team Member Performance Breakdown */}
      <div style={cardStyle}>
        <h3 className="text-base font-bold text-slate-900 mb-4">Individual Team Member Performance</h3>
        {teamPerformance.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
            <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
            No performance records found in database for team members.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Appraisal Rating</th>
                  <th className="py-3 px-4">Goal Progress</th>
                  <th className="py-3 px-4">KPI Score</th>
                  <th className="py-3 px-4">Performance Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {teamPerformance.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-bold">{m.name}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{m.empId} • {m.role}</span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{m.score}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${m.goalPct}%` }} className="h-full bg-blue-600 rounded-full" />
                        </div>
                        <span className="font-bold text-blue-600">{m.goalPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{m.kpis}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
                        {m.status}
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

export default TeamPerformanceModule;
