import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Upload, MoreVertical, 
  ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import EmployeeAvatar from './EmployeeAvatar';
import { canCreate, canEdit, canExport, canImport } from '../../lib/permissions';
import './employee-module.css';

export default function EmployeeListContent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAll, setSelectedAll] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/app/employees?search=${searchTerm}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setEmployeeList(data);
          } else {
            setEmployeeList([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load employees", err);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="hrms-content">
      {/* Header */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
        <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0 }}>
          <div className="hrms-search-bar" style={{ marginBottom: 0 }}>
            <div className="hrms-search-input" style={{ width: '300px' }}>
              <Search className="hrms-search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="hrms-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><Filter size={16} /> Filters</button>
          {canEdit('employees', 'employee_list') && (
            <button className="hrms-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><CheckSquare size={16} /> Bulk Actions</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          {(canCreate('employees', 'add_employee') || canImport('employees', 'employee_list')) && (
            <button className="hrms-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><Upload size={16} /> Import</button>
          )}
          {canExport('employees', 'employee_list') && (
            <button className="hrms-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><Download size={16} /> Export List</button>
          )}
        </div>
      </div>

      <div className="hrms-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="hrms-table-container">
          <table className="hrms-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingRight: 0 }}>
                  <div style={{ cursor: 'pointer', color: selectedAll ? '#2952E3' : '#cbd5e1' }} onClick={() => setSelectedAll(!selectedAll)}>
                    {selectedAll ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                </th>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ paddingRight: 0 }}>
                    <div style={{ cursor: 'pointer', color: selectedAll ? '#2952E3' : '#cbd5e1' }}>
                      {selectedAll ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="hrms-user-info" style={{cursor: 'pointer'}} onClick={() => { localStorage.setItem('selectedEmployeeId', emp.id); navigate('/employees/profile'); }}>
                      <EmployeeAvatar name={emp.name} photoUrl={emp.profile_photo} size={32} className="hrms-avatar" />
                      <span className="hrms-font-medium hrms-text-primary">{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="hrms-text-muted">EMP00{emp.id}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{emp.dept_name || 'HR'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{emp.role_name || 'Staff'}</td>
                  <td>{emp.branch_name || 'Head Office'}</td>
                  <td>
                    <span className={`hrms-badge ${emp.status === 'Active' ? 'hrms-badge-active' : 'hrms-badge-inactive'}`}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td>{emp.join_date ? new Date(emp.join_date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button onClick={() => { localStorage.setItem('selectedEmployeeId', emp.id); navigate('/employees/profile'); }} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="hrms-flex-between" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
          <span className="hrms-text-sm hrms-text-muted">
            Showing 1 to {employeeList.length} of {employeeList.length} entries
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="hrms-secondary-btn" style={{ padding: '6px', borderRadius: '4px' }} disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="hrms-primary-btn" style={{ padding: '6px 12px', borderRadius: '4px' }}>1</button>
            <button className="hrms-secondary-btn" style={{ padding: '6px', borderRadius: '4px' }} disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
