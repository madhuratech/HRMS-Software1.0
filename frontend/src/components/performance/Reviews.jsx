import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { ChevronDown, Plus, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, Eye, Calculator, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { canCreate, checkActionPermission } from '../../lib/permissions';

export default function Reviews() {
  const { addToast } = useToast();
  const [reviewsList, setReviewsList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Evaluation Matrix State
  const [availableGoals, setAvailableGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');

  // KPI Dashboard Stats
  const [kpiData, setKpiData] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    rate: '0%',
    chartData: [
      { name: 'Completed', value: 0, color: '#10B981' },
      { name: 'In Progress', value: 0, color: '#2952E3' },
      { name: 'Pending', value: 0, color: '#F59E0B' }
    ]
  });

  const [formData, setFormData] = useState({
    employee: '',
    goal_id: '',
    reviewPeriod: 'Q2 2026',
    reviewer: '',
    type: 'Manager Review',
    strengths: '',
    improvement: '',
    goals: '',
    comments: '',
    status: 'In Progress'
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

  const fetchMeta = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getAuthToken()}` };

      // Fetch departments
      try {
        const deptRes = await fetch('/app/employees/lookup/departments', { headers });
        const deptData = await deptRes.json();
        if (Array.isArray(deptData) && deptData.length > 0) {
          setDepartments(deptData);
        } else {
          const metaRes = await fetch('/app/requirements/meta/all', { headers });
          const metaData = await metaRes.json();
          if (metaData && (metaData.departments || metaData.branches)) {
            setDepartments(metaData.departments || metaData.branches);
          }
        }
      } catch (e) {
        console.error('Failed to load departments:', e);
      }

      // Fetch active employees
      const empRes = await fetch('/app/employees?status=Active&limit=500', { headers });
      const empData = await empRes.json();
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }
    } catch (err) {
      console.error('Failed to load review metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/app/reviews/dashboard', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/app/reviews?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterDept && filterDept !== 'All Departments') {
        url += `&department_id=${encodeURIComponent(filterDept)}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setReviewsList(resData.data.reviews || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast(resData.message || 'Failed to fetch reviews', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept]);

  useEffect(() => {
    fetchReviews();
    fetchDashboardStats();
  }, [page, fetchReviews, fetchDashboardStats]);

  // Load Employee Goal & KRA Hierarchy when Employee changes
  const handleEmployeeChange = async (empId) => {
    setFormData(prev => ({ ...prev, employee: empId }));
    setSelectedGoalId('');
    setEvaluations([]);
    setAvailableGoals([]);

    if (!empId) return;

    setLoadingTree(true);
    try {
      const res = await fetch(`/app/reviews/employee-tree/${empId}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
        setAvailableGoals(resData.data);
        // Default select first goal
        const firstGoal = resData.data[0];
        setSelectedGoalId(String(firstGoal.id));
        setFormData(prev => ({ ...prev, goal_id: String(firstGoal.id) }));
        populateEvaluationsFromGoal(firstGoal);
      } else {
        setAvailableGoals([]);
        // Default empty evaluation row
        setEvaluations([]);
      }
    } catch (e) {
      console.error('Failed to load employee hierarchy:', e);
    } finally {
      setLoadingTree(false);
    }
  };

  const populateEvaluationsFromGoal = (goal) => {
    const items = [];
    if (goal && Array.isArray(goal.kras)) {
      goal.kras.forEach(kra => {
        if (Array.isArray(kra.kpis) && kra.kpis.length > 0) {
          kra.kpis.forEach(kpi => {
            items.push({
              kra_id: kra.id,
              kra_title: kra.kra_title,
              kra_weightage: kra.weightage || 0,
              kpi_id: kpi.id,
              kpi_name: kpi.kpi_name,
              measurement_type: kpi.measurement_type || 'Percentage',
              target_value: kpi.target_value || 100,
              actual_achievement: ''
            });
          });
        } else {
          // KRA with no predefined KPIs
          items.push({
            kra_id: kra.id,
            kra_title: kra.kra_title,
            kra_weightage: kra.weightage || 0,
            kpi_id: null,
            kpi_name: 'Key Outcome Metric',
            measurement_type: 'Percentage',
            target_value: 100,
            actual_achievement: ''
          });
        }
      });
    }
    setEvaluations(items);
  };

  const handleGoalChange = (goalId) => {
    setSelectedGoalId(goalId);
    setFormData(prev => ({ ...prev, goal_id: goalId }));
    const goal = availableGoals.find(g => String(g.id) === String(goalId));
    if (goal) {
      populateEvaluationsFromGoal(goal);
    }
  };

  const addCustomEvaluationRow = () => {
    setEvaluations(prev => [
      ...prev,
      {
        kra_id: null,
        kra_title: 'Key Result Area',
        kra_weightage: 20,
        kpi_id: null,
        kpi_name: 'Performance Metric',
        measurement_type: 'Percentage',
        target_value: 100,
        actual_achievement: ''
      }
    ]);
  };

  const removeEvaluationRow = (idx) => {
    setEvaluations(prev => prev.filter((_, i) => i !== idx));
  };

  const updateEvaluationItem = (idx, field, value) => {
    setEvaluations(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Client-side Live Calculation
  const calculationSummary = useMemo(() => {
    const kraMap = new Map();
    let totalWeightage = 0;

    evaluations.forEach(item => {
      const kraKey = item.kra_id ? String(item.kra_id) : (item.kra_title || 'General KRA');
      if (!kraMap.has(kraKey)) {
        const w = Number(item.kra_weightage) || 0;
        kraMap.set(kraKey, {
          kra_title: item.kra_title || 'Key Result Area',
          kra_weightage: w,
          kpis: []
        });
        totalWeightage += w;
      }

      const targetVal = parseFloat(item.target_value) || 0;
      const actualVal = parseFloat(item.actual_achievement) || 0;
      let achPct = 0;
      if (targetVal > 0) {
        achPct = Math.min(200, Math.round(((actualVal / targetVal) * 100) * 100) / 100);
      } else if (actualVal > 0) {
        achPct = 100;
      } else {
        achPct = 0;
      }

      kraMap.get(kraKey).kpis.push({
        ...item,
        achPct
      });
    });

    let finalScore = 0;
    const kraSummaries = [];

    kraMap.forEach((kra, key) => {
      const count = kra.kpis.length;
      let kraAchPct = 0;
      if (count > 0) {
        const sumAch = kra.kpis.reduce((acc, k) => acc + k.achPct, 0);
        kraAchPct = Math.round((sumAch / count) * 100) / 100;
      }
      const kraWeighted = Math.round(((kraAchPct * kra.kra_weightage) / 100) * 100) / 100;
      finalScore += kraWeighted;

      kraSummaries.push({
        key,
        title: kra.kra_title,
        weightage: kra.kra_weightage,
        achievementPct: kraAchPct,
        weightedScore: kraWeighted,
        kpiCount: count
      });
    });

    finalScore = Math.round(finalScore * 100) / 100;
    totalWeightage = Math.round(totalWeightage * 100) / 100;
    const isValidWeightage = evaluations.length === 0 || Math.abs(totalWeightage - 100) <= 0.05;
    const ratingOut5 = Math.min(5, Math.max(1, Math.round((finalScore / 20) * 10) / 10)).toFixed(1);

    return {
      kraSummaries,
      finalScore,
      totalWeightage,
      isValidWeightage,
      ratingOut5
    };
  }, [evaluations]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!checkActionPermission('reviews', 'CREATE')) {
      return;
    }
    if (!formData.employee || !formData.reviewer || !formData.reviewPeriod) {
      addToast('Please fill in all required fields (Employee, Reviewer, Review Period).', 'error');
      return;
    }

    if (formData.status === 'Completed' && !calculationSummary.isValidWeightage && evaluations.length > 0) {
      addToast(`Total KRA weightage must sum to 100% to mark as Completed (currently ${calculationSummary.totalWeightage}%).`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(formData.employee, 10),
        goal_id: formData.goal_id ? parseInt(formData.goal_id, 10) : null,
        review_period: formData.reviewPeriod.trim(),
        reviewer_id: formData.reviewer.trim(),
        type: formData.type || 'Manager Review',
        overall_rating: calculationSummary.ratingOut5,
        final_score: calculationSummary.finalScore,
        total_weightage: calculationSummary.totalWeightage,
        strengths: formData.strengths ? formData.strengths.trim() : '',
        improvement: formData.improvement ? formData.improvement.trim() : '',
        goals: formData.goals ? formData.goals.trim() : '',
        comments: formData.comments ? formData.comments.trim() : '',
        status: formData.status || 'In Progress',
        evaluations: evaluations.map(ev => ({
          kra_id: ev.kra_id ? parseInt(ev.kra_id, 10) : null,
          kra_title: ev.kra_title,
          kra_weightage: Number(ev.kra_weightage) || 0,
          kpi_id: ev.kpi_id ? parseInt(ev.kpi_id, 10) : null,
          kpi_name: ev.kpi_name,
          measurement_type: ev.measurement_type,
          target_value: parseFloat(ev.target_value) || 0,
          actual_achievement: parseFloat(ev.actual_achievement) || 0
        }))
      };

      const res = await fetch('/app/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('Performance Review evaluated & recorded successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          employee: '',
          goal_id: '',
          reviewPeriod: 'Q2 2026',
          reviewer: '',
          type: 'Manager Review',
          strengths: '',
          improvement: '',
          goals: '',
          comments: '',
          status: 'In Progress'
        });
        setEvaluations([]);
        fetchReviews();
        fetchDashboardStats();
      } else {
        addToast(resData.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (reviewId) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/app/reviews/${reviewId}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setSelectedReview(resData.data);
      } else {
        addToast('Failed to load review details', 'error');
        setShowDetailModal(false);
      }
    } catch (err) {
      addToast('Failed to fetch review details', 'error');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#DCFCE7', color: '#15803D' };
      case 'In Progress': return { bg: '#FEF3C7', color: '#D97706' };
      default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>

      {/* Review Snapshot Detail Modal */}
      {showDetailModal && (
        <>
          <div onClick={() => setShowDetailModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 880, maxWidth: '94vw', maxHeight: '90vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E40AF 0%,#1D4ED8 50%,#2563EB 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -14, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Performance Evaluation Snapshot</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Immutable record of finalized Goal → KRA → KPI performance metrics</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {detailLoading || !selectedReview ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Loading evaluation snapshot...</div>
              ) : (
                <>
                  {/* Top Stats Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, padding: '18px 20px', background: 'linear-gradient(135deg, #0F172A, #1E3A8A)', color: '#FFF', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Employee</span>
                      <strong style={{ fontSize: 15, color: '#FFF', fontWeight: 700, display: 'block' }}>{selectedReview.employee_name}</strong>
                      <span style={{ fontSize: 12, color: '#CBD5E1', display: 'block' }}>{selectedReview.department_name}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Period & Type</span>
                      <strong style={{ fontSize: 15, color: '#FFF', fontWeight: 700, display: 'block' }}>{selectedReview.review_period}</strong>
                      <span style={{ fontSize: 12, color: '#CBD5E1', display: 'block' }}>{selectedReview.type}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Final Score</span>
                      <strong style={{ fontSize: 24, color: '#60A5FA', fontWeight: 900, display: 'block' }}>
                        {selectedReview.final_score !== null ? `${selectedReview.final_score}%` : 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Overall Rating</span>
                      <strong style={{ fontSize: 24, color: '#FBBF24', fontWeight: 900, display: 'block' }}>
                        {selectedReview.overall_rating} ★
                      </strong>
                    </div>
                  </div>

                  {/* KRA Breakdown Cards */}
                  {selectedReview.kraSummaries && selectedReview.kraSummaries.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.2px' }}>KRA Achievement Breakdown</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {selectedReview.kraSummaries.map((kra, kIdx) => (
                          <div key={kIdx} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1.5px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{kra.kra_title}</h5>
                              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8' }}>
                                {kra.kra_weightage}% Weight
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                              <span>Ach: <strong style={{ color: '#1E293B' }}>{kra.kra_achievement_percentage}%</strong></span>
                              <span>Score: <strong style={{ color: '#2563EB' }}>{kra.kra_weighted_score}%</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KPI Evaluation Snapshot Table */}
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.2px' }}>KPI Measurement Matrix</h4>
                    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                          <tr>
                            <th style={{ padding: '10px 14px' }}>KRA</th>
                            <th style={{ padding: '10px 14px' }}>KPI Name</th>
                            <th style={{ padding: '10px 14px' }}>Type</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Target</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actual</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Ach %</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Weighted Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReview.evaluations?.map((ev, eIdx) => (
                            <tr key={eIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>{ev.kra_title_snapshot}</td>
                              <td style={{ padding: '10px 14px', color: '#475569' }}>{ev.kpi_name_snapshot}</td>
                              <td style={{ padding: '10px 14px', color: '#64748B' }}>{ev.measurement_type_snapshot}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>{ev.target_value_snapshot}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>{ev.actual_achievement}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{ev.achievement_percentage}%</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{ev.weighted_score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Remarks */}
                  {(selectedReview.strengths || selectedReview.improvement || selectedReview.comments) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, paddingTop: 8, borderTop: '1.5px solid #F1F5F9' }}>
                      {selectedReview.strengths && (
                        <div style={{ padding: '14px 16px', background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Key Strengths</span>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#064E3B', fontWeight: 500 }}>{selectedReview.strengths}</p>
                        </div>
                      )}
                      {selectedReview.improvement && (
                        <div style={{ padding: '14px 16px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Areas of Improvement</span>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#78350F', fontWeight: 500 }}>{selectedReview.improvement}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px 28px', borderTop: '1.5px solid #F1F5F9', background: '#FAFBFC' }}>
              <button type="button" onClick={() => setShowDetailModal(false)}
                style={{ height: 42, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer' }}
              >Close Snapshot</button>
            </div>
          </div>
        </>
      )}

      {/* Add Review Modal with Interactive Evaluation Matrix */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 920, maxWidth: '95vw', maxHeight: '92vh', background: '#FFF', borderRadius: 22, boxShadow: '0 32px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg,#1E40AF 0%,#1D4ED8 50%,#2563EB 100%)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -14, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calculator size={22} color="#FFF" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Conduct Performance Evaluation</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Evaluate Goal → KRA → KPI targets with real-time weighted score calculation</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                ><X size={16} /></button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Row 1: Employee, Goal, Period */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Employee to Review <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={formData.employee}
                    onChange={handleEmployeeChange}
                    options={[
                      { value: '', label: 'Select Employee' },
                      ...employees.map(e => ({
                        value: String(e.id),
                        label: `👤 ${e.name}${e.employee_code || e.emp_id ? ` (${e.employee_code || e.emp_id})` : ` (EMP${String(e.id).padStart(4, '0')})`}${e.dept_name ? ` - ${e.dept_name}` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Target Goal Plan
                  </label>
                  <AppDropdown
                    value={selectedGoalId}
                    onChange={handleGoalChange}
                    options={[
                      { value: '', label: availableGoals.length === 0 ? 'No Active Goal' : 'Select Goal Plan' },
                      ...availableGoals.map(g => ({
                        value: String(g.id),
                        label: `🎯 ${g.goal_title}${g.goal_category ? ` (${g.goal_category})` : ''}`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Review Period <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text" required
                    value={formData.reviewPeriod}
                    onChange={e => setFormData({ ...formData, reviewPeriod: e.target.value })}
                    placeholder="e.g. Q3 2026 / Annual 2026"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              {/* Row 2: Reviewer Name, Type, Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Reviewer Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text" required
                    value={formData.reviewer}
                    onChange={e => setFormData({ ...formData, reviewer: e.target.value })}
                    placeholder="e.g. Team Leader / Department Manager"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Review Type
                  </label>
                  <AppDropdown
                    value={formData.type}
                    onChange={v => setFormData({ ...formData, type: v })}
                    options={[
                      { value: 'Manager Review', label: '👔 Manager Review' },
                      { value: 'Team Leader Evaluation', label: '👥 Team Leader Evaluation' },
                      { value: 'Self Evaluation', label: '🙋 Self Evaluation' },
                      { value: 'Peer Review', label: '🤝 Peer Review' }
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Review Status
                  </label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[
                      { value: 'In Progress', label: '🟡 In Progress (Draft)' },
                      { value: 'Completed', label: '🟢 Completed (100% Weightage Required)' },
                      { value: 'Pending', label: '⚪ Pending Signature' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Performance Measurement Matrix */}
              <div style={{ paddingTop: 12, borderTop: '1.5px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Performance Measurement Matrix</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Enter Actual Achievement values for each KPI to compute scores live.</p>
                  </div>
                  <button type="button" onClick={addCustomEvaluationRow}
                    style={{ height: 34, padding: '0 14px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Add Metric Row
                  </button>
                </div>

                {loadingTree ? (
                  <div style={{ padding: '36px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Loading employee performance tree...</div>
                ) : evaluations.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', background: '#F8FAFC', borderRadius: 14, border: '1.5px dashed #CBD5E1' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#64748B' }}>No KRAs/KPIs assigned to this employee goal yet.</p>
                    <button type="button" onClick={addCustomEvaluationRow}
                      style={{ padding: '8px 16px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add First Evaluation Metric
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                      <thead style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                        <tr>
                          <th style={{ padding: '10px 12px' }}>KRA Title</th>
                          <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Weight %</th>
                          <th style={{ padding: '10px 12px' }}>KPI Metric</th>
                          <th style={{ padding: '10px 12px', width: 110 }}>Type</th>
                          <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Target</th>
                          <th style={{ padding: '10px 12px', width: 120, textAlign: 'center' }}>Actual Entry</th>
                          <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Ach %</th>
                          <th style={{ padding: '10px 8px', width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluations.map((item, idx) => {
                          const targetVal = parseFloat(item.target_value) || 0;
                          const actualVal = parseFloat(item.actual_achievement) || 0;
                          const itemAchPct = targetVal > 0 ? Math.min(200, Math.round(((actualVal / targetVal) * 100) * 100) / 100) : (actualVal > 0 ? 100 : 0);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={item.kra_title}
                                  onChange={e => updateEvaluationItem(idx, 'kra_title', e.target.value)}
                                  placeholder="KRA Area"
                                  style={{ width: '100%', height: 34, padding: '0 10px', background: '#FAFBFC', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number" min="0" max="100"
                                  value={item.kra_weightage}
                                  onChange={e => updateEvaluationItem(idx, 'kra_weightage', e.target.value)}
                                  placeholder="%"
                                  style={{ width: '100%', height: 34, padding: '0 6px', textAlign: 'center', background: '#FAFBFC', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#2563EB', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={item.kpi_name}
                                  onChange={e => updateEvaluationItem(idx, 'kpi_name', e.target.value)}
                                  placeholder="KPI Target Metric"
                                  style={{ width: '100%', height: 34, padding: '0 10px', background: '#FAFBFC', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ display: 'block', padding: '6px 8px', background: '#F1F5F9', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                                  {item.measurement_type}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number"
                                  value={item.target_value}
                                  onChange={e => updateEvaluationItem(idx, 'target_value', e.target.value)}
                                  placeholder="100"
                                  style={{ width: '100%', height: 34, padding: '0 6px', textAlign: 'center', background: '#FAFBFC', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number" step="any"
                                  value={item.actual_achievement}
                                  onChange={e => updateEvaluationItem(idx, 'actual_achievement', e.target.value)}
                                  placeholder="Actual"
                                  style={{ width: '100%', height: 34, padding: '0 6px', textAlign: 'center', background: '#EFF6FF', border: '2px solid #3B82F6', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#1E293B', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: itemAchPct >= 100 ? '#DCFCE7' : (itemAchPct > 0 ? '#EFF6FF' : '#F1F5F9'), color: itemAchPct >= 100 ? '#15803D' : (itemAchPct > 0 ? '#1D4ED8' : '#64748B') }}>
                                  {itemAchPct}%
                                </span>
                              </td>
                              <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                <button type="button" onClick={() => removeEvaluationRow(idx)}
                                  style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}
                                ><Trash2 size={15} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mathematical Engine Live Banner */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#0F172A,#1E3A8A)', color: '#FFF', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.14)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                      <Calculator size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Calculation Engine</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Hierarchical Weighted Score</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Total Weightage</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: calculationSummary.isValidWeightage ? '#34D399' : '#FBBF24', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {calculationSummary.isValidWeightage ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {calculationSummary.totalWeightage}% {calculationSummary.isValidWeightage ? '(Valid 100%)' : '(Must be 100%)'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 20 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Final Score</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>
                        {calculationSummary.finalScore}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 20 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Calculated Rating</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FBBF24' }}>
                        {calculationSummary.ratingOut5} ★
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Textareas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 12, borderTop: '1.5px solid #F1F5F9' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Key Strengths <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea
                    value={formData.strengths}
                    onChange={e => setFormData({ ...formData, strengths: e.target.value })}
                    placeholder="Key areas where employee performed exceptionally..."
                    style={{ width: '100%', height: 68, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 12.5, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.2px' }}>
                    Areas of Improvement <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea
                    value={formData.improvement}
                    onChange={e => setFormData({ ...formData, improvement: e.target.value })}
                    placeholder="Specific competencies or targets needing growth..."
                    style={{ width: '100%', height: 68, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 12.5, color: '#1E293B', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', resize: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#FFF'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFC'; }}
                  />
                </div>
              </div>

              {/* Info Banner */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '12px 16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
                  Submitting this evaluation records immutable KPI achievement snapshots and updates the employee's official performance score.
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 18, borderTop: '1.5px solid #F1F5F9', marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)}
                  style={{ height: 44, padding: '0 24px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 13.5, fontWeight: 600, color: '#475569', background: '#FFF', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; }}
                >Cancel</button>
                <button type="submit" disabled={submitting}
                  style={{ height: 44, padding: '0 24px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s', opacity: submitting ? 0.6 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                >
                  <Plus size={15} /> {submitting ? 'Submitting...' : 'Save Performance Review'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Performance Reviews</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Evaluate employee performance based on KPI targets and KRA weightage</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ minWidth: '180px' }}>
            <AppDropdown
              value={filterDept}
              onChange={v => setFilterDept(v)}
              options={[
                { value: 'All Departments', label: 'All Departments' },
                ...departments.map(d => ({
                  value: String(d.id || d.branch_name || d.dept_name || d.name),
                  label: d.dept_name || d.branch_name || d.name
                }))
              ]}
              size="sm"
            />
          </div>
          {canCreate('performance', 'reviews') && (
            <button 
              onClick={() => setShowAddModal(true)} 
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                background: '#2952E3', 
                color: '#FFF', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={16} /> Add Review
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { title: 'Total Reviews', value: kpiData.total, icon: <ChevronDown size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
          { title: 'Completed Reviews', value: kpiData.completed, icon: <ChevronDown size={20} color="#10B981" />, bgColor: '#ECFDF5' },
          { title: 'Completion Rate', value: kpiData.rate, icon: <ChevronDown size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
          { title: 'Pending Reviews', value: kpiData.pending, icon: <ChevronDown size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
        ].map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '700', whiteSpace: 'nowrap' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>

        {/* Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>Review Tracker</h3>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>Loading reviews...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Employee</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Goal Plan</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Period</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>Reviewer</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Score</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Rating</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>No reviews tracked</td>
                    </tr>
                  ) : (
                    reviewsList.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: idx === reviewsList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                              {row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('') : 'EV'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>{row.employee_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>{row.department_name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#2563EB', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.goal_title || 'General Plan'}</td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.review_period}</td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.reviewer_id}</td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#0F172A', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.final_score !== null && row.final_score !== undefined ? `${row.final_score}%` : '-'}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#D97706', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.overall_rating} ★
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                            backgroundColor: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color,
                            whiteSpace: 'nowrap', display: 'inline-block'
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(row.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                            title="View Evaluation Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button disabled={page === 1} onClick={() => setPage(prev => prev - 1)} style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFF', cursor: page === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)} style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFF', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right Side Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Review Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpiData.chartData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" cx="50%" cy="50%" stroke="none">
                    {kpiData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label value={kpiData.total} position="center" fill="#1E293B" style={{ fontSize: '24px', fontWeight: '700' }} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
