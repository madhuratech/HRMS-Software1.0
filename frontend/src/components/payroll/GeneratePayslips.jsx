import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { 
  Search, Eye, Download, ChevronDown, ChevronLeft, ChevronRight, 
  Plus, CheckCircle2, DollarSign, Calendar, Filter, X, 
  Building2, Users, AlertCircle, Printer, FileText, ArrowRight, ShieldCheck, Loader2
} from 'lucide-react';
import { apiFetch, getAuthToken } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../context/PermissionContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027];

export default function GeneratePayslips() {
  const { addToast } = useToast();
  const { userRole } = usePermissions();
  const normRole = String(userRole || '').toUpperCase().replace(/[\s_-]+/g, '');
  const isManagement = ['SUPERADMIN', 'ADMIN', 'HRMANAGER', 'HR', 'BRANCHMANAGER'].includes(normRole);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Data States
  const [payrollList, setPayrollList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Generate Form State
  const [genMonth, setGenMonth] = useState(MONTHS[new Date().getMonth()]);
  const [genYear, setGenYear] = useState(new Date().getFullYear().toString());
  const [genScope, setGenScope] = useState('all'); // 'all' | 'department' | 'employee'
  const [genDept, setGenDept] = useState('');
  const [genEmpId, setGenEmpId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Fetch departments & active employees once for dropdowns
  useEffect(() => {
    apiFetch('/organization/departments')
      .then(res => {
        if (Array.isArray(res)) setDepartments(res);
        else if (res && Array.isArray(res.data)) setDepartments(res.data);
      })
      .catch(() => {});

    apiFetch('/employees?status=Active')
      .then(res => {
        if (Array.isArray(res)) setActiveEmployees(res);
        else if (res && Array.isArray(res.data)) setActiveEmployees(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Payroll Records from Real Database
  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'All Months') params.append('month', selectedMonth);
      if (selectedYear !== 'All') params.append('year', selectedYear);
      if (deptFilter !== 'All Departments') params.append('department_id', deptFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', '1');
      params.append('limit', '100');

      const res = await apiFetch(`/payroll?${params.toString()}`);
      if (res && res.success && Array.isArray(res.data)) {
        setPayrollList(res.data);
      } else if (Array.isArray(res)) {
        setPayrollList(res);
      } else {
        setPayrollList([]);
      }
    } catch (err) {
      console.error('Failed to load payroll list:', err);
      addToast('Failed to load payroll records from database', 'error');
      setPayrollList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, deptFilter, statusFilter, search, addToast]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Generate Payroll Submission
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setGenerateError('');
    setGenerating(true);

    try {
      const payload = {
        month: genMonth,
        year: parseInt(genYear, 10),
        scope: genScope,
        department_id: genScope === 'department' ? genDept : null,
        employee_id: genScope === 'employee' ? genEmpId : null
      };

      const res = await apiFetch('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast(res.message || 'Payroll generated successfully', 'success');
        setShowGenerateModal(false);
        // Switch filter to the generated month/year to see newly generated records immediately
        setSelectedMonth(genMonth);
        setSelectedYear(genYear);
        await fetchPayroll();
      } else {
        setGenerateError(res.message || 'Failed to generate payroll');
        addToast(res.message || 'Failed to generate payroll', 'error');
      }
    } catch (err) {
      const msg = err.message || 'Server connection error during payroll generation';
      setGenerateError(msg);
      addToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Status Action: Approve Record
  const handleApprove = async (record) => {
    setActionLoadingId(record.id);
    try {
      const res = await apiFetch(`/payroll/${record.id}/approve`, { method: 'POST' });
      if (res && res.success) {
        addToast(res.message || 'Payroll approved', 'success');
        await fetchPayroll();
        if (selectedPayslip && selectedPayslip.id === record.id) {
          setSelectedPayslip(prev => ({ ...prev, status: 'Approved' }));
        }
      } else {
        addToast(res.message || 'Failed to approve payroll', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Status Action: Mark as Paid
  const handleMarkPaid = async (record) => {
    setActionLoadingId(record.id);
    try {
      const res = await apiFetch(`/payroll/${record.id}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ payment_mode: 'Bank Transfer' })
      });
      if (res && res.success) {
        addToast(res.message || 'Payroll marked as paid', 'success');
        await fetchPayroll();
        if (selectedPayslip && selectedPayslip.id === record.id) {
          setSelectedPayslip(prev => ({ ...prev, status: 'Paid', payment_date: new Date() }));
        }
      } else {
        addToast(res.message || 'Failed to mark as paid', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // View Payslip Modal
  const handleViewPayslip = async (record) => {
    try {
      const res = await apiFetch(`/payroll/${record.id}/payslip`);
      if (res && res.success && res.data) {
        setSelectedPayslip(res.data);
      } else {
        setSelectedPayslip(record);
      }
      setShowPayslipModal(true);
    } catch (e) {
      setSelectedPayslip(record);
      setShowPayslipModal(true);
    }
  };

  // Download PDF Payslip directly
  const handleDownloadPdf = async (record) => {
    try {
      addToast('Preparing payslip PDF...', 'info');
      const token = getAuthToken();
      const res = await fetch(`/app/payroll/${record.id}/download-pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to generate payslip PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const empCode = record.emp_code || `EMP${record.employee_id}`;
      a.download = `Payslip_${empCode}_${record.month}_${record.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Payslip PDF downloaded successfully', 'success');
    } catch (err) {
      console.error('Download error:', err);
      addToast('Could not download PDF. Please try again.', 'error');
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedMonth === 'All Months') {
      addToast('Please select a specific Month first to bulk approve.', 'warning');
      return;
    }
    try {
      const res = await apiFetch('/payroll/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });
      if (res && res.success) {
        addToast(res.message || 'Bulk approved', 'success');
        fetchPayroll();
      } else {
        addToast(res.message || 'Bulk approve failed', 'error');
      }
    } catch (e) {
      addToast('Failed to perform bulk approve', 'error');
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedMonth === 'All Months') {
      addToast('Please select a specific Month first to mark as paid.', 'warning');
      return;
    }
    try {
      const res = await apiFetch('/payroll/bulk-mark-paid', {
        method: 'POST',
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, payment_mode: 'Bank Transfer' })
      });
      if (res && res.success) {
        addToast(res.message || 'Bulk marked as paid', 'success');
        fetchPayroll();
      } else {
        addToast(res.message || 'Bulk mark paid failed', 'error');
      }
    } catch (e) {
      addToast('Failed to perform bulk payment', 'error');
    }
  };

  // Format currency
  const fmt = (num) => `₹ ${Number(num || 0).toLocaleString('en-IN')}`;

  // Totals for current list
  const totalEmployees = payrollList.length;
  const totalGross = payrollList.reduce((acc, curr) => acc + Number(curr.gross_salary || 0), 0);
  const totalNet = payrollList.reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);
  const paidCount = payrollList.filter(p => p.status === 'Paid').length;
  const approvedCount = payrollList.filter(p => p.status === 'Approved').length;

  // Filtered & Paginated records
  const paginatedList = payrollList.slice((page - 1) * limit, page * limit);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = String(status || 'Generated').toUpperCase();
    if (s === 'PAID') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
          <CheckCircle2 size={12} /> PAID
        </span>
      );
    }
    if (s === 'APPROVED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
          <CheckCircle2 size={12} /> APPROVED
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
          DRAFT
        </span>
      );
    }
    // Generated / Processing
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
        GENERATED
      </span>
    );
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
    border: '1px solid #F1F5F9',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif', paddingBottom: '32px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>
            {isManagement ? 'Payroll Management & Payslips' : 'My Payslip Records'}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            {isManagement 
              ? 'Generate, approve, and disburse employee monthly salaries with automated statutory calculations.'
              : 'View and download your monthly salary slips, deductions, and payment details.'
            }
          </p>
        </div>
        {isManagement && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                setGenerateError('');
                setShowGenerateModal(true);
              }}
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            >
              <Plus size={16} /> Generate Payroll
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#2563EB" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {isManagement ? 'Employees on Payroll' : 'Total Payslips'}
            </div>
          </div>
          <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '800' }}>{totalEmployees}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#16A34A" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>              {isManagement ? 'Total Gross Payroll' : 'Total Gross Salary'}
            </div>
          </div>
          <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '800' }}>{fmt(totalGross)}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#9333EA" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {isManagement ? 'Total Net Payable' : 'Total Net Received'}
            </div>
          </div>
          <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '800' }}>{fmt(totalNet)}</div>
        </div>

        {isManagement && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#059669" />
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Disbursement Progress</div>
            </div>
            <div style={{ fontSize: '18px', color: '#1E293B', fontWeight: '800' }}>
              <span style={{ color: '#059669' }}>{paidCount} Paid</span> • <span style={{ color: '#2563EB' }}>{approvedCount} Approved</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        
        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px', background: '#FAFBFF' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
            {/* Month Filter */}
            <div style={{ minWidth: '140px' }}>
              <AppDropdown 
                value={selectedMonth} 
                onChange={v => setSelectedMonth(v)} 
                options={[
                  { value: 'All Months', label: 'All Months' },
                  ...MONTHS.map(m => ({ value: m, label: m }))
                ]} 
                size="sm" 
              />
            </div>

            {/* Year Filter */}
            <div style={{ minWidth: '110px' }}>
              <AppDropdown 
                value={selectedYear} 
                onChange={v => setSelectedYear(v)} 
                options={[
                  { value: 'All', label: 'All Years' },
                  ...YEARS.map(y => ({ value: String(y), label: String(y) }))
                ]} 
                size="sm" 
              />
            </div>

            {/* Department Filter (Management only) */}
            {isManagement && (
              <div style={{ minWidth: '160px' }}>
                <AppDropdown 
                  value={deptFilter} 
                  onChange={v => setDeptFilter(v)} 
                  options={[
                    { value: 'All Departments', label: 'All Departments' },
                    ...departments.map(d => ({
                      value: String(d.id || d.dept_name || d.name || d.branch_name),
                      label: d.dept_name || d.name || d.branch_name
                    }))
                  ]} 
                  size="sm" 
                />
              </div>
            )}

            {/* Status Filter */}
            <div style={{ minWidth: '130px' }}>
              <AppDropdown 
                value={statusFilter} 
                onChange={v => setStatusFilter(v)} 
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Generated', label: 'Generated' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Draft', label: 'Draft' }
                ]} 
                size="sm" 
              />
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID, designation..."
                style={{ width: '100%', height: '36px', paddingLeft: '34px', paddingRight: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '12px', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Bulk Action Controls (Management only) */}
          {isManagement && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleBulkApprove}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={13} /> Bulk Approve
              </button>
              <button
                onClick={handleBulkMarkPaid}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <DollarSign size={13} /> Bulk Pay
              </button>
            </div>
          )}

        </div>

        {/* Payslip Records Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading payroll records from database...</div>
            </div>
          ) : paginatedList.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <FileText size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>No payroll records found</div>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                {selectedMonth !== 'All Months' 
                  ? `No payslip records found for ${selectedMonth} ${selectedYear}.`
                  : 'No payslip records available yet.'
                }
              </p>
              {isManagement && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  style={{ marginTop: '12px', padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  + Generate Now
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Employee</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Emp ID</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Department</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Pay Period</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Basic</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Allowances</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Gross Salary</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Deductions</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>Net Salary</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((row, index) => {
                  const empInitials = row.employee_name ? row.employee_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EM';
                  const isActionBusy = actionLoadingId === row.id;

                  return (
                    <tr 
                      key={row.id} 
                      style={{ borderBottom: index === paginatedList.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.15s' }}
                      className="hover:bg-slate-50/70"
                    >
                      {/* Employee Name */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {empInitials}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{row.employee_name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{row.designation || row.employee_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Employee Code */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        {row.emp_code || `EMP${row.employee_id}`}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', color: '#334155' }}>
                        {row.department || 'General'}
                      </td>

                      {/* Period */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                        {row.month} {row.year}
                      </td>

                      {/* Basic */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', color: '#475569' }}>
                        {fmt(row.basic)}
                      </td>

                      {/* Allowances */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', color: '#475569' }}>
                        {fmt(row.allowances + (row.hra || 0))}
                      </td>

                      {/* Gross */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                        {fmt(row.gross_salary)}
                      </td>

                      {/* Total Deductions */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>
                        - {fmt(row.total_deductions)}
                        {row.lop_days > 0 && <span style={{ fontSize: '10px', display: 'block', color: '#EA580C' }}>LOP: {row.lop_days}d</span>}
                      </td>

                      {/* Net Salary */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>
                        {fmt(row.net_salary)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {renderStatusBadge(row.status)}
                      </td>

                      {/* Contextual Actions */}
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          
                          {/* View Payslip Button */}
                          <button
                            onClick={() => handleViewPayslip(row)}
                            title="View Detailed Payslip"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#2563EB', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* Status Progression Action (Management only) */}
                          {isManagement && (row.status === 'Generated' || row.status === 'Draft') && (
                            <button
                              disabled={isActionBusy}
                              onClick={() => handleApprove(row)}
                              title="Approve Payroll Record"
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {isActionBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
                            </button>
                          )}

                          {isManagement && row.status === 'Approved' && (
                            <button
                              disabled={isActionBusy}
                              onClick={() => handleMarkPaid(row)}
                              title="Mark Payroll as Disbursed/Paid"
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {isActionBusy ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={13} />} Mark Paid
                            </button>
                          )}

                          {/* Download PDF Button */}
                          <button
                            onClick={() => handleDownloadPdf(row)}
                            title="Download PDF Payslip"
                            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Download size={13} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {payrollList.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, payrollList.length)} of {payrollList.length} records
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: '#64748B' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563EB', border: 'none', borderRadius: '6px', color: '#FFF', fontSize: '13px', fontWeight: '600' }}>
                {page}
              </button>
              <button 
                disabled={page * limit >= payrollList.length}
                onClick={() => setPage(page + 1)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: page * limit >= payrollList.length ? 'not-allowed' : 'pointer', color: '#64748B' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================== */}
      {/* 1. GENERATE PAYROLL MODAL                                  */}
      {/* ========================================================== */}
      {showGenerateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '520px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', background: 'linear-gradient(135deg, #FAFBFF 0%, #EFF6FF 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color="#FFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>Generate Monthly Payroll</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Calculate salaries based on attendance, leaves, and statutory deductions</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} color="#64748B" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGenerateSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Error Notice (if duplicate or validation failure) */}
              {generateError && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>Generation Notice</div>
                    <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '2px' }}>{generateError}</div>
                  </div>
                </div>
              )}

              {/* Month & Year Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Pay Month <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown 
                    value={genMonth} 
                    onChange={v => setGenMonth(v)} 
                    options={MONTHS.map(m => ({ value: m, label: m }))} 
                    size="sm" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Pay Year <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown 
                    value={genYear} 
                    onChange={v => setGenYear(v)} 
                    options={YEARS.map(y => ({ value: String(y), label: String(y) }))} 
                    size="sm" 
                  />
                </div>
              </div>

              {/* Scope Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  Target Employees <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'all', label: 'All Employees' },
                    { id: 'department', label: 'By Department' },
                    { id: 'employee', label: 'Single Employee' }
                  ].map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setGenScope(s.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: genScope === s.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        background: genScope === s.id ? '#EFF6FF' : '#FFF',
                        color: genScope === s.id ? '#1D4ED8' : '#64748B',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Dropdown (if Scope === department) */}
              {genScope === 'department' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Select Department <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={genDept}
                    onChange={v => setGenDept(v)}
                    options={[
                      { value: '', label: '-- Choose Department --' },
                      ...departments.map(d => ({
                        value: String(d.id || d.dept_name || d.name || d.branch_name),
                        label: d.dept_name || d.name || d.branch_name
                      }))
                    ]}
                    size="sm"
                  />
                </div>
              )}

              {/* Employee Dropdown (if Scope === employee) */}
              {genScope === 'employee' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Select Employee <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <AppDropdown
                    value={genEmpId}
                    onChange={v => setGenEmpId(v)}
                    options={[
                      { value: '', label: '-- Choose Active Employee --' },
                      ...activeEmployees.map(e => ({
                        value: String(e.id),
                        label: `${e.name || e.employee_name} (${e.emp_code || `EMP${String(e.id).padStart(4, '0')}`})`
                      }))
                    ]}
                    size="sm"
                  />
                </div>
              )}

              {/* Informational Policy Box */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B', lineHeight: '1.5' }}>
                <span style={{ fontWeight: '700', color: '#334155' }}>Calculation Policy:</span> Basic Salary (50%), HRA (40% of Basic), Special Allowances, PF (12% of Basic), ESI (if gross ≤ 21K), Professional Tax (₹200), and verified LOP unpaid leave deductions will be calculated automatically.
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                  }}
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {generating ? 'Processing Calculation...' : 'Generate Payroll'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. VIEW PAYSLIP MODAL                                      */}
      {/* ========================================================== */}
      {showPayslipModal && selectedPayslip && (() => {
        const p = selectedPayslip;
        const company = p.company || {};
        const empCode = p.emp_code || `EMP${p.employee_id}`;

        let eb = p.earnings_breakdown || {};
        if (typeof eb === 'string') {
          try { eb = JSON.parse(eb); } catch (e) { eb = {}; }
        }

        let db = p.deductions_breakdown || {};
        if (typeof db === 'string') {
          try { db = JSON.parse(db); } catch (e) { db = {}; }
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '820px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              
              {/* Modal Top Bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#2563EB" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Official Salary Payslip Preview</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>• {p.month} {p.year}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleDownloadPdf(p)}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={13} /> Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Printer size={13} /> Print
                  </button>
                  <button
                    onClick={() => setShowPayslipModal(false)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={14} color="#64748B" />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Payslip Content */}
              <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Company Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '20px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1E3A8A' }}>{company.company_name || 'Madhura Technologies'}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>{company.head_office_address || 'Tamil Nadu, India'}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>Email: {company.official_email || 'hr@madhuratech.com'} | Tel: {company.phone_number || '+91 9876543210'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SALARY PAYSLIP</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563EB', marginTop: '2px' }}>{p.month} {p.year}</div>
                    <div style={{ marginTop: '4px' }}>{renderStatusBadge(p.status)}</div>
                  </div>
                </div>

                {/* Employee Information Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Employee Name:</span>
                      <span style={{ color: '#0F172A', fontWeight: '700' }}>{p.employee_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Employee ID:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{empCode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Designation:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{p.designation || 'General Staff'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Department:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{p.department || 'General'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Date of Joining:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{p.join_date ? new Date(p.join_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Payment Mode:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{p.payment_mode || 'Bank Transfer'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Loss of Pay (LOP):</span>
                      <span style={{ color: p.lop_days > 0 ? '#DC2626' : '#0F172A', fontWeight: '700' }}>{p.lop_days || 0} Day(s)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Disbursement Date:</span>
                      <span style={{ color: '#0F172A', fontWeight: '600' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : 'Pending Disbursement'}</span>
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions Two-Column Breakdown Table */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#1E3A8A', color: '#FFF', fontWeight: '700', fontSize: '12px' }}>
                    <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>EARNINGS</span>
                      <span>AMOUNT (₹)</span>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>DEDUCTIONS</span>
                      <span>AMOUNT (₹)</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '12px' }}>
                    {/* Earnings Col */}
                    <div style={{ borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                      {[
                        { label: 'Basic Salary', val: p.basic },
                        { label: 'House Rent Allowance (HRA)', val: p.hra },
                        { label: 'Special / Other Allowances', val: p.allowances },
                        { label: 'Performance Bonus', val: p.bonus },
                        { label: 'Other Earnings', val: p.other_earnings }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFF' : '#FAFBFF' }}>
                          <span style={{ color: '#334155', fontWeight: '500' }}>{item.label}</span>
                          <span style={{ color: '#0F172A', fontWeight: '700' }}>{fmt(item.val)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Deductions Col */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        { label: 'Provident Fund (PF - 12%)', val: p.pf },
                        { label: 'Employee State Insurance (ESI)', val: p.esi },
                        { label: 'Statutory Tax / PT / TDS', val: p.tax },
                        { label: `Loss of Pay (${p.lop_days || 0} days)`, val: p.lop_amount },
                        { label: 'Other Deductions / Loan EMI', val: p.other_deductions }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFF' : '#FAFBFF' }}>
                          <span style={{ color: '#334155', fontWeight: '500' }}>{item.label}</span>
                          <span style={{ color: '#DC2626', fontWeight: '700' }}>{fmt(item.val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F8FAFC', borderTop: '2px solid #E2E8F0', fontWeight: '700', fontSize: '12px' }}>
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderRight: '1px solid #E2E8F0', color: '#1E3A8A' }}>
                      <span>Gross Earnings (A):</span>
                      <span>{fmt(p.gross_salary)}</span>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                      <span>Total Deductions (B):</span>
                      <span>- {fmt(p.total_deductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Salary Payable Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', border: '1px solid #86EFAC' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Salary Payable (A - B)</div>
                    <div style={{ fontSize: '12px', color: '#15803D', marginTop: '2px' }}>Disbursed via registered corporate bank account</div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532D' }}>
                    {fmt(p.net_salary)}
                  </div>
                </div>

                {/* System Signature Note */}
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
                  This is a computer-generated salary statement generated by Madhura HRMS. No physical signature is required.
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#64748B', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Close
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(p.status === 'Generated' || p.status === 'Draft') && (
                    <button
                      onClick={() => handleApprove(p)}
                      style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Approve Payslip
                    </button>
                  )}
                  {p.status === 'Approved' && (
                    <button
                      onClick={() => handleMarkPaid(p)}
                      style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadPdf(p)}
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
