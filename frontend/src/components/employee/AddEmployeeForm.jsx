import React, { useState, useEffect, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Check, ChevronRight, ChevronLeft, Plus, Trash2, Building, Calendar, DollarSign, MapPin, Briefcase, Award, ShieldCheck, UserCheck, AlertCircle, FileText, FileSpreadsheet, Upload } from 'lucide-react';
import { useToast } from '../ui/Toast';
import EmployeeAvatar from './EmployeeAvatar';
import EmployeeImportModal from './EmployeeImportModal';
import { downloadEmployeeExcelTemplate } from '../../utils/employeeExcel';
import './employee-module.css';
import { apiFetch } from '../../lib/api';

const steps = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Employment Info' },
  { id: 3, label: 'Previous Experience' },
  { id: 4, label: 'Contact Info' },
  { id: 5, label: 'Salary Info' },
  { id: 6, label: 'Documents' },
  { id: 7, label: 'Review' },
];

export default function AddEmployeeForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    branch: '',
    department: '',
    designation: '',
    teamName: '',
    managerName: '',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-time',
    experience: '',
    shiftType: '',
    email: '',
    phone: '',
    address: '',
    salary: '60000',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    emergencyContact: '',
    password: 'Employee@2026',
    photo: ''
  });

  // Previous Experience States
  const [experienceType, setExperienceType] = useState('Experienced');
  const [totalExpYears, setTotalExpYears] = useState(0);
  const [totalExpMonths, setTotalExpMonths] = useState(0);
  const [relevantExpYears, setRelevantExpYears] = useState(0);
  const [relevantExpMonths, setRelevantExpMonths] = useState(0);
  const [previousExperiences, setPreviousExperiences] = useState([]);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const photoInputRef = useRef(null);

  // Onboarding Documents States
  const [onboardingDocs, setOnboardingDocs] = useState([]);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docInputRef = useRef(null);

  const detectDocType = (fileName) => {
    const lower = (fileName || '').toLowerCase();
    if (lower.includes('resume') || lower.includes('cv')) return 'Resume';
    if (lower.includes('offer') || lower.includes('appointment')) return 'Offer Letter';
    if (lower.includes('reliev') || lower.includes('experien') || lower.includes('service')) return 'Experience Letter';
    if (lower.includes('pan') || lower.includes('aadhaar') || lower.includes('aadhar') || lower.includes('passport') || lower.includes('voter') || lower.includes('id')) return 'ID Proof';
    if (lower.includes('degree') || lower.includes('cert') || lower.includes('diploma') || lower.includes('marksheet') || lower.includes('10th') || lower.includes('12th')) return 'Certificates';
    return 'Other';
  };

  const handleDocFiles = (files) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const newDocs = [];
    for (const file of fileList) {
      if (file.size > 5 * 1024 * 1024) {
        addToast(`File "${file.name}" exceeds the 5MB size limit`, 'error');
        continue;
      }
      newDocs.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        name: file.name,
        size: file.size,
        docType: detectDocType(file.name)
      });
    }

    if (newDocs.length > 0) {
      setOnboardingDocs(prev => [...prev, ...newDocs]);
      addToast(`${newDocs.length} file(s) selected`, 'success');
    }

    if (docInputRef.current) {
      docInputRef.current.value = '';
    }
  };

  const removeDoc = (id) => {
    setOnboardingDocs(prev => prev.filter(d => d.id !== id));
  };

  const updateDocType = (id, newType) => {
    setOnboardingDocs(prev => prev.map(d => d.id === id ? { ...d, docType: newType } : d));
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [emailError, setEmailError] = useState(null);

  // Real-time Email Duplicate Check
  useEffect(() => {
    if (!formData.email || !formData.email.trim()) {
      setEmailStatus('idle');
      setEmailError(null);
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailStatus('taken');
      setEmailError('Invalid email format');
      return;
    }

    setEmailStatus('checking');
    setEmailError(null);

    const timer = setTimeout(() => {
      apiFetch(`/employees/check-email?email=${encodeURIComponent(cleanEmail)}`)
        .then(data => {
          if (data && data.available === false) {
            setEmailStatus('taken');
            setEmailError(data.message || 'This email is already registered. Please use another company email.');
          } else {
            setEmailStatus('available');
            setEmailError(null);
          }
        })
        .catch(() => {
          setEmailStatus('idle');
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const [codeStatus, setCodeStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [codeError, setCodeError] = useState(null);

  // Real-time Employee ID / Code Duplicate Check
  useEffect(() => {
    if (!formData.employeeCode || !formData.employeeCode.trim()) {
      setCodeStatus('idle');
      setCodeError(null);
      return;
    }

    const cleanCode = formData.employeeCode.trim();
    setCodeStatus('checking');
    setCodeError(null);

    const timer = setTimeout(() => {
      apiFetch(`/employees/check-code?code=${encodeURIComponent(cleanCode)}`)
        .then(data => {
          if (data && data.available === false) {
            setCodeStatus('taken');
            setCodeError(data.message || 'Employee ID already exists');
          } else {
            setCodeStatus('available');
            setCodeError(null);
          }
        })
        .catch(() => {
          setCodeStatus('idle');
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.employeeCode]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Photo must be under 2MB', 'error');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Lookup data for dropdowns
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    apiFetch('/employees/lookup/designations')
      .then(data => { if (Array.isArray(data)) { setDesignations(data); if (data.length > 0 && !formData.designation) setFormData(prev => ({ ...prev, designation: data[0].role_name })); } }).catch(() => { });
    apiFetch('/employees/lookup/departments')
      .then(data => { if (Array.isArray(data)) { setDepartments(data); if (data.length > 0 && !formData.department) setFormData(prev => ({ ...prev, department: data[0].dept_name })); } }).catch(() => { });
    apiFetch('/employees/lookup/branches')
      .then(data => { if (Array.isArray(data)) { setBranches(data); if (data.length > 0 && !formData.branch) setFormData(prev => ({ ...prev, branch: data[0].branch_name })); } }).catch(() => { });
    apiFetch('/employees/lookup/teams')
      .then(data => { if (Array.isArray(data)) { setTeams(data); if (data.length > 0 && !formData.teamName) setFormData(prev => ({ ...prev, teamName: data[0].name })); } }).catch(() => { });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setDropdownField = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Previous Experience Helpers
  const handleAddPreviousExperience = () => {
    setPreviousExperiences(prev => [
      ...prev,
      {
        id: Date.now(),
        company_name: '',
        designation: '',
        department: '',
        employment_type: 'Full-time',
        start_date: '',
        end_date: '',
        total_years: 0,
        total_months: 0,
        relevant_years: 0,
        relevant_months: 0,
        company_location: '',
        nature_of_work: '',
        leaving_reason: '',
        last_drawn_ctc: '',
        currency: 'INR'
      }
    ]);
  };

  const handleUpdateExperienceItem = (id, field, value) => {
    setPreviousExperiences(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      // Auto calculate duration in years and months if dates changed
      if (field === 'start_date' || field === 'end_date') {
        const sDate = field === 'start_date' ? value : item.start_date;
        const eDate = field === 'end_date' ? value : item.end_date;
        if (sDate && eDate) {
          const s = new Date(sDate);
          const e = new Date(eDate);
          if (e >= s) {
            let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
            const yrs = Math.floor(months / 12);
            const mos = months % 12;
            updated.total_years = yrs;
            updated.total_months = mos;
            if (!updated.relevant_years && !updated.relevant_months) {
              updated.relevant_years = yrs;
              updated.relevant_months = mos;
            }
          }
        }
      }
      return updated;
    }));
  };

  const handleRemoveExperienceItem = (id) => {
    setPreviousExperiences(prev => prev.filter(item => item.id !== id));
  };

  // Auto-update summary string and form experience
  useEffect(() => {
    if (experienceType === 'Fresher') {
      setFormData(prev => ({ ...prev, experience: 'Fresher' }));
    } else {
      if (previousExperiences.length > 0) {
        // Calculate cumulative duration
        let totalMonthsCount = 0;
        let relMonthsCount = 0;
        previousExperiences.forEach(exp => {
          totalMonthsCount += ((parseInt(exp.total_years, 10) || 0) * 12) + (parseInt(exp.total_months, 10) || 0);
          relMonthsCount += ((parseInt(exp.relevant_years, 10) || 0) * 12) + (parseInt(exp.relevant_months, 10) || 0);
        });
        const computedTotYrs = Math.floor(totalMonthsCount / 12);
        const computedTotMos = totalMonthsCount % 12;
        const computedRelYrs = Math.floor(relMonthsCount / 12);
        const computedRelMos = relMonthsCount % 12;

        setTotalExpYears(computedTotYrs);
        setTotalExpMonths(computedTotMos);
        setRelevantExpYears(computedRelYrs);
        setRelevantExpMonths(computedRelMos);

        const expString = computedTotMos > 0
          ? `${computedTotYrs} Years ${computedTotMos} Months`
          : `${computedTotYrs} Years`;
        setFormData(prev => ({ ...prev, experience: expString }));
      } else {
        const expString = totalExpMonths > 0
          ? `${totalExpYears} Years ${totalExpMonths} Months`
          : `${totalExpYears} Years`;
        setFormData(prev => ({ ...prev, experience: expString }));
      }
    }
  }, [experienceType, previousExperiences, totalExpYears, totalExpMonths]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
    addToast('New password generated!', 'info');
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.gender) {
        addToast("Please fill all required personal fields (*)", "error");
        return;
      }
    }
    if (activeStep === 2) {
      if (!formData.employeeCode || !formData.employeeCode.trim()) {
        addToast("Employee ID is required.", "error");
        return;
      }
      if (codeStatus === 'taken' || codeError) {
        addToast("Employee ID already exists", "error");
        return;
      }
      if (!formData.shiftType || !formData.shiftType.trim()) {
        addToast("Shift Type is required.", "error");
        return;
      }
    }
    if (activeStep === 3) {
      // Validate Previous Experience Step
      if (experienceType === 'Experienced' && previousExperiences.length > 0) {
        for (let i = 0; i < previousExperiences.length; i++) {
          const item = previousExperiences[i];
          if (!item.company_name || !item.company_name.trim()) {
            addToast(`Please enter Company Name for previous experience #${i + 1}`, "error");
            return;
          }
          if (!item.designation || !item.designation.trim()) {
            addToast(`Please enter Designation for previous experience #${i + 1}`, "error");
            return;
          }
          if (item.start_date && item.end_date) {
            if (new Date(item.start_date) > new Date(item.end_date)) {
              addToast(`End Date cannot be before Start Date for ${item.company_name}`, "error");
              return;
            }
          }
        }
      }
    }
    if (activeStep === 4) {
      if (!formData.email || !formData.email.trim() || !formData.phone) {
        addToast("Please fill email and phone number (*)", "error");
        return;
      }
      if (!formData.password || formData.password.trim().length < 4) {
        addToast("Please provide a valid login password", "error");
        return;
      }
      if (emailStatus === 'taken' || emailError) {
        addToast("This email is already registered. Please use another company email.", "error");
        return;
      }
    }
    setActiveStep(Math.min(7, activeStep + 1));
  };

  const handleSubmit = async () => {
    if (!formData.employeeCode || !formData.employeeCode.trim()) {
      addToast("Employee ID is required.", "error");
      setActiveStep(2);
      return;
    }

    if (codeStatus === 'taken' || codeError) {
      addToast("Employee ID already exists", "error");
      setActiveStep(2);
      return;
    }

    if (!formData.shiftType || !formData.shiftType.trim()) {
      addToast("Shift Type is required.", "error");
      setActiveStep(2);
      return;
    }

    if (emailStatus === 'taken' || emailError) {
      addToast("This email is already registered. Please use another company email.", "error");
      setActiveStep(4);
      return;
    }

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      dob: formData.dob,
      joinDate: formData.joinDate,
      gender: formData.gender,
      employmentType: formData.employmentType,
      experience: experienceType === 'Fresher' ? 'Fresher' : (formData.experience || `${totalExpYears} Years ${totalExpMonths} Months`),
      experience_type: experienceType,
      total_experience_years: experienceType === 'Fresher' ? 0 : totalExpYears,
      total_experience_months: experienceType === 'Fresher' ? 0 : totalExpMonths,
      relevant_experience_years: experienceType === 'Fresher' ? 0 : relevantExpYears,
      relevant_experience_months: experienceType === 'Fresher' ? 0 : relevantExpMonths,
      previous_experiences: experienceType === 'Fresher' ? [] : previousExperiences.filter(exp => exp.company_name && exp.company_name.trim()),
      shiftType: formData.shiftType,
      salary: parseFloat(formData.salary) || 0,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      bankDetails: JSON.stringify({ bankName: formData.bankName, accountNumber: formData.accountNumber, ifscCode: formData.ifscCode }),
      branch: formData.branch,
      department: formData.department,
      designation: formData.designation,
      managerName: formData.managerName,
      teamName: formData.teamName,
      password: formData.password || 'Employee@2026'
    };

    try {
      const resData = await apiFetch('/employees', {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!resData || resData.message === "Employee creation failed" || resData.error) {
        throw new Error(resData?.message || resData?.error || "Failed to create employee");
      }

      const newEmpId = resData.id;

      // Upload profile photo if selected by user
      if (photoFile && newEmpId) {
        const photoData = new FormData();
        photoData.append('photo', photoFile);
        await apiFetch(`/employees/${newEmpId}/photo`, {
          method: 'POST',
          body: photoData
        });
      }

      // Upload onboarding documents if any were selected
      if (onboardingDocs.length > 0 && newEmpId) {
        for (const doc of onboardingDocs) {
          try {
            const docData = new FormData();
            docData.append('document', doc.file);
            docData.append('docType', doc.docType || 'Onboarding Document');
            docData.append('fileName', doc.name);
            await apiFetch(`/employees/${newEmpId}/documents`, {
              method: 'POST',
              body: docData
            });
          } catch (docErr) {
            console.error(`Failed to upload document ${doc.name}:`, docErr);
          }
        }
      }

      addToast(resData.message || "Employee created successfully with previous experience profile.", "success");
      navigate("/employees/list");
    } catch (err) {
      console.error(err);
      const errMsg = err?.message || "Failed to save employee to database";
      if (errMsg.toLowerCase().includes("registered") || errMsg.toLowerCase().includes("duplicate") || errMsg.toLowerCase().includes("already exists")) {
        setEmailStatus('taken');
        setEmailError("This email is already registered. Please use another company email.");
        setActiveStep(4);
        addToast("This email is already registered. Please use another company email.", "error");
      } else {
        addToast(errMsg, "error");
      }
    }
  };

  return (
    <div className="hrms-content">
      {/* Header */}
      <div className="hrms-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
          Add New Employee Profile
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="hrms-secondary-btn"
            onClick={async () => {
              try {
                const meta = await apiFetch('/employees/import-meta');
                downloadEmployeeExcelTemplate(meta || {});
                addToast("Excel template downloaded.", "success");
              } catch (e) {
                downloadEmployeeExcelTemplate({ departments, designations, branches, teams });
                addToast("Excel template downloaded.", "success");
              }
            }}
            style={{ borderRadius: '10px', padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download Excel Template corresponding to this Add Employee form"
          >
            <FileSpreadsheet size={15} color="#2563EB" /> Download Excel Template
          </button>

          <button
            type="button"
            className="hrms-secondary-btn"
            onClick={() => setIsImportModalOpen(true)}
            style={{ borderRadius: '10px', padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}
            title="Upload and preview Excel file with automatic field mapping"
          >
            <Upload size={15} /> Import via Excel
          </button>

          <button
            type="button"
            className="hrms-secondary-btn"
            onClick={() => navigate('/employees/list')}
            style={{ borderRadius: '10px', padding: '9px 16px', fontSize: '13px' }}
          >
            Cancel & Exit
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="hrms-card" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(15, 23, 42, 0.02)',
        padding: '32px'
      }}>
        {/* Step Indicator Bar */}
        <div className="hrms-steps-wrapper">
          <div className="hrms-steps">
            <div style={{ position: 'absolute', top: '18px', left: '20px', right: '20px', height: '3px', backgroundColor: '#E2E8F0', zIndex: 0, borderRadius: '4px' }} />
            <div style={{
              position: 'absolute',
              top: '18px',
              left: '20px',
              width: `${((activeStep - 1) / (steps.length - 1)) * 96}%`,
              height: '3px',
              background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
              zIndex: 0,
              transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '4px'
            }} />

            {steps.map((step) => {
              const isCompleted = activeStep > step.id;
              const isActive = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`hrms-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    if (isCompleted || step.id < activeStep) setActiveStep(step.id);
                  }}
                  title={`Go to ${step.label}`}
                >
                  <div className="hrms-step-circle">
                    {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.id}
                  </div>
                  <span className="hrms-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content & Sidebar Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '40px', alignItems: 'start' }}>
          {/* Form Left Panel */}
          <div>
            {/* STEP 1: PERSONAL INFO */}
            {activeStep === 1 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Personal Information</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Basic identity and demographic info for the employee.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">First Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="hrms-input" placeholder="e.g. Aarav" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="hrms-input" placeholder="e.g. Sharma" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="hrms-input" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Gender <span style={{ color: '#EF4444' }}>*</span></label>
                    <AppDropdown value={formData.gender} onChange={(val) => setDropdownField('gender', val)} options={[{ value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Marital Status</label>
                    <AppDropdown value={formData.maritalStatus} onChange={(val) => setDropdownField('maritalStatus', val)} options={[{ value: '', label: 'Select Status' }, { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Blood Group</label>
                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="hrms-input" placeholder="e.g. O+" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: EMPLOYMENT INFO */}
            {activeStep === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Employment Information</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Department, designation, shift type, and organizational assignment.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="hrms-label">Employee ID / Code <span style={{ color: '#EF4444' }}>*</span></label>
                      {codeStatus === 'checking' && (
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Checking availability...</span>
                      )}
                      {codeStatus === 'available' && (
                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600' }}>✓ Available</span>
                      )}
                      {codeStatus === 'taken' && (
                        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600' }}>✕ {codeError || 'Employee ID already exists'}</span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      name="employeeCode" 
                      value={formData.employeeCode} 
                      onChange={handleChange} 
                      className="hrms-input" 
                      placeholder="e.g. MT/0305" 
                      style={{
                        borderColor: codeStatus === 'taken' ? '#ef4444' : codeStatus === 'available' ? '#10b981' : undefined
                      }}
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                      Manually enter HRMS employee code (e.g. MT/0305, MT/0307). Must be unique.
                    </span>
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Department</label>
                    <AppDropdown value={formData.department} onChange={(val) => setDropdownField('department', val)} options={[{ value: '', label: 'Select Department' }, ...(departments || [])]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Designation</label>
                    <AppDropdown value={formData.designation} onChange={(val) => setDropdownField('designation', val)} options={[{ value: '', label: 'Select Designation' }, ...(designations || [])]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Employee Shift Type <span style={{ color: '#EF4444' }}>*</span></label>
                    <AppDropdown
                      value={formData.shiftType}
                      onChange={(val) => setDropdownField('shiftType', val)}
                      placeholder="Select Shift Type"
                      options={[
                        { value: '', label: 'Select Shift Type' },
                        { value: 'Regular Shift', label: 'Regular Shift' },
                        { value: 'Rotational Shift', label: 'Rotational Shift' },
                        { value: 'Contract Shift', label: 'Contract Shift' }
                      ]}
                      size="sm"
                    />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Employment Type</label>
                    <AppDropdown value={formData.employmentType} onChange={(val) => setDropdownField('employmentType', val)} options={[{ value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Branch</label>
                    <AppDropdown value={formData.branch} onChange={(val) => setDropdownField('branch', val)} options={[{ value: '', label: 'Select Branch' }, ...(branches || [])]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Team</label>
                    <AppDropdown value={formData.teamName} onChange={(val) => setDropdownField('teamName', val)} options={[{ value: '', label: 'Select Team' }, ...(teams || [])]} size="sm" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Reporting Manager</label>
                    <input type="text" name="managerName" value={formData.managerName} onChange={handleChange} className="hrms-input" placeholder="e.g. John Doe" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Joining Date</label>
                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="hrms-input" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: PREVIOUS EXPERIENCE */}
            {activeStep === 3 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building size={20} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Previous Experience & History</h2>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                        Configure previous employment records that will be preserved in the employee profile.
                      </p>
                    </div>
                  </div>

                  {/* Experience Type Toggle */}
                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => setExperienceType('Experienced')}
                      style={{
                        padding: '7px 18px',
                        borderRadius: '9px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: experienceType === 'Experienced' ? '#2563EB' : 'transparent',
                        color: experienceType === 'Experienced' ? '#FFFFFF' : '#64748B',
                        boxShadow: experienceType === 'Experienced' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Experienced
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExperienceType('Fresher');
                        setPreviousExperiences([]);
                        setTotalExpYears(0);
                        setTotalExpMonths(0);
                        setRelevantExpYears(0);
                        setRelevantExpMonths(0);
                      }}
                      style={{
                        padding: '7px 18px',
                        borderRadius: '9px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: experienceType === 'Fresher' ? '#7E22CE' : 'transparent',
                        color: experienceType === 'Fresher' ? '#FFFFFF' : '#64748B',
                        boxShadow: experienceType === 'Fresher' ? '0 2px 8px rgba(126, 34, 206, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Fresher
                    </button>
                  </div>
                </div>

                {experienceType === 'Fresher' ? (
                  <div style={{
                    padding: '36px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                    border: '1px solid #E9D5FF',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFFFFF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 4px 12px rgba(126, 34, 206, 0.15)' }}>
                      <Award size={28} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: '#581C87' }}>Fresher Candidate Selected</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B21A8', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                      This employee is joining as a Fresher with 0 prior corporate experience. Their experience summary will be saved as Fresher.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Experience Summary Metric Inputs */}
                    <div style={{
                      padding: '20px 24px',
                      borderRadius: '16px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Experience Duration Breakdown</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <label className="hrms-label" style={{ marginBottom: '8px' }}>Total Previous Experience</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={totalExpYears}
                                onChange={e => setTotalExpYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="hrms-input"
                                placeholder="Years"
                              />
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Yrs</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                max="11"
                                value={totalExpMonths}
                                onChange={e => setTotalExpMonths(Math.min(11, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                                className="hrms-input"
                                placeholder="Months"
                              />
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Mos</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="hrms-label" style={{ marginBottom: '8px' }}>Relevant Experience</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={relevantExpYears}
                                onChange={e => setRelevantExpYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="hrms-input"
                                placeholder="Years"
                              />
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Yrs</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                max="11"
                                value={relevantExpMonths}
                                onChange={e => setRelevantExpMonths(Math.min(11, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                                className="hrms-input"
                                placeholder="Months"
                              />
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Mos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previous Employment History Cards */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>
                        Previous Companies & History ({previousExperiences.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddPreviousExperience}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '9px 16px', borderRadius: '10px',
                          border: 'none', background: '#2563EB',
                          color: '#FFFFFF', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                        }}
                      >
                        <Plus size={15} /> Add Previous Company
                      </button>
                    </div>

                    {previousExperiences.length === 0 ? (
                      <div style={{
                        padding: '28px 20px',
                        borderRadius: '14px',
                        border: '1px dashed #CBD5E1',
                        textAlign: 'center',
                        color: '#64748B',
                        background: '#FAFAFA'
                      }}>
                        <Building size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>No previous company records added yet.</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                          Click "Add Previous Company" above to add previous employment history for reference.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {previousExperiences.map((exp, idx) => (
                          <div
                            key={exp.id || idx}
                            style={{
                              padding: '20px',
                              borderRadius: '14px',
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                                  {idx + 1}
                                </span>
                                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                                  {exp.company_name || `Company #${idx + 1}`}
                                </h5>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExperienceItem(exp.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  border: 'none', background: 'none',
                                  color: '#EF4444', fontSize: '12px', fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="hrms-input-group">
                                <label className="hrms-label">Company Name <span style={{ color: '#EF4444' }}>*</span></label>
                                <input
                                  type="text"
                                  value={exp.company_name}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'company_name', e.target.value)}
                                  className="hrms-input"
                                  placeholder="e.g. Infosys Ltd"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Designation / Role <span style={{ color: '#EF4444' }}>*</span></label>
                                <input
                                  type="text"
                                  value={exp.designation}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'designation', e.target.value)}
                                  className="hrms-input"
                                  placeholder="e.g. Senior Software Engineer"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Employment Type</label>
                                <AppDropdown
                                  value={exp.employment_type || 'Full-time'}
                                  onChange={v => handleUpdateExperienceItem(exp.id, 'employment_type', v)}
                                  options={[
                                    { value: 'Full-time', label: 'Full-time' },
                                    { value: 'Part-time', label: 'Part-time' },
                                    { value: 'Contract', label: 'Contract' },
                                    { value: 'Internship', label: 'Internship' }
                                  ]}
                                  size="sm"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Company Location</label>
                                <input
                                  type="text"
                                  value={exp.company_location}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'company_location', e.target.value)}
                                  className="hrms-input"
                                  placeholder="e.g. Bangalore, India"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Start Date</label>
                                <input
                                  type="date"
                                  value={exp.start_date}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'start_date', e.target.value)}
                                  className="hrms-input"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">End Date</label>
                                <input
                                  type="date"
                                  value={exp.end_date}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'end_date', e.target.value)}
                                  className="hrms-input"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Last Drawn CTC (INR)</label>
                                <input
                                  type="text"
                                  value={exp.last_drawn_ctc}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'last_drawn_ctc', e.target.value)}
                                  className="hrms-input"
                                  placeholder="e.g. 850000"
                                />
                              </div>

                              <div className="hrms-input-group">
                                <label className="hrms-label">Reason for Leaving</label>
                                <input
                                  type="text"
                                  value={exp.leaving_reason}
                                  onChange={e => handleUpdateExperienceItem(exp.id, 'leaving_reason', e.target.value)}
                                  className="hrms-input"
                                  placeholder="e.g. Career Growth"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* STEP 4: CONTACT & LOGIN CREDENTIALS */}
            {activeStep === 4 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Contact & Login Credentials</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Set corporate email, phone, and initial login access details.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Login Email <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="hrms-input"
                      style={{
                        borderColor: emailStatus === 'taken' ? '#ef4444' : emailStatus === 'available' ? '#10b981' : undefined
                      }}
                      placeholder="e.g. name@company.com"
                    />
                    {emailStatus === 'checking' && (
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Checking email availability...
                      </span>
                    )}
                    {emailStatus === 'available' && (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ✓ Email available
                      </span>
                    )}
                    {emailStatus === 'taken' && (
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ✕ {emailError || "This email is already registered. Please use another company email."}
                      </span>
                    )}
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Phone <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="hrms-input" placeholder="e.g. +91 99999 99999" />
                  </div>
                  <div className="hrms-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="hrms-label" style={{ margin: 0 }}>Login Password <span style={{ color: '#EF4444' }}>*</span></label>
                      <button type="button" onClick={generatePassword} style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>⚡ Auto Generate</button>
                    </div>
                    <input type="text" name="password" value={formData.password} onChange={handleChange} className="hrms-input" placeholder="Set login password..." />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Emergency Contact Name/Number</label>
                    <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="hrms-input" placeholder="e.g. Parent - +91 98888 88888" />
                  </div>
                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="hrms-label">Complete Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} className="hrms-input" rows="2" placeholder="Street, City, State..." style={{ height: 'auto', resize: 'vertical' }} />
                  </div>
                </div>
              </>
            )}

            {/* STEP 5: SALARY INFO */}
            {activeStep === 5 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Salary & Banking Info</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Configure compensation details and bank account references.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Monthly Gross Salary (INR)</label>
                    <input type="number" name="salary" value={formData.salary} onChange={handleChange} className="hrms-input" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="hrms-input" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Account Number</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="hrms-input" />
                  </div>
                  <div className="hrms-input-group">
                    <label className="hrms-label">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="hrms-input" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 6: DOCUMENTS */}
            {activeStep === 6 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0F9FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Documents Upload</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Upload onboarding agreements, identity cards, or relieving letters.</p>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={docInputRef}
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleDocFiles(e.target.files);
                    }
                  }}
                />

                {/* Clickable Drag and Drop Area */}
                <div
                  onClick={() => docInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleDocFiles(e.dataTransfer.files);
                    }
                  }}
                  style={{
                    border: isDraggingDoc ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                    borderRadius: '16px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    background: isDraggingDoc ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <UploadCloud size={36} color={isDraggingDoc ? '#2563EB' : '#64748B'} style={{ margin: '0 auto 16px', display: 'block' }} />
                  <p className="hrms-text-sm hrms-font-semibold hrms-mb-2" style={{ color: '#1E293B' }}>
                    Drag and drop employee onboarding records here, or click to browse
                  </p>
                  <p className="hrms-text-xs hrms-text-muted" style={{ maxWidth: '440px', margin: '0 auto 16px' }}>
                    PAN, Aadhaar, Passport, Contract agreements, Previous Relieving Letters, Resume (PDF, PNG, JPG, DOC up to 5MB each)
                  </p>
                  <button
                    type="button"
                    className="hrms-secondary-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      docInputRef.current?.click();
                    }}
                    style={{ margin: '0 auto', borderRadius: '10px' }}
                  >
                    Select Files
                  </button>
                </div>

                {/* Selected Documents List */}
                {onboardingDocs.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                        Selected Documents ({onboardingDocs.length})
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnboardingDocs([]);
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Clear All
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {onboardingDocs.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.name}
                              </p>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                {formatFileSize(doc.size)}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <select
                              value={doc.docType}
                              onChange={(e) => updateDocType(doc.id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: '#F8FAFC',
                                color: '#1E293B',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="ID Proof">ID Proof</option>
                              <option value="Offer Letter">Offer Letter</option>
                              <option value="Experience Letter">Experience Letter</option>
                              <option value="Resume">Resume</option>
                              <option value="Certificates">Certificates</option>
                              <option value="Other">Other</option>
                            </select>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDoc(doc.id);
                              }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #FEE2E2',
                                background: '#FEF2F2',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Remove document"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 7: REVIEW */}
            {activeStep === 7 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Review & Submit</h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Verify all details before saving to the employee directory.</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Full Name:</strong> {formData.firstName} {formData.lastName}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Role / Designation:</strong> {formData.designation || '—'}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Department:</strong> {formData.department || '—'}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Shift Type:</strong> {formData.shiftType || '—'}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Email:</strong> {formData.email}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Branch:</strong> {formData.branch || '—'}</p>
                    </div>
                    <div>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Experience Type:</strong> <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: experienceType === 'Fresher' ? '#F3E8FF' : '#DCFCE7', color: experienceType === 'Fresher' ? '#7E22CE' : '#15803D' }}>{experienceType}</span></p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Total Previous Exp:</strong> {experienceType === 'Fresher' ? '0 Yrs' : `${totalExpYears} Yrs ${totalExpMonths} Mos`}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Relevant Exp:</strong> {experienceType === 'Fresher' ? '0 Yrs' : `${relevantExpYears} Yrs ${relevantExpMonths} Mos`}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Previous Companies:</strong> {previousExperiences.length} company record(s)</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Salary:</strong> INR {formData.salary}</p>
                      <p className="hrms-mb-2" style={{ fontSize: '13px', color: '#475569' }}><strong style={{ color: '#0F172A' }}>Employment Type:</strong> {formData.employmentType}</p>
                    </div>
                  </div>

                  {previousExperiences.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px', color: '#0F172A' }}>Previous Companies Summary:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {previousExperiences.map((item, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#475569', background: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: '#1E293B' }}>{item.company_name}</strong> — {item.designation}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{item.employment_type || 'Full-time'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {onboardingDocs.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px', color: '#0F172A' }}>Attached Onboarding Documents ({onboardingDocs.length}):</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {onboardingDocs.map((doc, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#475569', background: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={14} color="#2563EB" />
                              <strong style={{ color: '#1E293B' }}>{doc.name}</strong>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>({formatFileSize(doc.size)})</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{doc.docType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Profile Photo & Progress Checklist */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 20px 0', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Employee Identity
            </h3>

            {/* Avatar Preview */}
            <div style={{
              position: 'relative',
              padding: '6px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)',
              marginBottom: '16px'
            }}>
              <EmployeeAvatar
                name={`${formData.firstName} ${formData.lastName}`.trim() || 'New Employee'}
                photoUrl={photoPreview || formData.photo}
                size={110}
              />
            </div>

            <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
              {`${formData.firstName} ${formData.lastName}`.trim() || 'New Employee'}
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
              {formData.designation || 'Position not set'}
            </p>

            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="hrms-secondary-btn"
              style={{
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                width: '100%',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
              onClick={() => photoInputRef.current?.click()}
            >
              <UploadCloud size={15} /> Upload Photo
            </button>

            {/* Completion Progress Gauge */}
            <div style={{ width: '100%', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Form Completion</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB' }}>
                  {Math.round((activeStep / steps.length) * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((activeStep / steps.length) * 100)}%`,
                  background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Steps Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {steps.map(s => {
                  const done = activeStep > s.id;
                  const current = activeStep === s.id;
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: done ? '#059669' : current ? '#2563EB' : '#94A3B8', fontWeight: current || done ? '600' : '400' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: done ? '#DCFCE7' : current ? '#EFF6FF' : '#F1F5F9', color: done ? '#15803D' : current ? '#2563EB' : '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                        {done ? '✓' : s.id}
                      </span>
                      {s.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="hrms-flex-between" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                className="hrms-secondary-btn"
                onClick={() => setActiveStep(activeStep - 1)}
                style={{ borderRadius: '10px', padding: '10px 20px' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="hrms-secondary-btn"
              onClick={() => navigate('/employees/list')}
              style={{ borderRadius: '10px', padding: '10px 20px', border: 'none' }}
            >
              Cancel
            </button>

            {activeStep < steps.length ? (
              <button
                type="button"
                className="hrms-primary-btn"
                onClick={handleNext}
                style={{
                  borderRadius: '10px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="hrms-primary-btn"
                onClick={handleSubmit}
                style={{
                  borderRadius: '10px',
                  padding: '10px 28px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  fontWeight: '700'
                }}
              >
                Save & Complete Onboarding
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Excel Import Modal */}
      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          navigate('/employees/list');
        }}
      />
    </div>
  );
}
