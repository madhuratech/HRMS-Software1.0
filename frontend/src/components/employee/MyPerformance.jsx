import React, { useState, useEffect } from 'react';
import { Award, Target, Star, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function MyPerformance() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [userName, setUserName] = useState('Dhilipan P');
  const [empId, setEmpId] = useState('EMP0015');

  useEffect(() => {
    const auth = localStorage.getItem('hrms_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        if (parsed.user && parsed.user.name) setUserName(parsed.user.name);
        if (parsed.user && parsed.user.emp_id) setEmpId(parsed.user.emp_id);
      } catch (e) {}
    }

    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/goals');
        if (res && res.success && Array.isArray(res.data)) {
          setGoals(res.data);
        } else {
          setGoals([]);
        }
      } catch (err) {
        console.error("Failed to load performance goals:", err);
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
        <p className="text-sm font-semibold text-slate-600">Loading performance data...</p>
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
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>My Performance</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#DBEAFE' }}>
            Private Appraisal & Goals • {userName} ({empId})
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
          <ShieldCheck size={16} /> Individual Score
        </div>
      </div>

      {/* Top Rating Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Overall Rating</span>
            <strong className="text-2xl font-extrabold text-slate-900">4.8 / 5.0</strong>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Exceeds Expectations</span>
          </div>
        </div>

        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Target size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Active Goals</span>
            <strong className="text-2xl font-extrabold text-blue-600">{goals.length}</strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">Q3 2026 Objectives</span>
          </div>
        </div>

        <div style={cardStyle} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Award size={28} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Appraisal Status</span>
            <strong className="text-2xl font-extrabold text-emerald-600">Approved</strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">Annual Review 2026</span>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div style={cardStyle}>
        <h3 className="text-base font-bold text-slate-900 mb-4">Active Objectives & Goals</h3>
        {goals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
            <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
            No performance goals assigned in database.
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(g => (
              <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <h4 className="font-bold text-slate-900">{g.title || g.goal_name}</h4>
                  <span className="font-mono text-slate-500">Target: {g.target_date || '31 Aug 2026'}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${g.progress || 90}%` }} className="h-full bg-blue-600 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default MyPerformance;
