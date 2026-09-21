import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { canEdit, canDelete, canExport } from '../../lib/permissions';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  IndianRupee,
  Download,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Camera,
  Bird,
  Upload,
  Eye,
  Trash2,
  Settings,
  Edit2,
  Plus
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'company-details', label: 'Company Details', icon: Building2 },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'hr-settings', label: 'HR Settings', icon: Users },
  { id: 'payroll', label: 'Payroll', icon: IndianRupee },
  { id: 'banking', label: 'Banking', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Camera },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'system-settings', label: 'System Settings', icon: Settings },
];

const INITIAL_PROFILE = {
  general: {
    companyName: 'Hawkeye Nest Technologies Pvt Ltd',
    legalCompanyName: 'Hawkeye Nest Technologies Private Limited',
    companyCode: 'HNTPL',
    companyType: 'Private Limited',
    industry: 'Information Technology',
    businessType: 'Service',
    yearEstablished: '2018',
    numberOfEmployees: '250',
    financialYear: 'April - March',
  },
  contact: {
    officialEmail: 'info@hawkeyenest.com',
    hrEmail: 'hr@hawkeyenest.com',
    supportEmail: 'support@hawkeyenest.com',
    website: 'www.hawkeyenest.com',
    phoneNumber: '+91 9876543210',
    mobileNumber: '+91 98765 43210',
    alternateNumber: '+91 98765 43211',
    faxNumber: '+91 44 1234 5679',
    linkedinUrl: 'https://linkedin.com/company/hawkeyenest',
    facebookUrl: 'https://facebook.com/hawkeyenest',
    twitterUrl: 'https://twitter.com/hawkeyenest',
    instagramUrl: 'https://instagram.com/hawkeyenest'
  },
  address: {
    headOfficeAddress1: 'No. 123, Tech Park, Tower A',
    headOfficeAddress2: '4th Floor, Unit 401',
    headOfficeLandmark: 'Near Tidel Park',
    headOfficeCity: 'Chennai',
    headOfficeState: 'Tamil Nadu',
    headOfficeCountry: 'India',
    headOfficeZipCode: '600096',
    headOfficeGoogleMapsUrl: 'https://maps.google.com/?q=Chennai',
    branchName: 'Bengaluru Branch',
    branchAddress: 'No. 45, 80 Feet Road, Koramangala',
    branchCity: 'Bengaluru',
    branchState: 'Karnataka',
    branchCountry: 'India',
    branchZipCode: '560034'
  },
  business: {
    gstNumber: '33ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    cinNumber: 'U72900TN2024PTC123456',
    tanNumber: 'CHNH01234E',
    msmeNumber: 'UDYAM-TN-01-0012345',
    iecCode: '0102030405',
    pfRegistrationNumber: 'TN/MAS/0012345/000',
    esiRegistrationNumber: '31000123450001001',
    professionalTaxNumber: 'PT123456789',
    labourLicenseNumber: 'LL/MAS/2018/12345',
    shopEstablishmentNumber: 'SE/MAS/2018/67890'
  },
  hrSettings: {
    employeeIdPrefix: 'HNT',
    autoGenerateEmployeeId: 'Yes',
    defaultDepartment: 'Engineering',
    defaultDesignation: 'Software Engineer',
    probationPeriod: '6',
    noticePeriod: '90',
    defaultShift: '09:30 AM - 06:30 PM',
    workingDays: 'Monday - Friday',
    weekendPolicy: 'Saturday & Sunday Off',
    attendanceMethod: 'Biometric & Web Check-in',
    biometricEnabled: true,
    overtimeEnabled: false,
    leaveCarryForward: true
  },
  payroll: {
    payrollFrequency: 'Monthly',
    salaryCycle: '1st to End of Month',
    salaryPaymentDate: '30',
    basicSalaryPct: '50',
    hraPct: '40',
    pfEnabled: true,
    esiEnabled: true,
    professionalTax: true,
    tdsEnabled: true,
    bonusEnabled: false,
    gratuityEnabled: true,
    payrollApproval: 'HR & Finance Head'
  },
  banking: {
    bankName: 'HDFC Bank',
    branchName: 'OMR Branch',
    accountHolderName: 'Hawkeye Nest Technologies Pvt. Ltd.',
    accountNumber: '50100234567890',
    confirmAccountNumber: '50100234567890',
    ifscCode: 'HDFC0001234',
    swiftCode: 'HDFCINBB',
    micrCode: '600240012',
    upiId: 'hawkeyenest@hdfc',
    salaryPaymentMethod: 'Bank Transfer'
  },
  branding: {
    companyThemeColor: '#2453D4',
    secondaryThemeColor: '#64748B',
    companyLogoName: 'logo.png',
    faviconName: 'favicon.ico',
    loginBgName: 'login-bg.jpg',
    dashboardBannerName: 'banner.png',
    emailHeaderLogoName: 'email-header.png',
    emailFooterLogoName: 'email-footer.png',
    companySealName: 'company-seal.png',
    digitalSignatureName: 'signature.png'
  },
  documents: {
    gstCertificate: { name: 'GST_Certificate.pdf', size: '245 KB', date: '2026-01-15' },
    panCard: { name: 'Company_PAN_Card.pdf', size: '180 KB', date: '2026-01-15' },
    cinCertificate: { name: 'CIN_Certificate.pdf', size: '310 KB', date: '2026-01-15' },
    incorporationCertificate: { name: 'Certificate_of_Incorporation.pdf', size: '520 KB', date: '2026-01-15' },
    pfCertificate: { name: 'PF_Registration_Certificate.pdf', size: '195 KB', date: '2026-02-10' },
    esiCertificate: { name: 'ESI_Registration_Certificate.pdf', size: '210 KB', date: '2026-02-10' },
    labourLicense: null,
    isoCertificate: null,
    companyPolicies: { name: 'Company_Policies_v2.0.pdf', size: '1.2 MB', date: '2026-05-20' },
    employeeHandbook: { name: 'Employee_Handbook_2026.pdf', size: '2.5 MB', date: '2026-06-01' }
  },
  systemSettings: {
    language: 'English (US)',
    timeZone: '(UTC+05:30) Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour (AM/PM)',
    passwordPolicy: 'Strong (Min 8 chars, 1 Uppercase, 1 Number, 1 Special)',
    twoFactorAuthentication: true,
    sessionTimeout: '30 Minutes',
    loginAttempts: '5',
    emailNotification: true,
    smsNotification: false,
    pushNotification: true,
    smtp: 'smtp.gmail.com',
    smsGateway: 'Twilio',
    googleWorkspace: 'Connected',
    microsoft365: 'Disconnected',
    biometricDevice: 'Connected'
  }
};

function CustomSelect({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="form-group-field">
      <label className="form-field-label">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="form-field-input flex items-center justify-between text-left w-full"
        >
          <span>{value || 'Select Option'}</span>
          <span className="text-slate-400 text-xs">▼</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${value === opt ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CompanyProfile() {
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [tempProfile, setTempProfile] = useState(JSON.parse(JSON.stringify(INITIAL_PROFILE)));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();
  useEffect(() => {
    apiFetch("/organization/profile")
      .then(data => {
        if (data && typeof data === 'object' && !data.error && data.general) {
          const merged = {
            general: { ...INITIAL_PROFILE.general, ...(data.general || {}) },
            contact: { ...INITIAL_PROFILE.contact, ...(data.contact || {}) },
            address: { ...INITIAL_PROFILE.address, ...(data.address || {}) },
            business: { ...INITIAL_PROFILE.business, ...(data.business || {}) },
            hrSettings: { ...INITIAL_PROFILE.hrSettings, ...(data.hrSettings || {}) },
            payroll: { ...INITIAL_PROFILE.payroll, ...(data.payroll || {}) },
            banking: { ...INITIAL_PROFILE.banking, ...(data.banking || {}) },
            branding: { ...INITIAL_PROFILE.branding, ...(data.branding || {}) },
            documents: { ...INITIAL_PROFILE.documents, ...(data.documents || {}) },
            systemSettings: { ...INITIAL_PROFILE.systemSettings, ...(data.systemSettings || {}) }
          };
          setProfile(merged);
          setTempProfile(JSON.parse(JSON.stringify(merged)));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        addToast("Failed to load company profile from database", "error");
        setLoading(false);
      });
  }, []);

  const handleInputChange = (section, field, value) => {
    setTempProfile(prev => {
      const updatedSection = { ...(prev?.[section] || {}), [field]: value };
      return { ...prev, [section]: updatedSection };
    });
  };

  const handleSave = (section) => {
    const updatedProfile = { ...profile, [section]: tempProfile[section] };
    apiFetch("/organization/profile", {
      method: "PUT",
      body: JSON.stringify(updatedProfile)
    })
      .then(() => {
        setProfile(updatedProfile);
        setIsEditing(false);
        setShowSuccess(true);
        addToast("Company profile updated successfully!", "success");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(err => {
        console.error(err);
        addToast("Failed to save changes to database", "error");
      });
  };

  const handleCancel = (section) => {
    setTempProfile(prev => {
      return { ...prev, [section]: JSON.parse(JSON.stringify(profile?.[section] || INITIAL_PROFILE[section])) };
    });
    setIsEditing(false);
  };

  const handleReset = (section) => {
    setTempProfile(prev => {
      return { ...prev, [section]: JSON.parse(JSON.stringify(INITIAL_PROFILE[section])) };
    });
  };

  const handleFileUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      handleInputChange('branding', field, file.name);
    }
  };

  const handleDocUpload = (docKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const newDoc = {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        date: new Date().toISOString().split('T')[0]
      };
      setTempProfile(prev => {
        return {
          ...prev,
          documents: { ...(prev?.documents || {}), [docKey]: newDoc }
        };
      });
      setProfile(prev => {
        return {
          ...prev,
          documents: { ...(prev?.documents || {}), [docKey]: newDoc }
        };
      });
      setShowSuccess(true);
    }
  };

  const handleDocDelete = (docKey) => {
    setTempProfile(prev => {
      return {
        ...prev,
        documents: { ...(prev?.documents || {}), [docKey]: null }
      };
    });
    setProfile(prev => {
      return {
        ...prev,
        documents: { ...(prev?.documents || {}), [docKey]: null }
      };
    });
    setShowSuccess(true);
  };

  // Company Overview Cards
  const companyOverview = [
    { label: 'Company Name', value: profile?.general?.companyName || '—', subtext: profile?.general?.companyType || '', icon: Building2, colorClass: 'overview-icon-blue' },
    { label: 'Employees', value: profile?.general?.numberOfEmployees || '0', subtext: 'Total Employees', icon: Users, colorClass: 'overview-icon-green' },
    { label: 'Working Days', value: profile?.hrSettings?.workingDays || '—', subtext: 'Weekly Schedule', icon: Calendar, colorClass: 'overview-icon-orange' },
    { label: 'Office Hours', value: profile?.hrSettings?.defaultShift || '—', subtext: 'Standard Time', icon: Clock, colorClass: 'overview-icon-purple' },
    { label: 'Currency', value: profile?.systemSettings?.currency || 'INR', subtext: 'Corporate Base', icon: IndianRupee, colorClass: 'overview-icon-cyan' },
  ];

  const handleDownloadPDF = () => {
    setExporting(true);
    addToast("Generating company profile report...", "info");

    fetch("/app/organization/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        generatedBy: "John Doe"
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to export PDF");
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const compName = (profile?.general?.companyName || 'company').replace(/\s+/g, '_');
        a.download = `${compName}_profile.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setExporting(false);
        addToast("Company profile exported successfully!", "success");
      })
      .catch(err => {
        console.error(err);
        setExporting(false);
        addToast("Failed to export company profile PDF", "error");
      });
  };

  const formatValue = (val) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return '—';
    }
    return val;
  };

  const getFormattedAddress = () => {
    const { headOfficeAddress1, headOfficeAddress2, headOfficeCity, headOfficeState, headOfficeCountry } = profile?.address || {};
    const parts = [
      headOfficeAddress1,
      headOfficeAddress2,
      headOfficeCity,
      headOfficeState,
      headOfficeCountry
    ].filter(part => part && String(part).trim() !== '');

    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  const renderEmptyState = (label, onAdd) => (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-4 w-full">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Building2 size={24} />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">No {label} Available</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6">You haven't added {label.toLowerCase()} information yet.</p>
      {canEdit('organization', 'company_profile') && (
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm hover:shadow"
        >
          <Plus size={16} /> Add {label}
        </button>
      )}
    </div>
  );

  const getSectionKey = (tabId) => {
    if (tabId === 'company-details') return 'general';
    if (tabId === 'hr-settings') return 'hrSettings';
    if (tabId === 'system-settings') return 'systemSettings';
    return tabId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your organization information</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport('organization', 'company_profile') && (
            <button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className={`px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export Profile
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="custom-alert">
          <div className="flex items-center gap-3">
            <div className="custom-alert-icon-container">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="custom-alert-title">Company profile updated successfully!</p>
              <p className="custom-alert-desc">Your changes have been saved and applied.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-emerald-600 hover:text-emerald-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Company Overview Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Company Overview</h2>
        <div className="overview-container">
          {companyOverview.map((item, index) => (
            <div key={index} className="overview-card">
              <div className={`overview-icon-container ${item.colorClass}`}>
                <item.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 leading-tight">{item.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{item.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="custom-tabs-container">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsEditing(false);
              }}
              className={`custom-tab-btn whitespace-nowrap ${activeTab === tab.id ? 'custom-tab-btn-active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">

        {/* Tab Content Card */}
        <div className="custom-info-card flex flex-col justify-between w-full">

          {/* Inline Edit Form View */}
          {isEditing ? (
            <div className="max-w-2xl mx-auto w-full space-y-6 py-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                Edit {TABS.find(t => t.id === activeTab)?.label}
              </h3>

              {/* Company Details Form */}
              {(activeTab === 'company-details' || activeTab === 'general') && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Company Name</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.general.companyName || ''}
                      onChange={(e) => handleInputChange('general', 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Legal Name</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.general.legalCompanyName || ''}
                      onChange={(e) => handleInputChange('general', 'legalCompanyName', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Company Code</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.general.companyCode || ''}
                      onChange={(e) => handleInputChange('general', 'companyCode', e.target.value)}
                    />
                  </div>
                  <CustomSelect
                    label="Company Type"
                    value={tempProfile.general.companyType}
                    options={['Private Limited', 'Public Limited', 'Partnership', 'LLP', 'Sole Proprietorship']}
                    onChange={(val) => handleInputChange('general', 'companyType', val)}
                  />
                  <div className="form-group-field">
                    <label className="form-field-label">Industry</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.general.industry || ''}
                      onChange={(e) => handleInputChange('general', 'industry', e.target.value)}
                    />
                  </div>
                  <CustomSelect
                    label="Business Type"
                    value={tempProfile.general.businessType}
                    options={['Service', 'Product', 'Mixed']}
                    onChange={(val) => handleInputChange('general', 'businessType', val)}
                  />
                  <div className="form-group-field">
                    <label className="form-field-label">Employees</label>
                    <input
                      type="text"
                      className="form-field-input"
                      placeholder="e.g. 250"
                      value={tempProfile.general.numberOfEmployees || ''}
                      onChange={(e) => handleInputChange('general', 'numberOfEmployees', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Established Year</label>
                    <input
                      type="text"
                      className="form-field-input"
                      placeholder="e.g. 2025"
                      value={tempProfile.general.yearEstablished || ''}
                      onChange={(e) => handleInputChange('general', 'yearEstablished', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Financial Year</label>
                    <input
                      type="text"
                      className="form-field-input"
                      placeholder="e.g. April - March"
                      value={tempProfile.general.financialYear || ''}
                      onChange={(e) => handleInputChange('general', 'financialYear', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Contact Form */}
              {activeTab === 'contact' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Official Email</label>
                    <input
                      type="email"
                      className="form-field-input"
                      value={tempProfile.contact.officialEmail}
                      onChange={(e) => handleInputChange('contact', 'officialEmail', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">HR Email</label>
                    <input
                      type="email"
                      className="form-field-input"
                      value={tempProfile.contact.hrEmail}
                      onChange={(e) => handleInputChange('contact', 'hrEmail', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Support Email</label>
                    <input
                      type="email"
                      className="form-field-input"
                      value={tempProfile.contact.supportEmail}
                      onChange={(e) => handleInputChange('contact', 'supportEmail', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Website</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.contact.website}
                      onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-field-input"
                      value={tempProfile.contact.phoneNumber}
                      onChange={(e) => handleInputChange('contact', 'phoneNumber', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-field-input"
                      value={tempProfile.contact.mobileNumber}
                      onChange={(e) => handleInputChange('contact', 'mobileNumber', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Address Form */}
              {activeTab === 'address' && (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-4">Head Office</h4>
                  <div className="form-grid-2col mb-6">
                    <div className="form-group-field">
                      <label className="form-field-label">Address Line 1</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeAddress1}
                        onChange={(e) => handleInputChange('address', 'headOfficeAddress1', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">Address Line 2</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeAddress2}
                        onChange={(e) => handleInputChange('address', 'headOfficeAddress2', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">City</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeCity}
                        onChange={(e) => handleInputChange('address', 'headOfficeCity', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">State</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeState}
                        onChange={(e) => handleInputChange('address', 'headOfficeState', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">Country</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeCountry}
                        onChange={(e) => handleInputChange('address', 'headOfficeCountry', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">ZIP Code</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.headOfficeZipCode}
                        onChange={(e) => handleInputChange('address', 'headOfficeZipCode', e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm mb-4">Branch Address</h4>
                  <div className="form-grid-2col">
                    <div className="form-group-field">
                      <label className="form-field-label">Branch Name</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.branchName}
                        onChange={(e) => handleInputChange('address', 'branchName', e.target.value)}
                      />
                    </div>
                    <div className="form-group-field">
                      <label className="form-field-label">Address</label>
                      <input
                        type="text"
                        className="form-field-input"
                        value={tempProfile.address.branchAddress}
                        onChange={(e) => handleInputChange('address', 'branchAddress', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Form */}
              {activeTab === 'business' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">GST Number</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.business.gstNumber}
                      onChange={(e) => handleInputChange('business', 'gstNumber', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">PAN Number</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.business.panNumber}
                      onChange={(e) => handleInputChange('business', 'panNumber', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">CIN Number</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.business.cinNumber}
                      onChange={(e) => handleInputChange('business', 'cinNumber', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">TAN Number</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.business.tanNumber}
                      onChange={(e) => handleInputChange('business', 'tanNumber', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* HR Settings Form */}
              {activeTab === 'hr-settings' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Working Days</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.hrSettings.workingDays}
                      onChange={(e) => handleInputChange('hrSettings', 'workingDays', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Office Hours</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.hrSettings.defaultShift}
                      onChange={(e) => handleInputChange('hrSettings', 'defaultShift', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Employee ID Prefix</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.hrSettings.employeeIdPrefix}
                      onChange={(e) => handleInputChange('hrSettings', 'employeeIdPrefix', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Attendance Method</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.hrSettings.attendanceMethod}
                      onChange={(e) => handleInputChange('hrSettings', 'attendanceMethod', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Payroll Form */}
              {activeTab === 'payroll' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Salary Cycle</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.payroll.salaryCycle}
                      onChange={(e) => handleInputChange('payroll', 'salaryCycle', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Payroll Frequency</label>
                    <AppDropdown
                value={tempProfile.payroll.payrollFrequency}
                onChange={v => handleInputChange('payroll', 'payrollFrequency', v)}
                options={[{value:'Monthly',label:'Monthly'},{value:'Bi-weekly',label:'Bi-weekly'},{value:'Weekly',label:'Weekly'}]}
                size="sm"
              />
                  </div>
                </div>
              )}

              {/* Banking Form */}
              {activeTab === 'banking' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Bank Name</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.banking.bankName}
                      onChange={(e) => handleInputChange('banking', 'bankName', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Account Holder</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.banking.accountHolderName}
                      onChange={(e) => handleInputChange('banking', 'accountHolderName', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.banking.ifscCode}
                      onChange={(e) => handleInputChange('banking', 'ifscCode', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Branding Form */}
              {activeTab === 'branding' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Company Logo</label>
                    <div className="form-upload-container">
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        onChange={(e) => handleFileUpload('companyLogoName', e)}
                      />
                      <label htmlFor="logo-upload" className="btn-form-cancel gap-2 cursor-pointer">
                        <Upload size={16} /> Choose Logo
                      </label>
                      <span className="text-xs text-slate-500 font-mono truncate max-w-[150px]">
                        {tempProfile.branding.companyLogoName || 'No file chosen'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Favicon</label>
                    <div className="form-upload-container">
                      <input
                        type="file"
                        id="favicon-upload"
                        className="hidden"
                        onChange={(e) => handleFileUpload('faviconName', e)}
                      />
                      <label htmlFor="favicon-upload" className="btn-form-cancel gap-2 cursor-pointer">
                        <Upload size={16} /> Choose Favicon
                      </label>
                      <span className="text-xs text-slate-500 font-mono truncate max-w-[150px]">
                        {tempProfile.branding.faviconName || 'No file chosen'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Company Theme Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-11 w-16 p-1 border border-slate-300 rounded-lg cursor-pointer"
                        value={tempProfile.branding.companyThemeColor}
                        onChange={(e) => handleInputChange('branding', 'companyThemeColor', e.target.value)}
                      />
                      <span className="font-mono text-sm">{tempProfile.branding.companyThemeColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* System Settings Form */}
              {activeTab === 'system-settings' && (
                <div className="form-grid-2col">
                  <div className="form-group-field">
                    <label className="form-field-label">Language</label>
                    <AppDropdown
                value={tempProfile.systemSettings.language}
                onChange={v => handleInputChange('systemSettings', 'language', v)}
                options={[{value:'English (US)',label:'English (US)'},{value:'English (UK)',label:'English (UK)'},{value:'Hindi',label:'Hindi'}]}
                size="sm"
              />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Time Zone</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.systemSettings.timeZone}
                      onChange={(e) => handleInputChange('systemSettings', 'timeZone', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Currency</label>
                    <input
                      type="text"
                      className="form-field-input"
                      value={tempProfile.systemSettings.currency}
                      onChange={(e) => handleInputChange('systemSettings', 'currency', e.target.value)}
                    />
                  </div>
                  <div className="form-group-field">
                    <label className="form-field-label">Date Format</label>
                    <AppDropdown
                value={tempProfile.systemSettings.dateFormat}
                onChange={v => handleInputChange('systemSettings', 'dateFormat', v)}
                options={[{value:'DD/MM/YYYY',label:'DD/MM/YYYY'},{value:'MM/DD/YYYY',label:'MM/DD/YYYY'},{value:'YYYY-MM-DD',label:'YYYY-MM-DD'}]}
                size="sm"
              />
                  </div>
                </div>
              )}

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-xl mt-6">
                <button
                  type="button"
                  onClick={() => handleCancel(getSectionKey(activeTab))}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(getSectionKey(activeTab))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save
                </button>
              </div>

            </div>
          ) : (
            /* Read-Only Details Mode */
            <>
              {/* General Tab Summary (Read-Only) */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="general-info-title">General Information</h3>
                  <div className="general-info-rows-container">

                    {/* Row 1 */}
                    <div className="general-info-grid-row">
                      <div>
                        <p className="general-field-label">Company Name</p>
                        <p className="general-field-value">{formatValue(profile.general.companyName)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Company Type</p>
                        <p className="general-field-value">{formatValue(profile.general.companyType)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Industry</p>
                        <p className="general-field-value">{formatValue(profile.general.industry)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Official Email</p>
                        <p className="general-field-value">{formatValue(profile.contact.officialEmail)}</p>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="general-info-grid-row">
                      <div>
                        <p className="general-field-label">Phone Number</p>
                        <p className="general-field-value">{formatValue(profile.contact.phoneNumber)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Website</p>
                        <p className="general-field-value">{formatValue(profile.contact.website)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Address</p>
                        <p className="general-field-value">{getFormattedAddress()}</p>
                      </div>
                      <div>
                        <p className="general-field-label">GST Number</p>
                        <p className="general-field-value">{formatValue(profile.business.gstNumber)}</p>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="general-info-grid-row">
                      <div>
                        <p className="general-field-label">PAN Number</p>
                        <p className="general-field-value">{formatValue(profile.business.panNumber)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">CIN Number</p>
                        <p className="general-field-value">{formatValue(profile.business.cinNumber)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Working Days</p>
                        <p className="general-field-value">{formatValue(profile.hrSettings.workingDays)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Office Hours</p>
                        <p className="general-field-value">{formatValue(profile.hrSettings.defaultShift)}</p>
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="general-info-grid-row">
                      <div>
                        <p className="general-field-label">Payroll Frequency</p>
                        <p className="general-field-value">{formatValue(profile.payroll.payrollFrequency)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Currency</p>
                        <p className="general-field-value">{formatValue(profile.systemSettings.currency)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">Bank Name</p>
                        <p className="general-field-value">{formatValue(profile.banking.bankName)}</p>
                      </div>
                      <div>
                        <p className="general-field-label">IFSC Code</p>
                        <p className="general-field-value">{formatValue(profile.banking.ifscCode)}</p>
                      </div>
                    </div>

                    {/* Row 5 */}
                    <div className="general-info-grid-row">
                      <div>
                        <p className="general-field-label">Company Logo</p>
                        {profile.branding.companyLogoName ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                              <Bird size={16} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{profile.branding.companyLogoName}</span>
                          </div>
                        ) : (
                          <p className="general-field-value">—</p>
                        )}
                      </div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>

                  </div>
                </div>
              )}

              {/* Company Details Tab (Read-Only) */}
              {activeTab === 'company-details' && (
                !profile.general.companyName ? (
                  renderEmptyState('Company Details', () => setIsEditing(true))
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Company Details</h3>
                      {canEdit('organization', 'company_profile') && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <p className="text-slate-400 font-medium">Company Name</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.companyName)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Legal Name</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.legalCompanyName)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Company Code</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.companyCode)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Company Type</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.companyType)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Industry</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.industry)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Business Type</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.businessType)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Employees</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.numberOfEmployees)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Established</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.general.yearEstablished)}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Contact Tab (Read-Only) */}
              {activeTab === 'contact' && (
                !profile.contact.officialEmail && !profile.contact.phoneNumber ? (
                  renderEmptyState('Contact Details', () => setIsEditing(true))
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Contact Details</h3>
                      {canEdit('organization', 'company_profile') && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <p className="text-slate-400 font-medium">Official Email</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.officialEmail)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">HR Email</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.hrEmail)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Phone Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.phoneNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Website</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.website)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Support Email</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.supportEmail)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Mobile Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.contact.mobileNumber)}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Address Tab (Read-Only) */}
              {activeTab === 'address' && (
                !profile.address.headOfficeAddress1 && !profile.address.branchAddress ? (
                  renderEmptyState('Address Details', () => setIsEditing(true))
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Address Details</h3>
                      {canEdit('organization', 'company_profile') && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <p className="text-slate-400 font-medium">Head Office Address</p>
                        <p className="text-slate-800 font-semibold mt-1">{getFormattedAddress()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Google Maps Link</p>
                        <p className="text-slate-800 font-semibold mt-1">
                          {profile.address.headOfficeGoogleMapsUrl ? (
                            <a href={profile.address.headOfficeGoogleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              View Location
                            </a>
                          ) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Branch Name</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.address.branchName)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Branch Address</p>
                        <p className="text-slate-800 font-semibold mt-1">
                          {profile.address.branchAddress ? `${profile.address.branchAddress}, ${profile.address.branchCity}, ${profile.address.branchState}, ${profile.address.branchCountry}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Business Tab (Read-Only) */}
              {activeTab === 'business' && (
                !profile.business.gstNumber && !profile.business.panNumber ? (
                  renderEmptyState('Business Details', () => setIsEditing(true))
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Business Details</h3>
                      {canEdit('organization', 'company_profile') && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <p className="text-slate-400 font-medium">GST Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.gstNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">PAN Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.panNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">CIN Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.cinNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">TAN Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.tanNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">MSME Number</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.msmeNumber)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">IEC Code</p>
                        <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.business.iecCode)}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* HR Settings Tab (Read-Only) */}
              {activeTab === 'hr-settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">HR Settings</h3>
                    {canEdit('organization', 'company_profile') && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium">Working Days</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.hrSettings.workingDays)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Office Hours</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.hrSettings.defaultShift)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Employee ID Prefix</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.hrSettings.employeeIdPrefix)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Attendance Method</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.hrSettings.attendanceMethod)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll Tab (Read-Only) */}
              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Payroll</h3>
                    {canEdit('organization', 'company_profile') && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium">Salary Cycle</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.payroll.salaryCycle)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Payroll Frequency</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.payroll.payrollFrequency)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Currency</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.systemSettings.currency)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Banking Tab (Read-Only) */}
              {activeTab === 'banking' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Banking</h3>
                    {canEdit('organization', 'company_profile') && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium">Bank Name</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.banking.bankName)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Account Holder</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.banking.accountHolderName)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">IFSC Code</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.banking.ifscCode)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Branding Tab (Read-Only) */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Branding</h3>
                    {canEdit('organization', 'company_profile') && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium">Logo</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.branding.companyLogoName)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Favicon</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.branding.faviconName)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Theme Color</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: profile.branding.companyThemeColor }}></span>
                        <span className="text-slate-800 font-semibold font-mono">{formatValue(profile.branding.companyThemeColor)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab Form */}
              {activeTab === 'documents' && (
                <div>
                  <h3 className="general-info-title">Company Documents</h3>
                  <div className="overflow-x-auto">
                    <table className="docs-table">
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>File Name</th>
                          <th>Size</th>
                          <th>Upload Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries({
                          gstCertificate: 'GST Certificate',
                          panCard: 'PAN Card',
                          cinCertificate: 'CIN Certificate',
                          incorporationCertificate: 'Incorporation Certificate',
                          pfCertificate: 'PF Certificate',
                          esiCertificate: 'ESI Certificate',
                          labourLicense: 'Labour License',
                          isoCertificate: 'ISO Certificate',
                          companyPolicies: 'Company Policies',
                          employeeHandbook: 'Employee Handbook'
                        }).map(([docKey, docLabel]) => {
                          const docObj = tempProfile.documents[docKey];
                          return (
                            <tr key={docKey}>
                              <td className="font-semibold text-slate-700">{docLabel}</td>
                              <td>
                                {docObj ? (
                                  <span className="text-sm font-mono text-slate-600 flex items-center gap-1.5">
                                    <FileText size={14} className="text-slate-400" />
                                    {docObj.name}
                                  </span>
                                ) : (
                                  <span className="text-xs italic text-slate-400">Not Uploaded</span>
                                )}
                              </td>
                              <td className="text-slate-500 text-sm">{docObj ? docObj.size : '-'}</td>
                              <td className="text-slate-500 text-sm">{docObj ? docObj.date : '-'}</td>
                              <td>
                                <div className="flex justify-end gap-2">
                                  {docObj ? (
                                    <>
                                      <button
                                        className="btn-doc-action btn-doc-view flex items-center gap-1"
                                        onClick={() => alert(`Viewing file: ${docObj.name}`)}
                                      >
                                        <Eye size={12} /> View
                                      </button>
                                      <button
                                        className="btn-doc-action btn-doc-download flex items-center gap-1"
                                        onClick={() => alert(`Downloading file: ${docObj.name}`)}
                                      >
                                        <Download size={12} /> Download
                                      </button>
                                      {canDelete('organization', 'company_profile') && (
                                        <button
                                          className="btn-doc-action btn-doc-delete flex items-center gap-1"
                                          onClick={() => handleDocDelete(docKey)}
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    canEdit('organization', 'company_profile') && (
                                      <div className="relative">
                                        <input
                                          type="file"
                                          id={`upload-${docKey}`}
                                          className="hidden"
                                          onChange={(e) => handleDocUpload(docKey, e)}
                                        />
                                        <label
                                          htmlFor={`upload-${docKey}`}
                                          className="btn-doc-action btn-doc-upload flex items-center gap-1 cursor-pointer"
                                        >
                                          <Upload size={12} /> Upload
                                        </label>
                                      </div>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* System Settings Tab (Read-Only) */}
              {activeTab === 'system-settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">System Settings</h3>
                    {canEdit('organization', 'company_profile') && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-doc-action btn-doc-view flex items-center gap-1.5 px-4 py-2"
                      >
                        <Edit2 size={14} /> Edit Settings
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium">Language</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.systemSettings.language)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Time Zone</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.systemSettings.timeZone)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Currency</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.systemSettings.currency)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Date Format</p>
                      <p className="text-slate-800 font-semibold mt-1">{formatValue(profile.systemSettings.dateFormat)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
