import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Eye, Download, FileText, CheckCircle, Clock, AlertCircle, Plus, X, ChevronLeft, ChevronRight, UploadCloud, Check, ExternalLink, ShieldCheck, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';
import { apiFetch } from '../../lib/api';

export default function DocumentVerification() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Pending Verification');
  const [verificationsList, setVerificationsList] = useState([]);
  const [newJoiners, setNewJoiners] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');

  // KPI Dashboard Stats
  const [kpiData, setKpiData] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
    completed: 0,
    total: 0,
    chartData: [
      { name: 'Verified', value: 0, color: '#10B981' },
      { name: 'Pending', value: 0, color: '#F59E0B' },
      { name: 'Rejected', value: 0, color: '#EF4444' }
    ]
  });

  // Modal form states
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [formJoinerId, setFormJoinerId] = useState('');
  const [formFiles, setFormFiles] = useState({});
  const [formStatus, setFormStatus] = useState('Pending');

  const fetchMeta = async () => {
    try {
      // Fetch departments
      const deptData = await apiFetch('/requirements/meta/all');
      if (deptData && deptData.departments) {
        setDepartments(deptData.departments);
      }

      // Fetch active new joiners
      const joinersData = await apiFetch('/joiners?limit=1000');
      if (joinersData && joinersData.success && joinersData.data) {
        setNewJoiners(joinersData.data.joiners || []);
      }
    } catch (err) {
      console.error('Failed to load verification metadata:', err);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const resData = await apiFetch('/verifications/stats');
      if (resData && resData.success && resData.data) {
        setKpiData(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch verification stats:', err);
    }
  }, []);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      let mappedStatus = 'Pending';
      if (activeTab === 'Verified Documents') mappedStatus = 'Verified';
      if (activeTab === 'Rejected Documents') mappedStatus = 'Rejected';
      if (activeTab === 'Completed Verification') mappedStatus = 'Completed';

      let url = `/verifications?page=${page}&limit=${limit}&status=${mappedStatus}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterDept && filterDept !== 'All Departments') {
        url += `&department_id=${encodeURIComponent(filterDept)}`;
      }

      const resData = await apiFetch(url);
      if (resData && resData.success && resData.data) {
        setVerificationsList(resData.data.verifications || []);
        setTotal(resData.data.total || 0);
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to fetch document verifications', 'error');
      }
    } catch (err) {
      addToast('Error connecting to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, activeTab, addToast]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, activeTab]);

  useEffect(() => {
    fetchVerifications();
    fetchDashboardStats();
  }, [page, fetchVerifications, fetchDashboardStats]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Verified': return { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0' };
      case 'Completed': return { bg: '#EFF6FF', text: '#2952E3', border: '#BFDBFE' };
      case 'Pending': return { bg: '#FFFBEB', text: '#F59E0B', border: '#FDE68A' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#EF4444', border: '#FECACA' };
      default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const handleOpenEdit = (verifyRecord) => {
    setSelectedVerification(verifyRecord);
    setFormJoinerId(verifyRecord.new_joiner_id);
    setFormStatus(verifyRecord.status);
    setFormFiles({});
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setSelectedVerification(null);
    setFormJoinerId('');
    setFormStatus('Pending');
    setFormFiles({});
    setShowModal(true);
  };

  const handleFileChange = (field, file) => {
    if (file) {
      // Size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        addToast('File size must be under 10MB.', 'error');
        return;
      }
      setFormFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formJoinerId) {
      addToast('Please select a New Joiner.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('new_joiner_id', formJoinerId);
      data.append('status', formStatus);

      // Append selected files
      Object.keys(formFiles).forEach(key => {
        data.append(key, formFiles[key]);
      });

      const url = selectedVerification 
        ? `/verifications/${selectedVerification.id}`
        : '/verifications';
      
      const method = selectedVerification ? 'PUT' : 'POST';

      const resData = await apiFetch(url, {
        method,
        body: data
      });
      if (resData && resData.success) {
        addToast('Verification record saved successfully!', 'success');
        setShowModal(false);
        fetchVerifications();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to save verification details', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteVerification = async (verifyId) => {
    if (!window.confirm('Are you sure you want to complete this document verification? This will automatically generate a new Employee record.')) return;
    
    setSubmitting(true);
    try {
      const resData = await apiFetch(`/verifications/${verifyId}/complete`, {
        method: 'PUT'
      });
      if (resData && resData.success) {
        addToast('Verification completed and Employee generated successfully!', 'success');
        setShowModal(false);
        fetchVerifications();
        fetchDashboardStats();
      } else {
        addToast((resData && (resData.message || resData.error)) || 'Failed to complete verification', 'error');
      }
    } catch (err) {
      addToast('Connection error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Selected Joiner Auto Population Info
  const activeJoiner = newJoiners.find(j => j.id === parseInt(formJoinerId));

  const docTypesList = [
    { name: 'Aadhaar Card', key: 'aadhaar_card' },
    { name: 'PAN Card', key: 'pan_card' },
    { name: 'Resume', key: 'resume' },
    { name: 'Passport', key: 'passport' },
    { name: 'Degree Certificate', key: 'degree_certificate' },
    { name: 'Experience Certificate', key: 'experience_certificate' },
    { name: 'Relieving Letter', key: 'relieving_letter' },
    { name: 'Photo', key: 'photo' },
    { name: 'Bank Passbook', key: 'bank_passbook' },
    { name: 'Driving License', key: 'driving_license' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Document Verification</h1>
        {hasPermission('onboarding', 'document_verification', 'create') && (
          <button onClick={handleOpenAdd} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
            <Plus size={18} /> Initiate Verification
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0' }}>
        {['Pending Verification', 'Verified Documents', 'Rejected Documents', 'Completed Verification'].map((tab) => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              paddingBottom: '12px', 
              fontSize: '14px', 
              fontWeight: activeTab === tab ? '600' : '500', 
              color: activeTab === tab ? '#2952E3' : '#64748B', 
              borderBottom: activeTab === tab ? '2px solid #2952E3' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
        
        {/* Main Left Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '200px' }}>
              <AppDropdown
                value={filterDept}
                onChange={v => setFilterDept(v)}
                options={[
                  { value: 'All Departments', label: 'All Departments' },
                  ...departments.map(d => ({ value: String(d.id || d.name), label: d.name || d.department_name }))
                ]}
                size="sm"
              />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading verifications...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Employee</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Designation</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>Submitted On</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No documents in this category</td>
                      </tr>
                    ) : (
                      verificationsList.map((row, index) => {
                        const submitDate = row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';
                        return (
                          <tr key={row.id} style={{ borderBottom: index === verificationsList.length - 1 ? 'none' : '1px solid #F8FAFC' }}>
                            <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                  {row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('') : 'IP'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{row.employee_name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748B' }}>{row.department_name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{row.designation}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{submitDate}</td>
                            <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                backgroundColor: getStatusStyle(row.status).bg, 
                                color: getStatusStyle(row.status).text,
                                border: `1px solid ${getStatusStyle(row.status).border}`
                              }}>
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                <button onClick={() => handleOpenEdit(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2952E3', fontWeight: '600', fontSize: '12px' }}>
                                  Review Documents
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#64748B' }}
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === i + 1 ? '#2952E3' : '#FFF', border: page === i + 1 ? 'none' : '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', color: page === i + 1 ? '#FFF' : '#64748B', fontSize: '13px', fontWeight: '500' }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#64748B' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Verification Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px', position: 'relative' }}>
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
                <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', color: '#64748B' }}>Total</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '24px' }}>
                {kpiData.chartData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '500' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></div>
                      {item.name}
                    </div>
                    <div style={{ fontWeight: '600', color: '#1E293B' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Pending Verifications</div>
                <div style={{ fontSize: '18px', color: '#1E293B', fontWeight: '700' }}>{kpiData.pending}</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Verification Review Modal */}
      {showModal && (selectedVerification ? hasPermission('onboarding', 'document_verification', 'edit') : hasPermission('onboarding', 'document_verification', 'create')) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '920px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}>
            {/* Modal Header */}
            <div style={{
              position: 'relative',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    {selectedVerification ? 'Review Onboarding Documents' : 'Initiate Onboarding Verification'}
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.82)' }}>
                    Verify required identity proofs, certificates, and compliance records
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Top Section: Joiner Selection & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      New Joiner <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {selectedVerification ? (
                      <div style={{
                        height: '40px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1E293B'
                      }}>
                        <User size={16} color="#64748B" />
                        {selectedVerification.employee_name}
                      </div>
                    ) : (
                      <AppDropdown
                        value={String(formJoinerId)}
                        onChange={v => setFormJoinerId(v)}
                        options={[
                          { value: '', label: 'Select Onboarding Joiner' },
                          ...newJoiners.map(j => ({
                            value: String(j.id),
                            label: j.candidate_name || j.name || j.employee_name || `Joiner #${j.id}`,
                            sublabel: j.designation || j.job_title || j.department_name || ''
                          }))
                        ]}
                        placeholder="Select Onboarding Joiner"
                        size="md"
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      Overall Verification Status
                    </label>
                    <AppDropdown
                      value={formStatus}
                      onChange={v => setFormStatus(v)}
                      options={[
                        { value: 'Pending', label: 'Pending Review' },
                        { value: 'Verified', label: 'Verified & Approved' },
                        { value: 'Rejected', label: 'Rejected / Incomplete' }
                      ]}
                      size="md"
                    />
                  </div>
                </div>

                {/* Active Joiner Info Card */}
                {activeJoiner && (
                  <div style={{
                    padding: '14px 18px',
                    background: '#F0F7FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#1E40AF'
                  }}>
                    <div><strong>Department:</strong> {activeJoiner.department_name || 'General'}</div>
                    <div><strong>Designation:</strong> {activeJoiner.designation || 'Specialist'}</div>
                    <div><strong>Joining Date:</strong> {activeJoiner.joining_date ? new Date(activeJoiner.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    <div><strong>Reporting Manager:</strong> {activeJoiner.reporting_manager || 'HR Team'}</div>
                  </div>
                )}

                {/* Document Uploads Grid */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                      Document Uploads & Files
                    </h4>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Supported: PDF, PNG, JPG (Max 10MB)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '14px' }}>
                    {docTypesList.map(doc => {
                      const existingPath = selectedVerification ? selectedVerification[doc.key] : null;
                      const selectedNewFile = formFiles[doc.key];

                      return (
                        <div key={doc.key} style={{
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          background: '#FAFAFA',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="#3B82F6" />
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{doc.name}</span>
                            </div>
                            {existingPath ? (
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                ✓ Uploaded
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: '500', color: '#94A3B8' }}>
                                Not Uploaded
                              </span>
                            )}
                          </div>

                          {/* Existing File Link */}
                          {existingPath && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}>
                              <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                {existingPath.split('/').pop()}
                              </span>
                              <a
                                href={existingPath}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#2563EB',
                                  fontWeight: '600',
                                  textDecoration: 'none'
                                }}
                              >
                                View File <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          {/* Upload Trigger Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}>
                              <UploadCloud size={14} color="#2563EB" />
                              {existingPath ? 'Replace File' : 'Choose File'}
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={e => handleFileChange(doc.key, e.target.files?.[0])}
                                style={{ display: 'none' }}
                              />
                            </label>
                            {selectedNewFile && (
                              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Selected: {selectedNewFile.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div>
                  {selectedVerification && selectedVerification.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteVerification(selectedVerification.id)}
                      disabled={submitting}
                      style={{
                        padding: '10px 20px',
                        background: '#059669',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      Complete Verification & Generate Employee
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 20px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {submitting ? 'Saving Changes...' : (selectedVerification ? 'Save Changes' : 'Initiate Verification')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
