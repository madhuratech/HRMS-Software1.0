import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  XCircle, UserCheck, Edit3, Trash2, X, RefreshCw, ChevronRight,
  Info, ArrowRight, ShieldCheck, Check, Search, AlertCircle
} from 'lucide-react';
import AppDropdown from '../ui/AppDropdown';
import EmployeeAvatar from './EmployeeAvatar';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import {
  EMPLOYEE_FIELDS,
  downloadEmployeeExcelTemplate,
  parseEmployeeExcel,
  validateEmployeeRows,
  formatToYmd
} from '../../utils/employeeExcel';

export default function EmployeeImportModal({ isOpen, onClose, onImportSuccess }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [meta, setMeta] = useState({
    departments: [],
    designations: [],
    branches: [],
    teams: [],
    existingEmployees: []
  });

  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, ready: 0, missing: 0, existing: 0, errors: 0 });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ready' | 'attention' | 'existing'
  const [searchTerm, setSearchTerm] = useState('');

  // Row Editor States
  const [editingRow, setEditingRow] = useState(null);
  const [editorActiveTab, setEditorActiveTab] = useState('personal'); // 'personal' | 'employment' | 'contact' | 'salary'

  // Update existing confirmation
  const [updateExistingAll, setUpdateExistingAll] = useState(true);

  // Fetch metadata on mount
  useEffect(() => {
    if (isOpen) {
      setLoadingMeta(true);
      apiFetch('/employees/import-meta')
        .then(data => {
          if (data) setMeta(data);
          setLoadingMeta(false);
        })
        .catch(err => {
          console.error("Failed to load import metadata:", err);
          setLoadingMeta(false);
        });
    } else {
      // Reset on close
      setFile(null);
      setRows([]);
      setSummary({ total: 0, ready: 0, missing: 0, existing: 0, errors: 0 });
      setEditingRow(null);
    }
  }, [isOpen]);

  const handleDownloadTemplate = () => {
    downloadEmployeeExcelTemplate(meta);
    addToast("Excel Template downloaded. Fill employee details and upload.", "success");
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (uploadedFile) => {
    const name = uploadedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      addToast("Please upload an Excel file (.xlsx or .xls)", "error");
      return;
    }

    setFile(uploadedFile);
    setIsParsing(true);

    try {
      const parsedRows = await parseEmployeeExcel(uploadedFile);
      if (parsedRows.length === 0) {
        addToast("No employee rows found in the uploaded file.", "error");
        setIsParsing(false);
        return;
      }

      const { rows: validated, summary: sum } = validateEmployeeRows(parsedRows, meta);
      setRows(validated);
      setSummary(sum);
      setIsParsing(false);
      addToast(`Parsed ${parsedRows.length} employee rows from Excel`, "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to process Excel file", "error");
      setIsParsing(false);
    }
  };

  const handleRemoveRow = (rowId) => {
    const updated = rows.filter(r => r._rowId !== rowId);
    const { rows: reval, summary: sum } = validateEmployeeRows(updated, meta);
    setRows(reval);
    setSummary(sum);
    addToast("Row removed from import preview", "info");
  };

  const handleOpenEdit = (row) => {
    setEditingRow({ ...row });
    setEditorActiveTab('personal');
  };

  const handleEditorChange = (field, value) => {
    if (!editingRow) return;
    setEditingRow(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        const f = field === 'firstName' ? value : updated.firstName;
        const l = field === 'lastName' ? value : updated.lastName;
        updated.name = `${f} ${l}`.trim();
        updated.fullName = updated.name;
      }
      return updated;
    });
  };

  const handleSaveEditedRow = () => {
    if (!editingRow) return;

    const updatedRows = rows.map(r => r._rowId === editingRow._rowId ? editingRow : r);
    const { rows: reval, summary: sum } = validateEmployeeRows(updatedRows, meta);
    setRows(reval);
    setSummary(sum);
    setEditingRow(null);
    addToast(`Row #${editingRow._rowId} updated and verified`, "success");
  };

  const handleConfirmImport = async () => {
    const readyRows = rows.filter(r => r._status === 'Ready' || (r._status === 'Existing' && r._action === 'update'));

    if (readyRows.length === 0) {
      addToast("No valid rows ready to import. Please edit missing fields or resolve errors first.", "error");
      return;
    }

    const hasProblemRows = rows.some(r => r._status === 'Missing Fields' || r._status === 'Error');
    if (hasProblemRows) {
      const confirmProceed = window.confirm(
        `There are ${summary.missing + summary.errors} rows with missing required fields or errors.\n\n` +
        `Only the ${readyRows.length} verified rows will be imported.\n\nDo you want to proceed with importing ${readyRows.length} employees?`
      );
      if (!confirmProceed) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employees: readyRows,
        updateExisting: updateExistingAll
      };

      const res = await apiFetch('/employees/bulk-import', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res || res.error) {
        throw new Error(res?.error || res?.message || "Import failed");
      }

      addToast(
        `Import complete! Created: ${res.createdCount || 0}, Updated: ${res.updatedCount || 0}${res.failedCount ? `, Failed: ${res.failedCount}` : ''}`,
        'success'
      );

      if (onImportSuccess) onImportSuccess(res);
      onClose();
    } catch (err) {
      console.error("Bulk import error:", err);
      addToast(err.message || "Failed to import employees", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter rows
  const filteredRows = rows.filter(r => {
    if (activeFilter === 'ready' && r._status !== 'Ready') return false;
    if (activeFilter === 'attention' && r._status !== 'Missing Fields' && r._status !== 'Error') return false;
    if (activeFilter === 'existing' && r._status !== 'Existing') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const n = (r.name || '').toLowerCase();
      const e = (r.email || '').toLowerCase();
      const c = (r.employeeCode || '').toLowerCase();
      const d = (r.department || '').toLowerCase();
      return n.includes(q) || e.includes(q) || c.includes(q) || d.includes(q);
    }
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1240px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>
                Employee Excel Import & Preview
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                Source of truth corresponds with Add Employee form. Complete missing fields directly inside HRMS.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="hrms-secondary-btn"
              style={{
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#2563EB',
                borderColor: '#BFDBFE',
                background: '#FFFFFF'
              }}
              title="Download clean .xlsx template with exact Add Employee fields"
            >
              <Download size={15} /> Download Excel Template
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* If No File Uploaded Yet */}
          {rows.length === 0 ? (
            <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed #93C5FD',
                  borderRadius: '18px',
                  padding: '48px 32px',
                  background: '#F0F7FF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.12)'
                }}>
                  <UploadCloud size={32} />
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
                  {isParsing ? 'Analyzing and mapping Excel data...' : 'Upload Employee Excel Sheet'}
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                  Drag & drop your <strong>.xlsx</strong> or <strong>.xls</strong> spreadsheet here, or click to browse.
                  <br />Columns will automatically map to Add Employee form fields.
                </p>

                <button
                  type="button"
                  className="hrms-primary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 22px',
                    margin: '0 auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px'
                  }}
                  disabled={isParsing}
                >
                  <FileSpreadsheet size={16} /> Choose Excel File
                </button>
              </div>

              {/* Template Download Prompt */}
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Info size={20} color="#2563EB" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1E293B', display: 'block' }}>
                      Don't have the Excel template yet?
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Download the pre-formatted sheet containing all Add Employee fields and active master data.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="hrms-secondary-btn"
                  style={{ borderRadius: '8px', padding: '7px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  <Download size={14} /> Download Template
                </button>
              </div>
            </div>
          ) : (
            /* Uploaded Preview State */
            <div>
              {/* Summary Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Total In Excel</span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{summary.total}</div>
                </div>

                <div style={{ padding: '14px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Ready to Import
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>{summary.ready}</div>
                </div>

                <div style={{ padding: '14px 16px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                  <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} /> Missing Fields
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>{summary.missing}</div>
                </div>

                <div style={{ padding: '14px 16px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={13} /> Existing Records
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>{summary.existing}</div>
                </div>

                <div style={{ padding: '14px 16px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={13} /> Fatal Errors
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#DC2626', marginTop: '2px' }}>{summary.errors}</div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeFilter === 'all' ? '#FFFFFF' : 'transparent',
                      color: activeFilter === 'all' ? '#0F172A' : '#64748B',
                      boxShadow: activeFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    All ({summary.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ready')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeFilter === 'ready' ? '#FFFFFF' : 'transparent',
                      color: activeFilter === 'ready' ? '#15803D' : '#64748B',
                      boxShadow: activeFilter === 'ready' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Ready ({summary.ready})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('attention')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeFilter === 'attention' ? '#FFFFFF' : 'transparent',
                      color: activeFilter === 'attention' ? '#D97706' : '#64748B',
                      boxShadow: activeFilter === 'attention' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Needs Attention ({summary.missing + summary.errors})
                  </button>
                  {summary.existing > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('existing')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: activeFilter === 'existing' ? '#FFFFFF' : 'transparent',
                        color: activeFilter === 'existing' ? '#2563EB' : '#64748B',
                        boxShadow: activeFilter === 'existing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Existing Records ({summary.existing})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', width: '240px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search preview rows..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 32px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRows([]);
                      setFile(null);
                    }}
                    className="hrms-secondary-btn"
                    style={{ borderRadius: '8px', padding: '7px 12px', fontSize: '12px' }}
                  >
                    <RefreshCw size={13} /> Re-upload
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                overflowX: 'auto',
                backgroundColor: '#FFFFFF'
              }}>
                <table className="hrms-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Emp Code</th>
                      <th>Employee Name & Email</th>
                      <th>Contact No</th>
                      <th>Department & Role</th>
                      <th>Shift Type</th>
                      <th>Missing / Attention Items</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          No rows match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isReady = row._status === 'Ready';
                        const isMissing = row._status === 'Missing Fields';
                        const isExisting = row._status === 'Existing';
                        const isError = row._status === 'Error';

                        return (
                          <tr
                            key={row._rowId}
                            style={{
                              backgroundColor: isError ? '#FEF2F2' : isMissing ? '#FFFBEB' : '#FFFFFF',
                              borderBottom: '1px solid #F1F5F9'
                            }}
                          >
                            <td style={{ textAlign: 'center', color: '#64748B', fontWeight: '600' }}>
                              {row._rowId}
                            </td>

                            <td>
                              {isReady && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                                  fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D'
                                }}>
                                  <Check size={12} strokeWidth={3} /> Ready
                                </span>
                              )}
                              {isMissing && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                                  fontWeight: '700', backgroundColor: '#FEF3C7', color: '#B45309'
                                }}>
                                  <AlertTriangle size={12} /> Missing
                                </span>
                              )}
                              {isExisting && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                                  fontWeight: '700', backgroundColor: '#DBEAFE', color: '#1E40AF'
                                }}>
                                  <UserCheck size={12} /> Existing
                                </span>
                              )}
                              {isError && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                                  fontWeight: '700', backgroundColor: '#FEE2E2', color: '#B91C1C'
                                }}>
                                  <XCircle size={12} /> Error
                                </span>
                              )}
                            </td>

                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {row.employeeCode ? (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  fontWeight: '600',
                                  fontVariantNumeric: 'tabular-nums'
                                }}>
                                  {row.employeeCode}
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
                                  Auto (EMP####)
                                </span>
                              )}
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <EmployeeAvatar name={row.name || 'New Employee'} size={28} />
                                <div>
                                  <div style={{ fontWeight: '600', color: row.name ? '#0F172A' : '#EF4444' }}>
                                    {row.name || <span style={{ fontStyle: 'italic' }}>Name Missing</span>}
                                  </div>
                                  <div style={{ fontSize: '11px', color: row.email ? '#64748B' : '#EF4444' }}>
                                    {row.email || 'Email Missing'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ whiteSpace: 'nowrap' }}>
                              {row.phone ? (
                                <span style={{ color: '#334155' }}>{row.phone}</span>
                              ) : (
                                <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600' }}>Missing Phone</span>
                              )}
                            </td>

                            <td>
                              <div style={{ color: '#1E293B', fontWeight: '500' }}>{row.department || '—'}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{row.designation || '—'}</div>
                            </td>

                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                backgroundColor: row.shiftType ? '#F1F5F9' : '#FEF2F2',
                                color: row.shiftType ? '#475569' : '#EF4444',
                                fontWeight: '600'
                              }}>
                                {row.shiftType || 'Missing Shift'}
                              </span>
                            </td>

                            {/* Highlighted Missing / Attention Pills */}
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {row._missingFields?.map((mf, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      fontWeight: '600',
                                      border: '1px solid #FDE68A'
                                    }}
                                  >
                                    Missing {mf}
                                  </span>
                                ))}

                                {row._errors?.map((err, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      backgroundColor: '#FEE2E2',
                                      color: '#991B1B',
                                      fontWeight: '600',
                                      border: '1px solid #FECACA'
                                    }}
                                  >
                                    {err}
                                  </span>
                                ))}

                                {row._isExisting && (
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      backgroundColor: '#DBEAFE',
                                      color: '#1E40AF',
                                      fontWeight: '600',
                                      border: '1px solid #BFDBFE'
                                    }}
                                  >
                                    Existing Employee Found
                                  </span>
                                )}

                                {row._warnings?.map((w, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      backgroundColor: '#F1F5F9',
                                      color: '#475569',
                                      border: '1px solid #CBD5E1'
                                    }}
                                  >
                                    {w}
                                  </span>
                                ))}

                                {row._status === 'Ready' && (
                                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600' }}>
                                    ✓ All required fields valid
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(row)}
                                  style={{
                                    border: '1px solid #BFDBFE',
                                    background: '#EFF6FF',
                                    color: '#2563EB',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Edit missing fields directly in HRMS form"
                                >
                                  <Edit3 size={13} /> Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row._rowId)}
                                  style={{
                                    border: '1px solid #FEE2E2',
                                    background: '#FEF2F2',
                                    color: '#EF4444',
                                    borderRadius: '6px',
                                    padding: '5px',
                                    cursor: 'pointer'
                                  }}
                                  title="Remove from import"
                                >
                                  <Trash2 size={13} />
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
          )}
        </div>

        {/* Footer Actions */}
        {rows.length > 0 && (
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {summary.existing > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={updateExistingAll}
                    onChange={e => setUpdateExistingAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <span>Update existing employees if matching Employee Code is found ({summary.existing})</span>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="hrms-secondary-btn"
                onClick={onClose}
                style={{ borderRadius: '10px', padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="hrms-primary-btn"
                onClick={handleConfirmImport}
                disabled={isSubmitting || summary.ready === 0}
                style={{
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: summary.ready > 0
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : '#94A3B8',
                  boxShadow: summary.ready > 0 ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: summary.ready > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <CheckCircle2 size={16} />
                {isSubmitting ? 'Importing Employees...' : `Confirm Import (${summary.ready} Ready)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REUSABLE ROW EDITOR MODAL (Requirement 9 & 10) */}
      {editingRow && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden'
          }}>
            {/* Editor Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    Edit Imported Employee — Row #{editingRow._rowId}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                    Complete missing fields or correct invalid data before importing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRow(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 24px',
              borderBottom: '1px solid #F1F5F9',
              background: '#FFFFFF'
            }}>
              {[
                { id: 'personal', label: 'Personal Info' },
                { id: 'employment', label: 'Employment Info' },
                { id: 'contact', label: 'Contact & Login' },
                { id: 'salary', label: 'Salary & Bank' },
                { id: 'experience', label: 'Experience' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditorActiveTab(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: editorActiveTab === t.id ? '#EFF6FF' : 'transparent',
                    color: editorActiveTab === t.id ? '#2563EB' : '#64748B'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* TAB 1: PERSONAL INFO */}
              {editorActiveTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">First Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="text"
                      value={editingRow.firstName || ''}
                      onChange={e => handleEditorChange('firstName', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. Aarav"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="text"
                      value={editingRow.lastName || ''}
                      onChange={e => handleEditorChange('lastName', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. Sharma"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">
                      Date of Birth <span style={{ color: '#EF4444' }}>*</span>
                      {!editingRow.dob && <span style={{ color: '#D97706', fontSize: '11px', marginLeft: '6px' }}>(Missing)</span>}
                    </label>
                    <input
                      type="date"
                      value={editingRow.dob || ''}
                      onChange={e => handleEditorChange('dob', e.target.value)}
                      className="hrms-input"
                      style={{ borderColor: !editingRow.dob ? '#F59E0B' : undefined }}
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">
                      Gender <span style={{ color: '#EF4444' }}>*</span>
                      {!editingRow.gender && <span style={{ color: '#D97706', fontSize: '11px', marginLeft: '6px' }}>(Missing)</span>}
                    </label>
                    <AppDropdown
                      value={editingRow.gender || ''}
                      onChange={val => handleEditorChange('gender', val)}
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
                      value={editingRow.maritalStatus || ''}
                      onChange={val => handleEditorChange('maritalStatus', val)}
                      options={[
                        { value: '', label: 'Select Status' },
                        { value: 'Single', label: 'Single' },
                        { value: 'Married', label: 'Married' }
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Blood Group</label>
                    <input
                      type="text"
                      value={editingRow.bloodGroup || ''}
                      onChange={e => handleEditorChange('bloodGroup', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. O+, A+, B+"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYMENT INFO */}
              {editorActiveTab === 'employment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Employee Code</label>
                    <input
                      type="text"
                      value={editingRow.employeeCode || ''}
                      onChange={e => handleEditorChange('employeeCode', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. EMP0015 (Leave blank to auto-generate)"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">
                      Shift Type <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <AppDropdown
                      value={editingRow.shiftType || 'Regular Shift'}
                      onChange={val => handleEditorChange('shiftType', val)}
                      options={[
                        { value: 'Regular Shift', label: 'Regular Shift' },
                        { value: 'Rotational Shift', label: 'Rotational Shift' },
                        { value: 'Contract Shift', label: 'Contract Shift' }
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Department</label>
                    <AppDropdown
                      value={editingRow.department || ''}
                      onChange={val => handleEditorChange('department', val)}
                      options={[
                        { value: '', label: 'Select Department' },
                        ...(meta.departments?.map(d => ({ value: d, label: d })) || [])
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Designation</label>
                    <AppDropdown
                      value={editingRow.designation || ''}
                      onChange={val => handleEditorChange('designation', val)}
                      options={[
                        { value: '', label: 'Select Designation' },
                        ...(meta.designations?.map(d => ({ value: d, label: d })) || [])
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Branch</label>
                    <AppDropdown
                      value={editingRow.branch || ''}
                      onChange={val => handleEditorChange('branch', val)}
                      options={[
                        { value: '', label: 'Select Branch' },
                        ...(meta.branches?.map(b => ({ value: b, label: b })) || [])
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Team</label>
                    <AppDropdown
                      value={editingRow.teamName || ''}
                      onChange={val => handleEditorChange('teamName', val)}
                      options={[
                        { value: '', label: 'Select Team' },
                        ...(meta.teams?.map(t => ({ value: t, label: t })) || [])
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Reporting Manager</label>
                    <input
                      type="text"
                      value={editingRow.managerName || ''}
                      onChange={e => handleEditorChange('managerName', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Joining Date</label>
                    <input
                      type="date"
                      value={editingRow.joinDate || ''}
                      onChange={e => handleEditorChange('joinDate', e.target.value)}
                      className="hrms-input"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Employment Type</label>
                    <AppDropdown
                      value={editingRow.employmentType || 'Full-time'}
                      onChange={val => handleEditorChange('employmentType', val)}
                      options={[
                        { value: 'Full-time', label: 'Full-time' },
                        { value: 'Part-time', label: 'Part-time' },
                        { value: 'Contract', label: 'Contract' }
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT & CREDENTIALS */}
              {editorActiveTab === 'contact' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">
                      Login Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={editingRow.email || ''}
                      onChange={e => handleEditorChange('email', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. name@company.com"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">
                      Contact No / Phone <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={editingRow.phone || ''}
                      onChange={e => handleEditorChange('phone', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. +91 99999 99999"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Login Password</label>
                    <input
                      type="text"
                      value={editingRow.password || 'Employee@2026'}
                      onChange={e => handleEditorChange('password', e.target.value)}
                      className="hrms-input"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Emergency Contact No</label>
                    <input
                      type="text"
                      value={editingRow.emergencyContact || ''}
                      onChange={e => handleEditorChange('emergencyContact', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. Parent - +91 98888 88888"
                    />
                  </div>

                  <div className="hrms-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="hrms-label">Complete Address</label>
                    <textarea
                      value={editingRow.address || ''}
                      onChange={e => handleEditorChange('address', e.target.value)}
                      className="hrms-input"
                      rows="2"
                      style={{ height: 'auto', resize: 'vertical' }}
                      placeholder="Street, City, State..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: SALARY & BANKING */}
              {editorActiveTab === 'salary' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Monthly Gross Salary (INR)</label>
                    <input
                      type="number"
                      value={editingRow.salary || 60000}
                      onChange={e => handleEditorChange('salary', e.target.value)}
                      className="hrms-input"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Bank Name</label>
                    <input
                      type="text"
                      value={editingRow.bankName || ''}
                      onChange={e => handleEditorChange('bankName', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Account Number</label>
                    <input
                      type="text"
                      value={editingRow.accountNumber || ''}
                      onChange={e => handleEditorChange('accountNumber', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. 50100234567890"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">IFSC Code</label>
                    <input
                      type="text"
                      value={editingRow.ifscCode || ''}
                      onChange={e => handleEditorChange('ifscCode', e.target.value)}
                      className="hrms-input"
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: EXPERIENCE */}
              {editorActiveTab === 'experience' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="hrms-input-group">
                    <label className="hrms-label">Experience Type</label>
                    <AppDropdown
                      value={editingRow.experienceType || 'Experienced'}
                      onChange={val => handleEditorChange('experienceType', val)}
                      options={[
                        { value: 'Experienced', label: 'Experienced' },
                        { value: 'Fresher', label: 'Fresher' }
                      ]}
                      size="sm"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Total Exp Years</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editingRow.totalExpYears || 0}
                      onChange={e => handleEditorChange('totalExpYears', parseInt(e.target.value, 10) || 0)}
                      className="hrms-input"
                    />
                  </div>

                  <div className="hrms-input-group">
                    <label className="hrms-label">Total Exp Months</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={editingRow.totalExpMonths || 0}
                      onChange={e => handleEditorChange('totalExpMonths', parseInt(e.target.value, 10) || 0)}
                      className="hrms-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Editor Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                * Required fields: First Name, Last Name, Date of Birth, Gender, Shift Type, Email, Phone
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="hrms-secondary-btn"
                  onClick={() => setEditingRow(null)}
                  style={{ borderRadius: '8px', padding: '8px 16px' }}
                >
                  Discard
                </button>

                <button
                  type="button"
                  className="hrms-primary-btn"
                  onClick={handleSaveEditedRow}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={15} /> Save Row
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
