import React, { useState, useEffect, useRef } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Upload, Download, Trash2, FileText, Plus, Eye, User, Folder, CheckCircle, FileCheck, X } from 'lucide-react';
import { useToast } from '../ui/Toast';
import EmployeeAvatar from './EmployeeAvatar';
import './employee-module.css';
import { apiFetch } from '../../lib/api';
import { canCreate } from '../../lib/permissions';

export default function EmployeeDocuments() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmpProfile, setSelectedEmpProfile] = useState(null);

  // New Doc Form
  const [docType, setDocType] = useState('PAN');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

  const [currentEmpId, setCurrentEmpId] = useState(() => {
    if (isEmployeeRole) return authUserId;
    return localStorage.getItem('selectedEmployeeId') || authUserId || '1';
  });

  const handleEmployeeSelect = (newId) => {
    if (!newId) return;
    localStorage.setItem('selectedEmployeeId', String(newId));
    setCurrentEmpId(String(newId));
  };

  // Fetch employees list for dropdown
  useEffect(() => {
    if (isEmployeeRole) return;

    if (isTeamLeaderRole) {
      apiFetch('/employees/team-members')
        .then(res => {
          if (res && Array.isArray(res.members)) {
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
  }, [isEmployeeRole, isTeamLeaderRole]);

  // Load employee profile & documents when currentEmpId changes
  const loadDocuments = () => {
    if (!currentEmpId) return;
    setLoading(true);

    apiFetch(`/employees/${currentEmpId}/profile`)
      .then(prof => {
        if (prof && !prof.error) setSelectedEmpProfile(prof);
      })
      .catch(() => { });

    apiFetch(`/employees/${currentEmpId}/documents`)
      .then(data => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading documents:", err);
        setDocuments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDocuments();
  }, [currentEmpId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("File size must be under 5MB", "error");
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast("Please select a document file to upload", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('docType', docType);

    try {
      const res = await apiFetch(`/employees/${currentEmpId}/documents`, {
        method: 'POST',
        body: formData
      });

      addToast(res?.message || "Document uploaded successfully!", "success");
      setFileName('');
      setSelectedFile(null);
      setShowAddForm(false);
      setUploading(false);
      loadDocuments();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to upload document file", "error");
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document record?")) return;

    try {
      await apiFetch(`/employees/documents/${docId}`, {
        method: "DELETE"
      });
      addToast("Document deleted successfully", "success");
      loadDocuments();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to delete document", "error");
    }
  };

  const dropdownOptions = allEmployees.map(emp => ({
    value: String(emp.id),
    label: `${emp.name} (${emp.employee_code || emp.employeeId || emp.emp_code || (emp.id ? `EMP${String(emp.id).padStart(4, '0')}` : '')})`
  }));

  const filteredDocs = documents.filter(doc =>
    (doc.file_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.doc_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hrms-content">
      {/* Header */}
      <div className="hrms-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
          Employee Documents
        </h1>

        {/* Action Bar & Employee Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isEmployeeRole && dropdownOptions.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '14px',
              padding: '8px 14px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
              minWidth: '340px'
            }}>
              <User size={18} color="#2563EB" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Employee:
              </span>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <AppDropdown
                  value={String(currentEmpId)}
                  onChange={(val) => handleEmployeeSelect(val)}
                  options={dropdownOptions}
                  placeholder="Select Employee..."
                  size="sm"
                />
              </div>
            </div>
          )}

          {canCreate('employees', 'employee_documents') && (
            <button
              type="button"
              className="hrms-primary-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                borderRadius: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Upload size={16} /> Register Document
            </button>
          )}
        </div>
      </div>

      {/* Selected Employee Info Strip */}
      {selectedEmpProfile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '14px 20px',
          borderRadius: '14px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <EmployeeAvatar
            name={selectedEmpProfile.name}
            photoUrl={selectedEmpProfile.profilePhoto}
            size={42}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{selectedEmpProfile.name}</span>
            <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '12px' }}>
              {selectedEmpProfile.roleName || 'Staff'} • {selectedEmpProfile.deptName || 'General'}
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '8px' }}>
            {documents.length} File(s) Archived
          </span>
        </div>
      )}

      {/* Add Document Form Overlay Modal */}
      {showAddForm && (
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
            width: '600px',
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
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
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
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <FileCheck size={22} style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    Register Employee Document
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Upload identity proofs, contracts, or compliance files
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
              >
                <X size={18} style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>Document Type *</label>
                  <AppDropdown
                    value={docType}
                    onChange={v => setDocType(v)}
                    options={[
                      { value: 'PAN', label: 'PAN Card' },
                      { value: 'Aadhaar', label: 'Aadhaar Card' },
                      { value: 'Passport', label: 'Passport' },
                      { value: 'Driving License', label: 'Driving License' },
                      { value: 'Offer Letter', label: 'Offer Letter' },
                      { value: 'Appointment Letter', label: 'Appointment Letter' },
                      { value: 'Relieving Letter', label: 'Relieving Letter' },
                      { value: 'Payslip', label: 'Salary Slip' },
                      { value: 'Contract', label: 'Contract / Agreement' }
                    ]}
                    size="sm"
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155' }}>
                    Select Document File * <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>(Max 5MB • PDF, PNG, JPG, DOCX)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          addToast("File size must be under 5MB", "error");
                          return;
                        }
                        setSelectedFile(file);
                        setFileName(file.name);
                      }
                    }}
                    style={{
                      border: isDragging ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                      borderRadius: '14px',
                      padding: '24px 20px',
                      textAlign: 'center',
                      background: isDragging ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      onClick={(e) => e.stopPropagation()}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      style={{ display: 'none' }}
                      id="employee-doc-file-input"
                    />
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: selectedFile ? '#ECFDF5' : '#EFF6FF',
                      color: selectedFile ? '#059669' : '#2563EB',
                      display: 'grid',
                      placeItems: 'center'
                    }}>
                      {selectedFile ? <FileCheck size={24} /> : <Upload size={24} />}
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'block' }}>
                        {fileName ? fileName : 'Click to choose file or drag document here'}
                      </span>
                      {fileName ? (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                          ✓ File selected ({selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : ''})
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          Supports PDF, JPG, PNG, and DOCX files up to 5MB
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        marginTop: '4px',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#2563EB',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {fileName ? 'Choose Different File' : 'Browse File'}
                    </button>
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
                  onClick={() => setShowAddForm(false)}
                  style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hrms-primary-btn"
                  disabled={uploading}
                  style={{
                    borderRadius: '10px',
                    padding: '9px 22px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload & Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="hrms-card" style={{ padding: 0, borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="hrms-flex-between" style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div className="hrms-search-input" style={{ flex: 'none', width: '220px' }}>
            <Search className="hrms-search-icon" size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '8px', paddingLeft: '34px', fontSize: '13px' }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>
            Showing {filteredDocs.length} of {documents.length} documents
          </span>
        </div>

        {/* Table */}
        <div className="hrms-table-container">
          <table className="hrms-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Document Type</th>
                <th>Document Name</th>
                <th>Uploaded Date</th>
                <th style={{ paddingRight: '24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>Loading document records...</p>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    <Folder size={32} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#334155' }}>No Documents Found</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>Click "Register Document" to upload a new record for this employee.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const fileUrl = doc.file_path.startsWith('http') ? doc.file_path : (doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`);
                  return (
                    <tr key={doc.id}>
                      <td style={{ paddingLeft: '24px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE'
                        }}>
                          {doc.doc_type}
                        </span>
                      </td>
                      <td>
                        <div className="hrms-flex-start" style={{ gap: '10px' }}>
                          <FileText size={18} color="#64748B" />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{doc.file_name}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                        {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View Document"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: '#F1F5F9', color: '#2563EB', textDecoration: 'none'
                            }}
                          >
                            <Eye size={15} />
                          </a>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            title="Download Document"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: '#ECFDF5', color: '#059669', textDecoration: 'none'
                            }}
                          >
                            <Download size={15} />
                          </a>
                          <button
                            type="button"
                            title="Delete Document"
                            onClick={() => handleDelete(doc.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '8px',
                              border: 'none', background: '#FEE2E2', color: '#EF4444',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
