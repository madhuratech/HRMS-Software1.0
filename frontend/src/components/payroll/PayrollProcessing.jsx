import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle2, AlertCircle, Clock, Users, Building2, 
  Wallet, ShieldCheck, ArrowRight, Loader2, Sparkles, RefreshCw, FileText, Check
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollProcessing() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [scope, setScope] = useState('all'); // 'all' | 'department' | 'employee'
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loans, setLoans] = useState([]);
  const [existingPayslips, setExistingPayslips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadPipelineData = async () => {
    setLoading(true);
    try {
      const [empData, deptData, structData, bonusData, claimData, loanData, payslipData] = await Promise.all([
        apiFetch('/employees?status=Active'),
        apiFetch('/departments'),
        apiFetch('/payroll/structures'),
        apiFetch('/payroll/bonuses'),
        apiFetch('/payroll/reimbursements'),
        apiFetch('/payroll/loans'),
        apiFetch(`/payroll/payslips?month=${month}&year=${year}`)
      ]);

      if (Array.isArray(empData)) setActiveEmployees(empData);
      else if (empData && Array.isArray(empData.data)) setActiveEmployees(empData.data);

      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(structData)) setStructures(structData);
      if (Array.isArray(bonusData)) setBonuses(bonusData);
      if (Array.isArray(claimData)) setClaims(claimData);
      if (Array.isArray(loanData)) setLoans(loanData);

      if (payslipData && Array.isArray(payslipData.data)) setExistingPayslips(payslipData.data);
      else if (Array.isArray(payslipData)) setExistingPayslips(payslipData);
      else setExistingPayslips([]);
    } catch (err) {
      console.error("Failed to load processing pipeline data:", err);
      addToast('Failed to load payroll pipeline data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, [month, year]);

  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      const payload = {
        month,
        year: parseInt(year, 10),
        scope,
        department_id: scope === 'department' ? departmentId : null,
        employee_id: scope === 'employee' ? employeeId : null
      };

      const res = await apiFetch('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        addToast(res.message || 'Payroll generated successfully!', 'success');
        loadPipelineData();
      } else {
        addToast(res.message || 'Failed to generate payroll', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error generating payroll', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const totalEmployeesCount = activeEmployees.length;
  const alreadyGeneratedCount = existingPayslips.length;
  const pendingGenerationCount = Math.max(0, totalEmployeesCount - alreadyGeneratedCount);

  const totalGrossGenerated = existingPayslips.reduce((acc, p) => acc + (parseFloat(p.gross_salary) || 0), 0);
  const totalDeductionsGenerated = existingPayslips.reduce((acc, p) => acc + (parseFloat(p.total_deductions) || 0), 0);
  const totalNetGenerated = existingPayslips.reduce((acc, p) => acc + (parseFloat(p.net_salary) || 0), 0);

  // Department Aggregation
  const deptSummaryMap = {};
  existingPayslips.forEach(p => {
    const dept = p.department || 'General';
    if (!deptSummaryMap[dept]) {
      deptSummaryMap[dept] = { name: dept, count: 0, gross: 0, deductions: 0, net: 0, status: p.status };
    }
    deptSummaryMap[dept].count += 1;
    deptSummaryMap[dept].gross += parseFloat(p.gross_salary || 0);
    deptSummaryMap[dept].deductions += parseFloat(p.total_deductions || 0);
    deptSummaryMap[dept].net += parseFloat(p.net_salary || 0);
  });
  const deptSummaries = Object.values(deptSummaryMap);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    border: '1px solid #F1F5F9',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  };

  const steps = [
    { title: '1. Salary Structures', desc: `${structures.length} active structures mapped to staff`, status: 'Ready' },
    { title: '2. Attendance & LOP', desc: 'Auto-calculates payable days & unpaid leaves', status: 'Active' },
    { title: '3. Bonuses & Incentives', desc: `${bonuses.filter(b => b.status === 'Approved').length} approved bonuses pending payout`, status: 'Integrated' },
    { title: '4. Expense Reimbursements', desc: `${claims.filter(c => c.status === 'Approved').length} approved claims ready to merge`, status: 'Integrated' },
    { title: '5. Loan EMI Recovery', desc: `${loans.filter(l => l.status === 'Active').length} active loan EMI deductions`, status: 'Integrated' },
    { title: '6. Statutory Deductions', desc: 'PF (12%), ESI (0.75%), PT (₹200) & TDS rules', status: 'Configured' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>Payroll Processing Engine</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Unified execution pipeline computing attendance, earnings, claims, loan EMIs, and statutory taxes</p>
        </div>
        <button
          onClick={() => navigate('/payroll/generate-payslips')}
          style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
        >
          <FileText size={16} /> Go to Payslips & PDF Downloads
        </button>
      </div>

      {/* Pipeline Checklist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {steps.map((s, idx) => (
          <div key={idx} style={{ ...cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', borderLeft: '4px solid #2563EB' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} color="#2563EB" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{s.title}</div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>{s.status}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Execution Controller Card */}
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1E3A8A, #1D4ED8)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} color="#93C5FD" />
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#BFDBFE' }}>Execution Control Panel</span>
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>Calculate Payroll for {month} {year}</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#DBEAFE' }}>
              {pendingGenerationCount > 0 
                ? `${pendingGenerationCount} active employee(s) ready to be calculated and generated.`
                : `All active employees have already been generated for ${month} ${year}.`
              }
            </p>
          </div>

          {/* Form Filter Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', marginBottom: '4px' }}>Month</label>
              <AppDropdown value={month} options={[{value:'m',label:'m'}, ...(MONTHS || [])]} size="sm" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', marginBottom: '4px' }}>Year</label>
              <AppDropdown
                value={year}
                onChange={v => setYear(v)}
                options={[{value:'2025',label:'2025'},{value:'2026',label:'2026'},{value:'2027',label:'2027'}]}
                size="sm"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', marginBottom: '4px' }}>Scope</label>
              <AppDropdown
                value={scope}
                onChange={v => setScope(v)}
                options={[{value:'all',label:'All Active Staff'},{value:'department',label:'By Department'},{value:'employee',label:'Individual Staff'}]}
                size="sm"
              />
            </div>

            {scope === 'department' && (
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', marginBottom: '4px' }}>Department</label>
                <AppDropdown
                value={departmentId}
                onChange={v => setDepartmentId(v)}
                options={[{value:'',label:'-- Choose Dept --'}]}
                size="sm"
              />
              </div>
            )}

            {scope === 'employee' && (
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', marginBottom: '4px' }}>Employee</label>
                <AppDropdown
                value={employeeId}
                onChange={v => setEmployeeId(v)}
                options={[{value:'',label:'-- Choose Employee --'}]}
                size="sm"
              />
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleRunPayroll}
                disabled={processing}
                style={{ padding: '9px 24px', borderRadius: '10px', border: 'none', background: '#FFFFFF', color: '#1D4ED8', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                {processing ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Play size={16} fill="#1D4ED8" />}
                Execute Payroll Run
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Summary Metrics for Selected Period */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Employees Generated</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{alreadyGeneratedCount} / {totalEmployeesCount}</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px', fontWeight: '600' }}>{pendingGenerationCount} Pending Run</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Gross Calculated</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB' }}>₹ {totalGrossGenerated.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Includes Base + Bonus + Claims</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Total Deductions</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626' }}>₹ {totalDeductionsGenerated.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>PF + PT + LOP + Loan EMIs</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Total Net Payable</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>₹ {totalNetGenerated.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px', fontWeight: '600' }}>Ready for Disbursement</div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>Department Payroll Aggregation</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>Breakdown of generated figures for {month} {year}</p>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', boxSizing: 'border-box' }}>
          {deptSummaries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <AlertCircle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No payroll runs executed yet for {month} {year}</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Click "Execute Payroll Run" above to generate department figures.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Department</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Employees Processed</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Total Gross</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Total Deductions</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Total Net Payable</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Run Status</th>
                </tr>
              </thead>
              <tbody>
                {deptSummaries.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{d.name}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{d.count} Staff</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>₹ {d.gross.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#DC2626' }}>₹ {d.deductions.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#10B981' }}>₹ {d.net.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0'
                      }}>
                        {d.status || 'Generated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
