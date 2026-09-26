import React, { useState, useEffect, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Clock,
  FileText, User, Camera, Trash2, ChevronDown, Check, ShieldCheck,
  CheckCircle2, XCircle, Building2, HelpCircle, X, UserCheck
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { canEdit } from '../../lib/permissions';
import EmployeeAvatar from './EmployeeAvatar';
import './employee-module.css';
import { apiFetch } from '../../lib/api';

const tabs = [
  'Overview',
  'Personal Info',
  'Employment',
  'Previous Experience',
  'Contact Info',
  'Salary',
  'Attendance',
  'Leave',
  'Documents',
  'Performance'
];

const EDITABLE_TABS = ['Personal Info', 'Employment', 'Previous Experience', 'Contact Info', 'Salary'];

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
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [profileError, setProfileError] = useState(null);
  const [noTeamAssigned, setNoTeamAssigned] = useState(false);
  const [teamName, setTeamName] = useState(null);

  // Lookup data for dropdowns
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);

  // Editing state - inline on page, matching Company Details pattern
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    joinDate: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    employmentType: 'Full-time',
    experience: '',
    shiftType: 'Regular Shift',
    salary: '',
    address: '',
    emergencyContact: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    branchId: '',
    department: '',
    departmentId: '',
    designation: '',
    designationId: '',
    managerName: '',
    managerId: '',
    teamName: '',
    teamId: '',
    experienceType: 'Experienced',
    totalExperienceYears: 0,
    totalExperienceMonths: 0,
    relevantExperienceYears: 0,
    relevantExperienceMonths: 0
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
    setIsEditing(false);
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
          if (data && data.id && String(data.id) !== String(currentEmpId)) {
            setCurrentEmpId(String(data.id));
            localStorage.setItem('selectedEmployeeId', String(data.id));
          }
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
          if (Array.isArray(data)) {
            setAllEmployees(data);
            if (data.length > 0 && !data.some(e => String(e.id) === String(currentEmpId))) {
              const firstValidId = String(data[0].id);
              setCurrentEmpId(firstValidId);
              localStorage.setItem('selectedEmployeeId', firstValidId);
            }
          }
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
    apiFetch('/employees/lookup/managers')
      .then(data => Array.isArray(data) && setManagers(data)).catch(() => { });

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

  // Helper for view mode to display formatted value or "Not provided"
  const formatValue = (val) => {
    if (val === null || val === undefined || String(val).trim() === '' || String(val).trim() === '—' || String(val).trim() === '-') {
      return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>;
    }
    return val;
  };

  // Parse bank details safely
  let bank = { bankName: '', accountNumber: '', ifscCode: '' };
  if (profile) {
    try {
      if (profile.bankDetails) {
        if (typeof profile.bankDetails === 'string' && profile.bankDetails.trim().startsWith('{')) {
          bank = JSON.parse(profile.bankDetails);
        } else {
          bank.bankName = profile.bankDetails;
        }
      }
    } catch (e) {
      bank.bankName = profile.bankDetails;
    }
    if (profile.bankName) bank.bankName = profile.bankName;
    if (profile.accountNumber) bank.accountNumber = profile.accountNumber;
    if (profile.ifscCode) bank.ifscCode = profile.ifscCode;
  }

  const rawAcc = bank.accountNumber || '';
  const maskedAcc = rawAcc.length > 4
    ? rawAcc.slice(-4).padStart(rawAcc.length, '*')
    : rawAcc;

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditForm(prev => ({ ...prev, password: pass }));
    addToast('New password generated!', 'info');
  };

  // Edit Mode triggers
  const handleEditClick = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || '',
      email: profile.email || '',
      password: '',
      phone: profile.phone || '',
      dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      joinDate: profile.joinDate ? new Date(profile.joinDate).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      maritalStatus: profile.maritalStatus || '',
      bloodGroup: profile.bloodGroup || '',
      employmentType: profile.employmentType || 'Full-time',
      experience: profile.experience || '',
      shiftType: profile.shiftType || 'Regular Shift',
      salary: profile.salary !== null && profile.salary !== undefined ? String(profile.salary) : '',
      address: profile.address || '',
      emergencyContact: profile.emergencyContact || '',
      bankName: bank.bankName || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
      branch: profile.branchName || '',
      branchId: profile.branchId || '',
      department: profile.deptName || '',
      departmentId: profile.departmentId || '',
      designation: profile.roleName || '',
      designationId: profile.designationId || '',
      managerName: profile.managerName || '',
      managerId: profile.managerId || '',
      teamName: profile.teamName || '',
      teamId: profile.teamId || '',
      experienceType: experienceSummary?.experience_type || profile.experienceType || 'Experienced',
      totalExperienceYears: experienceSummary?.total_experience_years !== undefined ? experienceSummary.total_experience_years : (profile.totalExperienceYears || 0),
      totalExperienceMonths: experienceSummary?.total_experience_months !== undefined ? experienceSummary.total_experience_months : (profile.totalExperienceMonths || 0),
      relevantExperienceYears: experienceSummary?.relevant_experience_years !== undefined ? experienceSummary.relevant_experience_years : (profile.relevantExperienceYears || 0),
      relevantExperienceMonths: experienceSummary?.relevant_experience_months !== undefined ? experienceSummary.relevant_experience_months : (profile.relevantExperienceMonths || 0)
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editForm.name || !editForm.name.trim()) {
      addToast('Employee name is required', 'error');
      return;
    }
    if (!editForm.email || !editForm.email.trim()) {
      addToast('Email address is required', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      dob: editForm.dob || null,
      joinDate: editForm.joinDate || null,
      gender: editForm.gender || '',
      maritalStatus: editForm.maritalStatus || '',
      bloodGroup: editForm.bloodGroup || '',
      employmentType: editForm.employmentType || 'Full-time',
      experience: editForm.experience || '',
      shiftType: editForm.shiftType || 'Regular Shift',
      salary: editForm.salary !== '' ? parseFloat(editForm.salary) || 0 : 0,
      address: editForm.address || '',
      emergencyContact: editForm.emergencyContact || '',
      bankName: editForm.bankName || '',
      accountNumber: editForm.accountNumber || '',
      ifscCode: editForm.ifscCode || '',
      branch: editForm.branch || '',
      branchId: editForm.branchId || null,
      department: editForm.department || '',
      departmentId: editForm.departmentId || null,
      designation: editForm.designation || '',
      designationId: editForm.designationId || null,
      managerName: editForm.managerName || '',
      managerId: editForm.managerId || null,
      teamName: editForm.teamName || '',
      teamId: editForm.teamId || null,
      experienceType: editForm.experienceType || 'Experienced',
      totalExperienceYears: parseInt(editForm.totalExperienceYears) || 0,
      totalExperienceMonths: parseInt(editForm.totalExperienceMonths) || 0,
      relevantExperienceYears: parseInt(editForm.relevantExperienceYears) || 0,
      relevantExperienceMonths: parseInt(editForm.relevantExperienceMonths) || 0
    };

    if (editForm.password && editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    apiFetch(`/employees/${currentEmpId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
      .then(res => {
        setSaving(false);
        if (res && res.error) {
          addToast(res.error, 'error');
          return;
        }
        addToast('Employee profile updated successfully', 'success');
        setIsEditing(false);
        loadProfile();
      })
      .catch(err => {
        setSaving(false);
        console.error(err);
        addToast('Failed to update employee profile', 'error');
      });
  };

  const isViewingTeamMember = isTeamLeaderRole && String(currentEmpId) !== String(authUserId);
  const allowEdit = canEdit('employees', 'employee_profile') && !isViewingTeamMember;
  const allowEditOnCurrentTab = allowEdit && EDITABLE_TABS.includes(activeTab);

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
      <div className="hrms-card hrms-mb-6 relative">
        {/* Top Right Action Area */}
        <div className="flex items-center gap-3 sm:absolute sm:top-6 sm:right-6 mb-4 sm:mb-0 z-10 flex-wrap justify-end">
          {!isEmployeeRole && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              {/* Employee Selector Button */}
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
                    {(allEmployees.find(e => String(e.id) === String(currentEmpId))?.employee_code) || profile.employee_code || profile.employee_id || ''}
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
                        const initials = (emp.name || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                              background: `linear-gradient(135deg, ${col}, ${col}bb)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 800, color: '#fff'
                            }}>
                              {initials}
                            </div>
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
                                {emp.employee_code || emp.employeeId || emp.emp_code || (emp.id ? `EMP${String(emp.id).padStart(4, '0')}` : '')}
                              </div>
                            </div>
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

          {/* EDIT BUTTON on Page Header (Only visible on editable tabs) */}
          {allowEditOnCurrentTab && (
            !isEditing ? (
              <button
                type="button"
                className="hrms-secondary-btn"
                onClick={handleEditClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: '#2563EB',
                  color: '#2563EB',
                  background: '#EFF6FF',
                  fontWeight: '600'
                }}
              >
                <Edit2 size={15} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ borderRadius: '8px', padding: '8px 16px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hrms-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )
          )}
        </div>

        {/* Employee Basic Info Header */}
        <div className="hrms-profile-hero" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ position: 'relative', flexShrink: 0, width: '120px', height: '120px' }}>
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

          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                {profile.name}
              </h1>
              <span className={`hrms-badge ${profile.status === 'Inactive' ? 'hrms-badge-danger' : 'hrms-badge-active'}`}>
                {profile.status || 'Active'}
              </span>
            </div>

            <div className="hrms-profile-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employee ID</p>
                <p className="hrms-font-medium hrms-text-sm" style={{ fontWeight: '700', color: '#2563EB' }}>
                  {profile.employee_code || profile.employee_id || profile.employeeId || profile.emp_code || profile.empId || '—'}
                </p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Designation</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.roleName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Department</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.deptName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Email</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.email)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Phone</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.phone)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Branch</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.branchName)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="hrms-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {filteredTabs.map(tab => (
            <div
              key={tab}
              className={`hrms-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setIsEditing(false);
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* 1. OVERVIEW TAB — STRICTLY READ-ONLY / NOT EDITABLE */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top 2 Cards: Personal & Contact Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Card 1: Personal Information (Read-Only) */}
            <div className="hrms-card">
              <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
                  Personal Information
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#94A3B8' }}>
                  Overview (Read-only)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Full Name</p>
                  <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.name)}</p>
                </div>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Date of Birth</p>
                  <p className="hrms-font-medium hrms-text-sm">{profile.dob ? new Date(profile.dob).toLocaleDateString() : formatValue(null)}</p>
                </div>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Gender</p>
                  <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.gender)}</p>
                </div>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Marital Status</p>
                  <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.maritalStatus)}</p>
                </div>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Blood Group</p>
                  <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.bloodGroup)}</p>
                </div>
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employment Type</p>
                  <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.employmentType)}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Contact Information (Read-Only) */}
            <div className="hrms-card">
              <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
                  Contact Information
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#94A3B8' }}>
                  Overview (Read-only)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                  <Mail className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Email Address</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.email)}</p>
                  </div>
                </div>
                <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                  <Phone className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Phone Number</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.phone)}</p>
                  </div>
                </div>
                <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                  <Phone className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Emergency Contact</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.emergencyContact)}</p>
                  </div>
                </div>
                <div className="hrms-flex-start" style={{ alignItems: 'flex-start' }}>
                  <MapPin className="hrms-text-muted" size={18} style={{ marginTop: '2px' }} />
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Address</p>
                    <p className="hrms-font-medium hrms-text-sm" style={{ whiteSpace: 'pre-line' }}>{formatValue(profile.address)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Job & Organizational Summary */}
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-6" style={{ fontSize: '16px' }}>
              Organizational & Experience Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Department</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.deptName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Designation</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.roleName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Branch</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.branchName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Team</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.teamName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Reporting Manager</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.managerName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Date of Joining</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : formatValue(null)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Shift Type</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.shiftType)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Total Experience</p>
                <p className="hrms-font-medium hrms-text-sm">
                  {experienceSummary?.total_experience_years || profile.totalExperienceYears || 0} Yrs {experienceSummary?.total_experience_months || profile.totalExperienceMonths || 0} Mos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL INFO TAB — EDITABLE SECTION */}
      {activeTab === 'Personal Info' && (
        <div className="hrms-card">
          <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
              Personal Information
            </h3>
            {!isEditing && allowEdit && (
              <button
                type="button"
                onClick={handleEditClick}
                className="hrms-secondary-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#2563EB',
                  color: '#2563EB',
                  background: '#EFF6FF',
                  fontWeight: '600',
                  padding: '6px 14px'
                }}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Full Name</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.name)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Date of Birth</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.dob ? new Date(profile.dob).toLocaleDateString() : formatValue(null)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Gender</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.gender)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Marital Status</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.maritalStatus)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Blood Group</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.bloodGroup)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employment Type</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.employmentType)}</p>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div className="hrms-input-group">
                  <label className="hrms-label">Full Name *</label>
                  <input
                    type="text"
                    className="hrms-input"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Dhanush I S"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Date of Birth</label>
                  <input
                    type="date"
                    className="hrms-input"
                    value={editForm.dob}
                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Gender</label>
                  <AppDropdown
                    value={editForm.gender}
                    onChange={v => setEditForm({ ...editForm, gender: v })}
                    options={[
                      { value: '', label: 'Select Gender' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Marital Status</label>
                  <AppDropdown
                    value={editForm.maritalStatus}
                    onChange={v => setEditForm({ ...editForm, maritalStatus: v })}
                    options={[
                      { value: '', label: 'Select Marital Status' },
                      { value: 'Single', label: 'Single' },
                      { value: 'Married', label: 'Married' },
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Blood Group</label>
                  <input
                    type="text"
                    className="hrms-input"
                    value={editForm.bloodGroup}
                    onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    placeholder="e.g. A+ "
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Employment Type</label>
                  <AppDropdown
                    value={editForm.employmentType}
                    onChange={v => setEditForm({ ...editForm, employmentType: v })}
                    options={[
                      { value: 'Full-time', label: 'Full-time' },
                      { value: 'Part-time', label: 'Part-time' },
                      { value: 'Contract', label: 'Contract' },
                      { value: 'Intern', label: 'Intern' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hrms-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. EMPLOYMENT TAB — EDITABLE SECTION */}
      {activeTab === 'Employment' && (
        <div className="hrms-card">
          <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
              Employment Details
            </h3>
            {!isEditing && allowEdit && (
              <button
                type="button"
                onClick={handleEditClick}
                className="hrms-secondary-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#2563EB',
                  color: '#2563EB',
                  background: '#EFF6FF',
                  fontWeight: '600',
                  padding: '6px 14px'
                }}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Joining Date</p>
                <p className="hrms-font-medium hrms-text-sm">{profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : formatValue(null)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Reporting Manager</p>
                <p className="hrms-font-medium hrms-text-sm hrms-text-primary">{formatValue(profile.managerName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Department</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.deptName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Designation</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.roleName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Branch</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.branchName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Team</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.teamName)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employment Type</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.employmentType)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employee Shift Type</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.shiftType)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Employee Experience</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.experience)}</p>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div className="hrms-input-group">
                  <label className="hrms-label">Date of Joining</label>
                  <input
                    type="date"
                    className="hrms-input"
                    value={editForm.joinDate}
                    onChange={e => setEditForm({ ...editForm, joinDate: e.target.value })}
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Department</label>
                  <AppDropdown
                    value={editForm.department}
                    onChange={v => {
                      const sel = departments.find(d => d.dept_name === v);
                      setEditForm({
                        ...editForm,
                        department: v,
                        departmentId: sel ? sel.id : null
                      });
                    }}
                    options={[
                      { value: '', label: 'Select Department' },
                      ...departments.map(d => ({ value: d.dept_name, label: d.dept_name }))
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Designation</label>
                  <AppDropdown
                    value={editForm.designation}
                    onChange={v => {
                      const sel = designations.find(d => d.role_name === v);
                      setEditForm({
                        ...editForm,
                        designation: v,
                        designationId: sel ? sel.id : null
                      });
                    }}
                    options={[
                      { value: '', label: 'Select Designation' },
                      ...designations.map(d => ({ value: d.role_name, label: d.role_name }))
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Branch</label>
                  <AppDropdown
                    value={editForm.branch}
                    onChange={v => {
                      const sel = branches.find(b => b.branch_name === v);
                      setEditForm({
                        ...editForm,
                        branch: v,
                        branchId: sel ? sel.id : null
                      });
                    }}
                    options={[
                      { value: '', label: 'Select Branch' },
                      ...branches.map(b => ({ value: b.branch_name, label: b.branch_name }))
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Team</label>
                  <AppDropdown
                    value={editForm.teamName}
                    onChange={v => {
                      const sel = teams.find(t => t.name === v);
                      setEditForm({
                        ...editForm,
                        teamName: v,
                        teamId: sel ? sel.id : null
                      });
                    }}
                    options={[
                      { value: '', label: 'Select Team' },
                      ...teams.map(t => ({ value: t.name, label: t.name }))
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Reporting Manager</label>
                  <AppDropdown
                    value={editForm.managerName}
                    onChange={v => {
                      const sel = managers.find(m => m.name === v);
                      setEditForm({
                        ...editForm,
                        managerName: v,
                        managerId: sel ? sel.id : null
                      });
                    }}
                    options={[
                      { value: '', label: 'Select Manager (None)' },
                      ...managers.map(m => ({
                        value: m.name,
                        label: `${m.name} (${m.employee_code || m.employee_id || ''})`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Employment Type</label>
                  <AppDropdown
                    value={editForm.employmentType}
                    onChange={v => setEditForm({ ...editForm, employmentType: v })}
                    options={[
                      { value: 'Full-time', label: 'Full-time' },
                      { value: 'Part-time', label: 'Part-time' },
                      { value: 'Contract', label: 'Contract' },
                      { value: 'Intern', label: 'Intern' }
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Employee Shift Type</label>
                  <AppDropdown
                    value={editForm.shiftType}
                    onChange={v => setEditForm({ ...editForm, shiftType: v })}
                    options={[
                      { value: 'Regular Shift', label: 'Regular Shift' },
                      { value: 'Rotational Shift', label: 'Rotational Shift' },
                      { value: 'Contract Shift', label: 'Contract Shift' }
                    ]}
                    size="sm"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Employee Experience</label>
                  <input
                    type="text"
                    className="hrms-input"
                    value={editForm.experience}
                    onChange={e => setEditForm({ ...editForm, experience: e.target.value })}
                    placeholder="e.g. 3 Years"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hrms-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PREVIOUS EXPERIENCE TAB — EDITABLE SECTION */}
      {activeTab === 'Previous Experience' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Card */}
          <div className="hrms-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', border: '1px solid #DBEAFE', borderRadius: '16px', padding: '24px' }}>
            <div className="hrms-flex-between" style={{ alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
                    Previous Experience & History
                  </h3>
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
                  Preserved work history and verified previous employment references.
                </p>
              </div>

              {!isEditing && allowEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="hrms-secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: '#2563EB',
                    color: '#2563EB',
                    background: '#FFFFFF',
                    fontWeight: '600',
                    padding: '6px 14px'
                  }}
                >
                  <Edit2 size={14} /> Edit Summary
                </button>
              )}
            </div>

            {/* Experience Metrics */}
            {!isEditing ? (
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
            ) : (
              /* Edit Mode for Experience Summary */
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Experience Type</label>
                    <AppDropdown
                      value={editForm.experienceType}
                      onChange={v => setEditForm({ ...editForm, experienceType: v })}
                      options={[
                        { value: 'Experienced', label: 'Experienced' },
                        { value: 'Fresher', label: 'Fresher' }
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Total Exp (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="hrms-input"
                      value={editForm.totalExperienceYears}
                      onChange={e => setEditForm({ ...editForm, totalExperienceYears: e.target.value })}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Total Exp (Months)</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className="hrms-input"
                      value={editForm.totalExperienceMonths}
                      onChange={e => setEditForm({ ...editForm, totalExperienceMonths: e.target.value })}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Relevant Exp (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="hrms-input"
                      value={editForm.relevantExperienceYears}
                      onChange={e => setEditForm({ ...editForm, relevantExperienceYears: e.target.value })}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Relevant Exp (Months)</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className="hrms-input"
                      value={editForm.relevantExperienceMonths}
                      onChange={e => setEditForm({ ...editForm, relevantExperienceMonths: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="hrms-secondary-btn"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="hrms-primary-btn"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '8px 20px', borderRadius: '8px' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
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
                {previousExperiences.map((exp) => {
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
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

      {/* 5. CONTACT INFO TAB — EDITABLE SECTION */}
      {activeTab === 'Contact Info' && (
        <div className="hrms-card">
          <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
            <div>
              <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
                Contact & Login Credentials
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                Corporate email, phone, login access details, and address.
              </p>
            </div>
            {!isEditing && allowEdit && (
              <button
                type="button"
                onClick={handleEditClick}
                className="hrms-secondary-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#2563EB',
                  color: '#2563EB',
                  background: '#EFF6FF',
                  fontWeight: '600',
                  padding: '6px 14px'
                }}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Login Email</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.email)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Phone Number</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.phone)}</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Login Password</p>
                <p className="hrms-font-medium hrms-text-sm" style={{ letterSpacing: '2px', color: '#64748B' }}>••••••••</p>
              </div>
              <div>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Emergency Contact Name/Number</p>
                <p className="hrms-font-medium hrms-text-sm">{formatValue(profile.emergencyContact)}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Complete Address</p>
                <p className="hrms-font-medium hrms-text-sm" style={{ whiteSpace: 'pre-line' }}>{formatValue(profile.address)}</p>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div className="hrms-input-group">
                  <label className="hrms-label">Login Email <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="email"
                    className="hrms-input"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. name@company.com"
                  />
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Phone <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="tel"
                    className="hrms-input"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. +91 99999 99999"
                  />
                </div>
                <div className="hrms-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="hrms-label" style={{ margin: 0 }}>Login Password</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    className="hrms-input"
                    value={editForm.password || ''}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Set login password..."
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Leave blank to keep existing password unchanged
                  </span>
                </div>
                <div className="hrms-input-group">
                  <label className="hrms-label">Emergency Contact Name/Number</label>
                  <input
                    type="tel"
                    className="hrms-input"
                    value={editForm.emergencyContact}
                    onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                    placeholder="e.g. Parent - +91 98888 88888"
                  />
                </div>
                <div className="hrms-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="hrms-label">Complete Address</label>
                  <textarea
                    rows={3}
                    className="hrms-input"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Street, City, State..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hrms-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. SALARY TAB — EDITABLE SECTION */}
      {activeTab === 'Salary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Compensation Card */}
            <div className="hrms-card">
              <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
                  Compensation Details
                </h3>
                {!isEditing && allowEdit && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div>
                  <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Monthly Gross CTC</p>
                  <p className="hrms-font-semibold" style={{ fontSize: '20px', color: '#10b981' }}>
                    {profile.salary ? `INR ${parseFloat(profile.salary).toLocaleString()}` : formatValue(null)}
                  </p>
                </div>
              ) : (
                <div className="hrms-input-group">
                  <label className="hrms-label">Monthly Gross CTC (INR)</label>
                  <input
                    type="number"
                    className="hrms-input"
                    value={editForm.salary}
                    onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                    placeholder="e.g. 60000"
                  />
                </div>
              )}
            </div>

            {/* Bank Information Card */}
            <div className="hrms-card">
              <div className="hrms-flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="hrms-font-semibold" style={{ fontSize: '16px', margin: 0 }}>
                  Bank Information
                </h3>
                {!isEditing && allowEdit && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Bank Name</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(bank.bankName)}</p>
                  </div>
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>Account Number</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(maskedAcc)}</p>
                  </div>
                  <div>
                    <p className="hrms-text-muted hrms-text-xs" style={{ marginBottom: '4px' }}>IFSC Code</p>
                    <p className="hrms-font-medium hrms-text-sm">{formatValue(bank.ifscCode)}</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="hrms-label">Bank Name</label>
                    <input
                      type="text"
                      className="hrms-input"
                      value={editForm.bankName}
                      onChange={e => setEditForm({ ...editForm, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Account Number</label>
                    <input
                      type="text"
                      className="hrms-input"
                      value={editForm.accountNumber}
                      onChange={e => setEditForm({ ...editForm, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">IFSC Code</label>
                    <input
                      type="text"
                      className="hrms-input"
                      value={editForm.ifscCode}
                      onChange={e => setEditForm({ ...editForm, ifscCode: e.target.value })}
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          {isEditing && (
            <div style={{
              marginTop: '24px',
              padding: '16px 20px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                type="button"
                className="hrms-secondary-btn"
                onClick={handleCancel}
                disabled={saving}
                style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hrms-primary-btn"
                onClick={handleSave}
                disabled={saving}
                style={{
                  borderRadius: '8px',
                  padding: '8px 22px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. ATTENDANCE TAB */}
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

      {/* 8. LEAVE TAB */}
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

      {/* 9. DOCUMENTS TAB */}
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

      {/* 10. PERFORMANCE TAB */}
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
    </div>
  );
}
