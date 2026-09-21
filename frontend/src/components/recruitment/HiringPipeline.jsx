import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Clock, TrendingUp, CheckCircle, Users, Plus, X } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

export default function HiringPipeline() {
  const { addToast } = useToast();
  const [pipelineList, setPipelineList] = useState([]);
  const [totals, setTotals] = useState({ applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 });
  const [insights, setInsights] = useState({ avgTimeToHire: '28 Days', interviewConversion: '0%', offerAcceptanceRate: '0%', overallConversion: '0%' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    sourceName: '',
    description: '',
    status: 'Active'
  });

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

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/app/pipeline/stats', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTotals(data.data.totals);
        setPipelineList(data.data.breakdown || []);
        setInsights(data.data.insights);
      } else {
        addToast(data.message || 'Failed to load pipeline statistics', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getProgressBarColor = (val) => {
    if (val > 10) return '#10B981';
    if (val > 6) return '#2952E3';
    return '#F59E0B';
  };

  const handleSourceSubmit = async (e) => {
    e.preventDefault();
    if (!sourceForm.sourceName) return;

    setSubmitting(true);
    try {
      const res = await fetch('/app/pipeline/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          source_name: sourceForm.sourceName.trim(),
          description: sourceForm.description.trim(),
          status: sourceForm.status
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Recruitment source created successfully!', 'success');
        setShowSourceModal(false);
        setSourceForm({ sourceName: '', description: '', status: 'Active' });
      } else {
        addToast(data.message || 'Failed to create recruitment source', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Hiring Pipeline</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Track hiring pipeline and conversion rates</p>
        </div>
        {hasPermission('recruitment', 'hiring_pipeline', 'create') && (
          <button
            onClick={() => setShowSourceModal(true)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            <Plus size={16} /> Add Recruitment Source
          </button>
        )}
      </div>

      {/* Horizontal Pipeline */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ flex: 1, background: '#EEF2FF', borderRadius: '12px 0 0 12px', padding: '24px', position: 'relative' }}>
          <div style={{ fontSize: '14px', color: '#6366F1', fontWeight: '600' }}>Applied</div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginTop: '8px' }}>{totals.applied}</div>
          <div style={{ position: 'absolute', right: '-12px', top: '50%', width: '24px', height: '24px', background: '#FFF', transform: 'translateY(-50%) rotate(45deg)', zIndex: 1 }}></div>
        </div>
        <div style={{ flex: 1, background: '#F5F3FF', padding: '24px', position: 'relative' }}>
          <div style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '600' }}>Screening</div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginTop: '8px' }}>{totals.screening}</div>
          <div style={{ position: 'absolute', right: '-12px', top: '50%', width: '24px', height: '24px', background: '#FFF', transform: 'translateY(-50%) rotate(45deg)', zIndex: 1 }}></div>
        </div>
        <div style={{ flex: 1, background: '#FFFBEB', padding: '24px', position: 'relative' }}>
          <div style={{ fontSize: '14px', color: '#F59E0B', fontWeight: '600' }}>Interview</div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginTop: '8px' }}>{totals.interview}</div>
          <div style={{ position: 'absolute', right: '-12px', top: '50%', width: '24px', height: '24px', background: '#FFF', transform: 'translateY(-50%) rotate(45deg)', zIndex: 1 }}></div>
        </div>
        <div style={{ flex: 1, background: '#F0FDF4', padding: '24px', position: 'relative' }}>
          <div style={{ fontSize: '14px', color: '#10B981', fontWeight: '600' }}>Offered</div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginTop: '8px' }}>{totals.offer}</div>
          <div style={{ position: 'absolute', right: '-12px', top: '50%', width: '24px', height: '24px', background: '#FFF', transform: 'translateY(-50%) rotate(45deg)', zIndex: 1 }}></div>
        </div>
        <div style={{ flex: 1, background: '#ECFDF5', borderRadius: '0 12px 12px 0', padding: '24px' }}>
          <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>Hired</div>
          <div style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', marginTop: '8px' }}>{totals.hired}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
        
        {/* Analytics Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading pipeline data...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Job Title</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Applied</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Screening</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Interview</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Offered</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'center' }}>Hired</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', textAlign: 'right' }}>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No candidates found in recruitment pipeline</td>
                    </tr>
                  ) : (
                    pipelineList.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: index === pipelineList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>{row.job}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.applied}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.screening}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.interview}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.offer}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'center' }}>{row.hired}</td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <div style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{row.conv}%</div>
                            <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: '#F1F5F9' }}>
                              <div style={{ height: '100%', borderRadius: '3px', background: getProgressBarColor(row.conv), width: `${row.conv * 0.6}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pipeline Insights */}
        <div style={{ ...cardStyle, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Pipeline Insights</h3>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#2952E3" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Average Time to Hire</div>
              <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{insights.avgTimeToHire}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#8B5CF6" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Interview Conversion Rate</div>
              <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{insights.interviewConversion}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Offer Acceptance Rate</div>
              <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{insights.offerAcceptanceRate}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#EF4444" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Overall Conversion Rate</div>
              <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{insights.overallConversion}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Recruitment Source Modal (1100px Standard) */}
      {showSourceModal && hasPermission('recruitment', 'hiring_pipeline', 'create') && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowSourceModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Recruitment Source</h2>
                <p className="text-sm text-slate-500 mt-1">Configure candidate sourcing channel and attribution tracking.</p>
              </div>
              <button onClick={() => setShowSourceModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSourceSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Source Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={sourceForm.sourceName} onChange={e => setSourceForm({ ...sourceForm, sourceName: e.target.value })} placeholder="e.g. LinkedIn Jobs / Employee Referral" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                value={sourceForm.status}
                onChange={v => setSourceForm({ ...sourceForm, status: v })}
                options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]}
                size="sm"
              />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea value={sourceForm.description} onChange={e => setSourceForm({ ...sourceForm, description: e.target.value })} placeholder="Enter channel details or agency contract notes..." style={{ height: '100px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowSourceModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Source'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
