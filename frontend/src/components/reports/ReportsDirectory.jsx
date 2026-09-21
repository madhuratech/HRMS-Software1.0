import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  CalendarOff,
  DollarSign,
  UserPlus,
  BarChart3,
  FolderKanban,
  Receipt,
  LifeBuoy,
  ArrowRight,
  FileBarChart
} from 'lucide-react';

export function ReportsDirectory() {
  const navigate = useNavigate();

  const reportCategories = [
    {
      id: 'employee-reports',
      title: 'Employee Reports',
      module: 'Employee Module',
      description: 'Employee headcount, department distribution, demographics, status summaries, and exit analytics.',
      icon: Users,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      path: '/reports/employees'
    },
    {
      id: 'attendance-reports',
      title: 'Attendance Reports',
      module: 'Attendance Module',
      description: 'Daily attendance logs, shift rosters, overtime summaries, late arrival tracking, and punch locations.',
      icon: CalendarCheck,
      color: '#10B981',
      bgColor: '#ECFDF5',
      path: '/reports/attendance'
    },
    {
      id: 'leave-reports',
      title: 'Leave Reports',
      module: 'Leave Management Module',
      description: 'Leave application summaries, department leave balances, approval histories, and holiday calendar usage.',
      icon: CalendarOff,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      path: '/reports/leave'
    },
    {
      id: 'payroll-reports',
      title: 'Payroll Reports',
      module: 'Payroll Module',
      description: 'Salary structures, monthly pay processing, tax deduction breakdown, bonus incentives, and reimbursement reports.',
      icon: DollarSign,
      color: '#6366F1',
      bgColor: '#EEF2FF',
      path: '/reports/payroll'
    },
    {
      id: 'recruitment-reports',
      title: 'Recruitment Reports',
      module: 'Recruitment Module',
      description: 'Candidate pipeline metrics, job opening conversion rates, interview logs, and offer letter distributions.',
      icon: UserPlus,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      path: '/reports/recruitment'
    },
    {
      id: 'performance-reports',
      title: 'Performance Reports',
      module: 'Performance Module',
      description: 'KPI/KRA evaluation scores, appraisal distributions, employee feedback ratings, and promotion recommendations.',
      icon: BarChart3,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      path: '/reports/performance'
    },
    {
      id: 'project-reports',
      title: 'Project Reports',
      module: 'Projects Module',
      description: 'Sprint velocity, project completion status, milestone progress, task allocation, and member timesheets.',
      icon: FolderKanban,
      color: '#06B6D4',
      bgColor: '#CFFAFE',
      path: '/reports/projects'
    },
    {
      id: 'expense-reports',
      title: 'Expense Reports',
      module: 'Expenses Module',
      description: 'Expense claims tracking, category breakdowns, approval pipelines, and employee reimbursement histories.',
      icon: Receipt,
      color: '#14B8A6',
      bgColor: '#CCFBF1',
      path: '/reports/expenses'
    },
    {
      id: 'help-desk-reports',
      title: 'Help Desk Reports',
      module: 'Help Desk Module',
      description: 'Support ticket volumes, average resolution time, priority breakdown, category distribution, and SLA compliance.',
      icon: LifeBuoy,
      color: '#F97316',
      bgColor: '#FFEDD5',
      path: '/reports/help-desk'
    }
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#2952E3', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileBarChart size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1E293B' }}>
              Central Reports Directory
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              Select a report category to view detailed analytics within its primary module
            </p>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20
      }}>
        {reportCategories.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: item.bgColor, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0'
                  }}>
                    {item.module}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>

              <div style={{
                marginTop: 20,
                paddingTop: 14,
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#2563EB',
                fontSize: 13,
                fontWeight: 600
              }}>
                <span>View Report Page</span>
                <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReportsDirectory;
