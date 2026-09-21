import React, { useState, useEffect, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { Edit2, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Clock, FileText, Monitor, TrendingUp, Folder, User, Camera, Trash2, ChevronDown, Check, Plus, ShieldCheck, CheckCircle2, AlertCircle, XCircle, Building2, HelpCircle, X, UserCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';
import EmployeeAvatar from './EmployeeAvatar';
import './employee-module.css';
import { apiFetch, getAuthToken } from '../../lib/api';

const tabs = [
  'Overview', 'Employment', 'Previous Experience', 'Salary', 'Attendance', 'Leave',
  'Documents', 'Performance'
];

export default function EmployeeProfileContent() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const authRaw = localStorage.getItem('hrms_auth');
  let userRole = 'SUPER_ADMIN';
  let authUserId = '11';
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw);
      const userObj = parsed.user || parsed;
      if (parsed.role) userRole = parsed.role;
      if (userObj && userObj.id) authUserId = String(userObj.id);
    } catch (e) { }
  }
  const isEmployeeRole = userRole === 'EMPLOYEE';
  const isTeamLeaderRole = userRole === 'TEAM_LEADER' || userRole === 'Team Leader';

  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [profileError, setProfileError] = useState(null);
  const [noTeamAssigned, setNoTeamAssigned] = useState(false);
  const [teamName, setTeamName] = useState(null);

  // Lookup data for dropdowns
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    employmentType: '',
    experience: '',
    shiftType: '',
    salary: '',
    address: '',
    emergencyContact: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    department: '',
    designation: '',
    managerName: '',
    teamName: ''
  });

  // Previous Experience State
  const [previousExperiences, setPreviousExperiences] = useState([]);
  const [experienceSummary, setExperienceSummary] = useState(null);
  const [loadingExp, setLoadingExp] = useState(false);

  const [currentEmpId, setCurrentEmpId] = useState(() => {
    if (isTeamLeaderRole || isEmployeeRole) return authUserId;
    return localStorage.getItem('selectedEmployeeId') || '1';
  });
  const [allEmployees, setAllEmployees] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const photoInputRef = useRef(null);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEmployeeSelect = (newId) => {
    localStorage.setItem('selectedEmployeeId', newId);
    setCurrentEmpId(newId);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('Photo must be under 2MB', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('photo', file);
    apiFetch(`/employees/${currentEmpId}/photo`, {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res || res.error) throw new Error(res?.message || 'Upload failed');
        addToast('Profile photo updated!', 'success');
        if (res.photoUrl) {
          setProfile(prev => ({ ...prev, profilePhoto: res.photoUrl }));
        }
        loadProfile();
      })
      .catch(() => addToast('Failed to upload photo', 'error'));
    e.target.value = '';
  };

  const handlePhotoRemove = () => {
    apiFetch(`/employees/${currentEmpId}/photo`, { method: 'DELETE' })
      .then(() => {
        addToast('Photo removed', 'success');
        loadProfile();
      })
      .catch(() => addToast('Failed to remove photo', 'error'));
  };

  const loadProfile = () => {
    setLoading(true);
    setProfileError(null);
    apiFetch(`/employees/${currentEmpId}/profile`)
      .then(data => {
        if (data && data.error) {
          setProfileError(data.error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setProfileError("Access Denied: You are only authorized to view profiles of your own team members.");
        setProfile(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isTeamLeaderRole) {
      apiFetch('/employees/team-members')
        .then(res => {
          if (res && res.noTeamAssigned) {
            setNoTeamAssigned(true);
            setAllEmployees(res.members || []);
          } else if (res && Array.isArray(res.members)) {
            setNoTeamAssigned(false);
            setTeamName(res.teamName);
            setAllEmployees(res.members);
          } else if (Array.isArray(res)) {
            setAllEmployees(res);
          }
        })
        .catch(err => console.error("Error fetching team members:", err));
    } else {
      apiFetch('/employees')
        .then(data => {
          if (Array.isArray(data)) setAllEmployees(data);
        })
        .catch(err => console.error("Error fetching all employees:", err));
    }
  }, [isTeamLeaderRole]);

  // Fetch profile on mount and when selected employee changes
  useEffect(() => {
    loadProfile();

    // Fetch documents
    apiFetch(`/employees/${currentEmpId}/documents`)
      .then(data => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments([]);
        }
      })
      .catch(err => console.error("Error loading docs:", err));

    // Fetch lookup data for dropdowns
    apiFetch('/employees/lookup/designations')
      .then(data => Array.isArray(data) && setDesignations(data)).catch(() => { });
    apiFetch('/employees/lookup/departments')
      .then(data => Array.isArray(data) && setDepartments(data)).catch(() => { });
    apiFetch('/employees/lookup/branches')
      .then(data => Array.isArray(data) && setBranches(data)).catch(() => { });
    apiFetch('/employees/lookup/teams')
      .then(data => Array.isArray(data) && setTeams(data)).catch(() => { });

    // Fetch previous experiences
    fetchPreviousExperiences();
  }, [currentEmpId]);

  const fetchPreviousExperiences = () => {
    if (!currentEmpId) return;
    setLoadingExp(true);
    apiFetch(`/employees/${currentEmpId}/previous-experiences`)
      .then(res => {
        if (res && res.success) {
          setPreviousExperiences(res.experiences || []);
          if (res.summary) {
            setExperienceSummary(res.summary);
            setSummaryForm({
              experience_type: res.summary.experience_type || 'Experienced',
              total_experience_years: res.summary.total_experience_years || 0,
              total_experience_months: res.summary.total_experience_months || 0,
              relevant_experience_years: res.summary.relevant_experience_years || 0,
              relevant_experience_months: res.summary.relevant_experience_months || 0
            });
          }
        } else {
          setPreviousExperiences([]);
        }
        setLoadingExp(false);
      })
      .catch(err => {
        console.error("Error loading previous experiences:", err);
        setPreviousExperiences([]);
        setLoadingExp(false);
      });
  };

  if (loading) {
    return (
      <div className="hrms-content" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="hrms-text-muted hrms-mt-4">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="hrms-content" style={{ textAlign: 'center', padding: '40px' }}>
        <p className="hrms-text-muted">Employee profile not found.</p>
        <button className="hrms-primary-btn hrms-mt-4" onClick={() => navigate('/employees')}>Back to Directory</button>
      </div>
    );
  }

  // Parse bank details
  let bank = { bankName: '—', accountNumber: '—', ifscCode: '—' };
  try {
    if (profile.bankDetails) {
      bank = JSON.parse(profile.bankDetails);
    }
  } catch (e) {
    bank.accountNumber = profile.bankDetails;
  }

  // Mask bank account number
  const rawAcc = bank.accountNumber || "";
  const maskedAcc = rawAcc.length > 4
    ? rawAcc.slice(-4).padStart(rawAcc.length, "*")
    : rawAcc;

  const handleEditClick = () => {
    setEditForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      employmentType: profile.employmentType || 'Full-time',
      experience: profile.experience || '',
      shiftType: profile.shiftType || 'Regular Shift',
      salary: profile.salary || '0',
      address: profile.address || '',
      emergencyContact: profile.emergencyContact || '',
      bankName: bank.bankName || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
      branch: profile.branchName || 'Downtown',
      department: profile.deptName || 'Engineering',
      designation: profile.roleName || 'Software Engineer',
      managerName: profile.managerName || 'Super Admin',
      teamName: profile.teamName || 'Backend Team'
    });
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      dob: editForm.dob,
      gender: editForm.gender,
      employmentType: editForm.employmentType,
      experience: editForm.experience,
      shiftType: editForm.shiftType,
      salary: parseFloat(editForm.salary) || 0,
      address: editForm.address,
      emergencyContact: editForm.emergencyContact,
      bankDetails: JSON.stringify({ bankName: editForm.bankName, accountNumber: editForm.accountNumber, ifscCode: editForm.ifscCode }),
      branch: editForm.branch,
      department: editForm.department,
      designation: editForm.designation,
      managerName: editForm.managerName,
      teamName: editForm.teamName
    };

    apiFetch(`/employees/${currentEmpId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    })
      .then(() => {
        addToast("Profile updated successfully!", "success");
        setIsEditing(false);
        loadProfile();
      })
      .catch(err => {
        console.error(err);
        addToast("Failed to update profile", "error");
      });
  };

  const isViewingTeamMember = isTeamLeaderRole && String(currentEmpId) !== String(authUserId);
  const hideEditButton = isEmployeeRole || isViewingTeamMember;
  const filteredTabs = (isEmployeeRole || isViewingTeamMember)
    ? tabs.filter(t => t !== 'Salary')
    : tabs;

  if (profileError) {
    return (
      <div className="hrms-content">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <User size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Profile Access Restricted</h3>
            <p className="text-xs text-rose-700 font-semibold mt-1">{profileError}</p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('selectedEmployeeId', authUserId);
              setCurrentEmpId(authUserId);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Return to My Profile
          </button>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="hrms-content flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-content">
      {/* Profile Header */}
      <div className="hrms-card hrms-mb-6" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isEmployeeRole && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              {/* Trigger Button */}
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#fff',
                  border: `1.5px solid ${dropdownOpen ? '#6366F1' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  padding: '8px 14px',
                  boxShadow: dropdownOpen ? '0 0 0 3px rgba(99,102,241,0.10)' : '0 1px 4px rgba(15,23,42,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <User size={14} color="#6366F1" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {noTeamAssigned
                    ? 'My Profile'
                    : (() => { const sel = allEmployees.find(e => String(e.id) === String(currentEmpId)); return sel ? sel.name : 'Select…'; })()
                  }
                </span>
                {!noTeamAssigned && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.04em' }}>
                    {`EMP${String(currentEmpId).padStart(4, '0')}`}
                  </span>
                )}
                <ChevronDown size={14} color="#94A3B8" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }} />
              </button>

              {/* Custom Dropdown Panel */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px -4px rgba(15,23,42,0.16)',
                  minWidth: '240px',
                  height: 'auto',
                  maxHeight: 'min(320px, calc(100vh - 160px))',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  zIndex: 999,
                  animation: 'fadeSlideInCenter 0.15s ease'
                }}>
                  <style>{`@keyframes fadeSlideInCenter { from { opacity: 0; transform: translate(-50%, -6px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {noTeamAssigned ? (
                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', fontSize: '13px', color: '#64748B' }}>
                        My Profile (No Team Assigned)
                      </div>
                    ) : (
                      allEmployees.map((emp, idx) => {
                        const isSelected = String(emp.id) === String(currentEmpId);
                        const isMe = String(emp.id) === String(authUserId);
                        const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
                        const col = colors[idx % colors.length];
                        const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <button
                            key={emp.id}
                            onClick={() => { handleEmployeeSelect(String(emp.id)); setDropdownOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 12px', borderRadius: '9px', border: 'none',
                              background: isSelected ? '#EEF2FF' : 'transparent',
                              cursor: 'pointer', textAlign: 'left', width: '100%',
                              transition: 'background 0.12s ease'
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                              background: `linear-gradient(135deg, ${col}, ${col}bb)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 800, color: '#fff'
                            }}>
                              {initials}
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#4F46E5' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {emp.name}
                                </span>
                                {isMe && (
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '1px 6px', borderRadius: '5px', flexShrink: 0 }}>Me</span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '1px' }}>
                                {`EMP${String(emp.id).padStart(4, '0')}`}
                              </div>
                            </div>
                            {/* Check */}
                            {isSelected && <Check size={14} color="#6366F1" style={{ flexShrink: 0 }} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!hideEditButton && (
            <button className="hrms-secondary-btn" onClick={handleEditClick}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>

        <div className="hrms-flex-start" style={{ gap: '32px', marginBottom: '32px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <EmployeeAvatar
              name={profile.name}
              photoUrl={profile.profilePhoto}
              size={120}
              className="hrms-avatar hrms-avatar-lg"
            />
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoUpload}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
            <div style={{
              position: 'absolute', bottom: '2px', right: '2px',
              display: 'flex', gap: '4px'
            }}>
              <button
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#2952E3', color: '#fff', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  padding: 0
                }}
                title="Change photo"
              >
                <Camera size={14} />
              </button>
              {profile.profilePhoto && (
                <button
                  onClick={handlePhotoRemove}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#ef4444', color: '#fff', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    padding: 0
                  }}
                  title="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="hrms-flex-start hrms-mb-4" style={{ gap: '12px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{profile.name}</h1>
              <span className="hrms-badge hrms-badge-active">{profile.status || 'Active'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employee ID</p>
                <p className="hrms-font-medium hrms-text-sm">EMP00{profile.id}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Designation</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.roleName || 'Staff'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Department</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.deptName || 'General'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Email</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.email}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Phone</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.phone || '—'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Branch</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.branchName || 'Head Office'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="hrms-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {filteredTabs.map(tab => (
            <div
              key={tab}
              className={`hrms-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area depends on ActiveTab */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Personal Information */}
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Date of Birth</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Gender</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.gender || '—'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employment Type</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.employmentType || 'Full-time'}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Emergency Contact</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.emergencyContact || '—'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Contact Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                <Mail className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Email Address</p>
                  <p className="hrms-font-medium hrms-text-sm">{profile.email}</p>
                </div>
              </div>
              <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                <Phone className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Phone Number</p>
                  <p className="hrms-font-medium hrms-text-sm">{profile.phone || '—'}</p>
                </div>
              </div>
              <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                <MapPin className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Address</p>
                  <p className="hrms-font-medium hrms-text-sm" style={{ whiteSpace: 'pre-line' }}>{profile.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Employment' && (
        <div className="hrms-card">
          <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Employment Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Joining Date</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Reporting Manager</p>
              <p className="hrms-font-medium hrms-text-sm hrms-text-primary">{profile.managerName || 'None'}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Department</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.deptName}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Designation</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.roleName}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Team</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.teamName || '—'}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employment Type</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.employmentType || '—'}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employee Experience</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.experience || '—'}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Shift Type</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.shiftType || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* PREVIOUS EXPERIENCE TAB */}
      {activeTab === 'Previous Experience' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Card */}
          <div className="hrms-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', border: '1px solid #DBEAFE', borderRadius: '16px', padding: '24px' }}>
            <div className="hrms-flex-between" style={{ alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>Previous Experience & History</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: (experienceSummary?.experience_type || profile.experienceType) === 'Fresher' ? '#F3E8FF' : '#DCFCE7',
                    color: (experienceSummary?.experience_type || profile.experienceType) === 'Fresher' ? '#7E22CE' : '#15803D'
                  }}>
                    {experienceSummary?.experience_type || profile.experienceType || 'Experienced'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Preserved candidate work history and verified previous employment references.
                </p>
              </div>
            </div>

            {/* Experience Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Total Experience</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    {experienceSummary?.total_experience_years || profile.totalExperienceYears || 0} Yrs {experienceSummary?.total_experience_months || profile.totalExperienceMonths || 0} Mos
                  </p>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Relevant Experience</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    {experienceSummary?.relevant_experience_years || profile.relevantExperienceYears || 0} Yrs {experienceSummary?.relevant_experience_months || profile.relevantExperienceMonths || 0} Mos
                  </p>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Previous Companies</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    {previousExperiences.length} Recorded
                  </p>
                </div>
              </div>

              {profile.candidateId && (
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FDF4FF', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Candidate Source</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: '700', color: '#9333EA' }}>
                      Linked #{profile.candidateId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Previous Companies History List */}
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#2563EB" /> Previous Employment Records
            </h3>

            {loadingExp ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Loading previous experiences...</div>
            ) : previousExperiences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <Building2 size={36} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#334155' }}>No Previous Employment Records Found</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {(experienceSummary?.experience_type || profile.experienceType) === 'Fresher'
                    ? 'This employee joined as a Fresher with zero prior professional experience.'
                    : 'No previous employment history records have been recorded yet.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {previousExperiences.map((exp, index) => {
                  const getVerBadge = (st) => {
                    switch (st) {
                      case 'Verified':
                        return { bg: '#DCFCE7', text: '#15803D', icon: <CheckCircle2 size={13} /> };
                      case 'Rejected':
                        return { bg: '#FEE2E2', text: '#B91C1C', icon: <XCircle size={13} /> };
                      case 'Unable to Verify':
                        return { bg: '#F1F5F9', text: '#475569', icon: <HelpCircle size={13} /> };
                      default:
                        return { bg: '#FEF3C7', text: '#B45309', icon: <Clock size={13} /> };
                    }
                  };

                  const vBadge = getVerBadge(exp.verification_status);

                  const startDateStr = exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
                  const endDateStr = exp.is_currently_working
                    ? 'Present'
                    : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—');

                  return (
                    <div
                      key={exp.id}
                      style={{
                        padding: '20px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="hrms-flex-between" style={{ alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                              {exp.company_name}
                            </h4>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#EFF6FF', color: '#2563EB' }}>
                              {exp.employment_type || 'Full Time'}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: vBadge.bg, color: vBadge.text }}>
                              {vBadge.icon} {exp.verification_status || 'Pending'}
                            </span>
                            {exp.candidate_experience_id && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                                Ref #{exp.candidate_experience_id}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                            {exp.designation} {exp.department ? `• ${exp.department}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: '#F8FAFC', padding: '14px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Duration</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                            {startDateStr} — {endDateStr} {exp.duration_months ? `(${exp.duration_months} Mos)` : ''}
                          </p>
                        </div>

                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Location</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '500', color: '#1E293B' }}>
                            {exp.company_location || '—'}
                          </p>
                        </div>

                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Last Drawn CTC</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                            {exp.last_drawn_ctc ? `₹${Number(exp.last_drawn_ctc).toLocaleString()}` : '—'}
                          </p>
                        </div>

                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Reason for Leaving</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '500', color: '#1E293B' }}>
                            {exp.reason_for_leaving || '—'}
                          </p>
                        </div>
                      </div>

                      {/* References & Verification details */}
                      {(exp.reporting_manager || exp.reference_name || exp.verification_notes) && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', fontSize: '12px', color: '#475569', paddingTop: '6px' }}>
                          {exp.reporting_manager && (
                            <div>
                              <span style={{ fontWeight: '600', color: '#334155' }}>Manager: </span>
                              {exp.reporting_manager}
                            </div>
                          )}
                          {exp.reference_name && (
                            <div>
                              <span style={{ fontWeight: '600', color: '#334155' }}>Reference: </span>
                              {exp.reference_name} {exp.reference_designation ? `(${exp.reference_designation})` : ''} {exp.reference_contact ? `• ${exp.reference_contact}` : ''}
                            </div>
                          )}
                          {exp.verification_notes && (
                            <div style={{ gridColumn: '1 / -1', background: '#F1F5F9', padding: '8px 12px', borderRadius: '6px' }}>
                              <span style={{ fontWeight: '600', color: '#1E293B' }}>HR Verification Notes: </span>
                              {exp.verification_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {activeTab === 'Salary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Compensation Details</h3>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Monthly Gross CTC</p>
              <p className="hrms-font-semibold" style={{ fontSize: '20px', color: '#10b981' }}>INR {profile.salary ? parseFloat(profile.salary).toLocaleString() : '0'}</p>
            </div>
          </div>
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Bank Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Bank Name</p>
                <p className="hrms-font-medium hrms-text-sm">{bank.bankName}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Account Number</p>
                <p className="hrms-font-medium hrms-text-sm">{maskedAcc}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>IFSC Code</p>
                <p className="hrms-font-medium hrms-text-sm">{bank.ifscCode}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div className="hrms-card">
          <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Attendance Performance (Current Month)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Present</p>
              <p className="hrms-font-semibold hrms-text-success" style={{ fontSize: '24px' }}>{profile.attendanceSummary?.present}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Absent</p>
              <p className="hrms-font-semibold hrms-text-danger" style={{ fontSize: '24px' }}>{profile.attendanceSummary?.absent}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Late Arrivals</p>
              <p className="hrms-font-semibold" style={{ fontSize: '24px', color: '#d97706' }}>{profile.attendanceSummary?.late}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Half Day</p>
              <p className="hrms-font-semibold hrms-text-primary" style={{ fontSize: '24px' }}>{profile.attendanceSummary?.halfDay}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Leave' && (
        <div className="hrms-card">
          <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Leave Balances</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Total Leave Allocated</p>
              <p className="hrms-font-semibold" style={{ fontSize: '24px' }}>{profile.leaveSummary?.total} Days</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Leave Taken</p>
              <p className="hrms-font-semibold hrms-text-primary" style={{ fontSize: '24px' }}>{profile.leaveSummary?.taken} Days</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
              <p className="hrms-text-muted hrms-text-xs">Remaining Balance</p>
              <p className="hrms-font-semibold hrms-text-success" style={{ fontSize: '24px' }}>{profile.leaveSummary?.remaining} Days</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="hrms-card">
          <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Employee Documents</h3>
          {documents.length === 0 ? (
            <p className="hrms-text-sm hrms-text-muted">No documents uploaded for this employee yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.map(doc => (
                <div key={doc.id} className="hrms-flex-between" style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div className="hrms-flex-start" style={{ gap: '12px' }}>
                    <FileText size={20} className="hrms-text-muted" />
                    <div>
                      <p className="hrms-text-sm hrms-font-medium">{doc.file_name}</p>
                      <p className="hrms-text-xs hrms-text-muted">{doc.doc_type} • Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <a href={doc.file_path.startsWith('http') ? doc.file_path : `${doc.file_path}`} target="_blank" rel="noreferrer" download className="hrms-text-primary hrms-text-xs hrms-font-semibold hover:underline">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Performance' && (
        <div className="hrms-card">
          <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>Performance Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Overall Rating</p>
              <p className="hrms-font-semibold hrms-text-primary" style={{ fontSize: '20px' }}>{profile.performanceSummary?.rating}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Last Appraisal Period</p>
              <p className="hrms-font-medium hrms-text-sm">{profile.performanceSummary?.lastReview}</p>
            </div>
            <div>
              <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Status</p>
              <span className="hrms-badge hrms-badge-active" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>{profile.performanceSummary?.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
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
            width: '720px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '22px',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
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
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <UserCheck size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    Edit Employee Profile
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Update personal information, banking details, and job assignments
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
                
                {/* Section 1: Personal Info */}
                <div>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                    Personal & Contact Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Full Name *</label>
                      <input type="text" className="hrms-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Email *</label>
                      <input type="email" className="hrms-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Phone *</label>
                      <input type="text" className="hrms-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Date of Birth</label>
                      <input type="date" className="hrms-input" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Gender</label>
                      <AppDropdown
                        value={editForm.gender}
                        onChange={v => setEditForm({ ...editForm, gender: v })}
                        options={[{ value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Employment Type</label>
                      <AppDropdown
                        value={editForm.employmentType}
                        onChange={v => setEditForm({ ...editForm, employmentType: v })}
                        options={[{ value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Monthly Gross Salary (INR)</label>
                      <input type="number" className="hrms-input" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Emergency Contact</label>
                      <input type="text" className="hrms-input" value={editForm.emergencyContact} onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Address</label>
                      <textarea className="hrms-input" rows="2" style={{ height: 'auto', resize: 'vertical', borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Bank Details */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    Bank Account Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Bank Name</label>
                      <input type="text" className="hrms-input" value={editForm.bankName} onChange={e => setEditForm({ ...editForm, bankName: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Account Number</label>
                      <input type="text" className="hrms-input" value={editForm.accountNumber} onChange={e => setEditForm({ ...editForm, accountNumber: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>IFSC Code</label>
                      <input type="text" className="hrms-input" value={editForm.ifscCode} onChange={e => setEditForm({ ...editForm, ifscCode: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Job Assignment */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                    Job Assignment Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Branch</label>
                      <AppDropdown
                        value={editForm.branch}
                        onChange={v => setEditForm({ ...editForm, branch: v })}
                        options={[{ value: '', label: 'Select Branch' }, ...(branches || [])]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Department</label>
                      <AppDropdown
                        value={editForm.department}
                        onChange={v => setEditForm({ ...editForm, department: v })}
                        options={[{ value: '', label: 'Select Department' }, ...(departments || [])]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Designation</label>
                      <AppDropdown
                        value={editForm.designation}
                        onChange={v => setEditForm({ ...editForm, designation: v })}
                        options={[{ value: '', label: 'Select Designation' }, ...(designations || [])]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Team</label>
                      <AppDropdown
                        value={editForm.teamName}
                        onChange={v => setEditForm({ ...editForm, teamName: v })}
                        options={[{ value: '', label: 'Select Team' }, ...(teams || [])]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Employee Experience</label>
                      <input
                        type="text"
                        className="hrms-input"
                        value={editForm.experience}
                        onChange={e => setEditForm({ ...editForm, experience: e.target.value })}
                        placeholder="e.g. 3 Years"
                        style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }}
                      />
                    </div>
                    <div className="hrms-input-group">
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Employee Shift Type</label>
                      <AppDropdown
                        value={editForm.shiftType}
                        onChange={v => setEditForm({ ...editForm, shiftType: v })}
                        placeholder="Select Shift Type"
                        options={[
                          { value: 'Regular Shift', label: 'Regular Shift' },
                          { value: 'Rotational Shift', label: 'Rotational Shift' },
                          { value: 'Contract Shift', label: 'Contract Shift' }
                        ]}
                        size="sm"
                      />
                    </div>
                    <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                      <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Manager Name</label>
                      <input type="text" className="hrms-input" value={editForm.managerName} onChange={e => setEditForm({ ...editForm, managerName: e.target.value })} style={{ borderRadius: '10px', padding: '10px 14px', borderColor: '#CBD5E1' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={() => setIsEditing(false)}
                  style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hrms-primary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


