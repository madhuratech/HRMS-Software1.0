import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Plus, Mail, Phone,
  MoreVertical, Calendar, UserPlus, Zap
} from 'lucide-react';
import EmployeeAvatar from './EmployeeAvatar';
import './employee-module.css';

export default function EmployeeDirectory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees on search/filter changes
  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      search: searchTerm,
      department: departmentFilter,
      designation: designationFilter,
      status: statusFilter
    }).toString();

    fetch(`/app/employees?${query}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          setEmployees([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load directory", err);
        setLoading(false);
      });
  }, [searchTerm, departmentFilter, designationFilter, statusFilter]);

  // Derived stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  // New joiners (e.g., joined in last 6 months or 2024/2026 depending on seeded data)
  const newJoinersCount = employees.filter(e => e.join_date && new Date(e.join_date).getFullYear() >= 2024).length;
  
  // Extract unique departments and designations for filter options
  const uniqueDepts = ["Engineering", "Sales", "Marketing", "Customer Support", "Human Resources"];
  const uniqueDesgs = ["Super Admin", "Branch Manager", "Sales Manager", "Service Staff", "Software Engineer", "HR Executive", "UI/UX Designer"];

  // Birthdays dynamic (placeholder derived from dob matching current month or simple calculation)
  const currentMonth = new Date().getMonth();
  const birthdayEmployees = employees.filter(e => e.dob && new Date(e.dob).getMonth() === currentMonth).slice(0, 3);

  // Dynamic new joiners list for widget
  const recentJoiners = employees
    .filter(e => e.join_date)
    .sort((a, b) => new Date(b.join_date) - new Date(a.join_date))
    .slice(0, 3);

  return (
    <div className="hrms-content">
      {/* Header and Toolbar */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
        <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0 }}>
          <div className="hrms-search-bar" style={{ marginBottom: 0 }}>
            <div className="hrms-search-input" style={{ width: '250px' }}>
              <Search className="hrms-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <AppDropdown
                value={departmentFilter}
                onChange={v => setDepartmentFilter(v)}
                options={[{value:'',label:'Department'}]}
                size="sm"
              />
          <AppDropdown
                value={designationFilter}
                onChange={v => setDesignationFilter(v)}
                options={[{value:'',label:'Designation'}]}
                size="sm"
              />
          <AppDropdown
                value={statusFilter}
                onChange={v => setStatusFilter(v)}
                options={[{value:'',label:'Status'},{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'},{value:'Terminated',label:'Terminated'}]}
                size="sm"
              />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <button className="hrms-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Export</button>
          <button className="hrms-primary-btn " style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', width: '150px' }} onClick={() => navigate('/employees/add')}><Plus size={10} /> Add Employee</button>
        </div>
      </div>

      <div className="hrms-layout">
        {/* Main Content Area */}
        <div>
          {/* Analytics Cards */}
          <div className="hrms-grid-4">
            <div className="hrms-card hrms-stat-card">
              <span className="hrms-stat-title">Total Employees</span>
              <span className="hrms-stat-value">{totalEmployees}</span>
              <span className="hrms-stat-trend hrms-text-success">Live count</span>
            </div>
            <div className="hrms-card hrms-stat-card">
              <span className="hrms-stat-title">Active Employees</span>
              <span className="hrms-stat-value hrms-text-primary">{activeEmployees}</span>
              <span className="hrms-stat-trend hrms-text-success">{totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="hrms-card hrms-stat-card">
              <span className="hrms-stat-title">New Joiners</span>
              <span className="hrms-stat-value" style={{ color: '#0ea5e9' }}>{newJoinersCount}</span>
              <span className="hrms-stat-trend hrms-text-success">Since 2024</span>
            </div>
            <div className="hrms-card hrms-stat-card">
              <span className="hrms-stat-title">Departments</span>
              <span className="hrms-stat-value" style={{ color: '#8b5cf6' }}>{uniqueDepts.length}</span>
              <a href="#" className="hrms-text-primary hrms-text-sm hrms-font-medium" style={{ marginTop: '4px' }}>View all</a>
            </div>
          </div>

          <h2 className="hrms-font-semibold hrms-mb-4" style={{ fontSize: '18px' }}>All Employees</h2>

          {loading ? (
            <div className="hrms-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="hrms-text-muted hrms-mt-4">Loading directory...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="hrms-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p className="hrms-text-muted">No employees found matching the filters.</p>
            </div>
          ) : (
            /* Employee Grid */
            <div className="hrms-employee-grid">
              {employees.map(emp => (
                <div key={emp.id} className="hrms-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div className="hrms-flex-between hrms-mb-4">
                    <div className="hrms-user-info">
                      <EmployeeAvatar name={emp.name} photoUrl={emp.profile_photo} size={40} className="hrms-avatar" />
                      <div className="hrms-user-details">
                        <h4>{emp.name}</h4>
                        <p>EMP00{emp.id}</p>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="hrms-mb-4">
                    <p className="hrms-text-sm hrms-font-medium">{emp.dept_name || 'General'}</p>
                    <p className="hrms-text-xs hrms-text-muted">{emp.role_name || 'Staff'}</p>
                  </div>

                  <div className="hrms-mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="hrms-flex-start" style={{ gap: '8px', color: '#64748b' }}>
                      <Mail size={14} />
                      <span className="hrms-text-xs" style={{ wordBreak: 'break-all' }}>{emp.email}</span>
                    </div>
                    <div className="hrms-flex-start" style={{ gap: '8px', color: '#64748b' }}>
                      <Phone size={14} />
                      <span className="hrms-text-xs">{emp.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="hrms-flex-between" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <span className={`hrms-badge ${emp.status === 'Active' ? 'hrms-badge-active' : 'hrms-badge-inactive'}`}>
                      {emp.status || 'Active'}
                    </span>
                    <button className="hrms-secondary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { localStorage.setItem('selectedEmployeeId', emp.id); navigate('/employees/profile'); }}>
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="hrms-text-primary" /> Birthday Today
            </h3>
            {birthdayEmployees.length === 0 ? (
              <p className="hrms-text-xs hrms-text-muted">No birthdays today</p>
            ) : (
              birthdayEmployees.map(emp => (
                <div key={emp.id} className="hrms-user-info hrms-mb-4">
                  <EmployeeAvatar name={emp.name} photoUrl={emp.profile_photo} size={40} className="hrms-avatar" />
                  <div className="hrms-user-details">
                    <h4>{emp.name}</h4>
                    <p>{emp.role_name || 'Staff'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} className="hrms-text-success" /> New Joiners
            </h3>
            {recentJoiners.length === 0 ? (
              <p className="hrms-text-xs hrms-text-muted">No recent joiners</p>
            ) : (
              recentJoiners.map(emp => (
                <div key={emp.id} className="hrms-user-info hrms-mb-4">
                  <EmployeeAvatar name={emp.name} photoUrl={emp.profile_photo} size={40} className="hrms-avatar" />
                  <div className="hrms-user-details">
                    <h4>{emp.name}</h4>
                    <p>{emp.role_name || 'Staff'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hrms-card">
            <h3 className="hrms-font-semibold hrms-mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} className="hrms-text-warning" /> Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/employees/add')} className="hrms-text-primary hrms-text-sm hrms-font-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                <Plus size={16} /> Add Employee
              </button>
              <a href="#" className="hrms-text-primary hrms-text-sm hrms-font-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Import Employees
              </a>
              <a href="#" className="hrms-text-primary hrms-text-sm hrms-font-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> Bulk Email
              </a>
              <a href="#" className="hrms-text-primary hrms-text-sm hrms-font-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoreVertical size={16} /> Organization Chart
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
