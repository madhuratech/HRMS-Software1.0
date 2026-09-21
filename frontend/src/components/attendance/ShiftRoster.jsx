import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { getAvatarUrl } from '../../lib/utils';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const DEFAULT_EMPLOYEES = [
  { id: 1, employee: 'John Doe', empId: 'EMP001', department: 'Engineering', location: 'Chennai', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
  { id: 2, employee: 'Sarah Jenkins', empId: 'EMP002', department: 'Human Resources', location: 'Bangalore', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: 3, employee: 'Michael Chen', empId: 'EMP003', department: 'Engineering', location: 'Chennai', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { id: 4, employee: 'Alex Rivera', empId: 'EMP004', department: 'Sales & Marketing', location: 'Mumbai', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 5, employee: 'Emily Wong', empId: 'EMP005', department: 'Finance', location: 'Hyderabad', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  { id: 6, employee: 'David Kim', empId: 'EMP006', department: 'Operations', location: 'Chennai', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 7, employee: 'Lisa Ray', empId: 'EMP007', department: 'Human Resources', location: 'Bangalore', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: 8, employee: 'Robert Taylor', empId: 'EMP008', department: 'Engineering', location: 'Mumbai', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }
];

export default function ShiftRoster() {
  const [orgShifts, setOrgShifts] = useState([]);
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Department and Location options
  const departments = ['All Departments', 'Engineering', 'Human Resources', 'Sales & Marketing', 'Finance', 'Operations'];
  const locations = ['All Locations', 'Chennai', 'Bangalore', 'Mumbai', 'Hyderabad'];

  // Dropdown toggle states
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  const getShiftStyles = (type) => {
    const str = String(type || '').toLowerCase();
    if (str.includes('morning') || str.includes('msh') || str.includes('a-001')) return { background: '#ecfdf5', color: '#059669' };
    if (str.includes('afternoon') || str.includes('evening') || str.includes('esh')) return { background: '#f5f3ff', color: '#7c3aed' };
    if (str.includes('night') || str.includes('nsh')) return { background: '#fef3c7', color: '#d97706' };
    if (str.includes('off') || str.includes('no shift')) return { background: '#fef2f2', color: '#dc2626' };
    return { background: '#eff6ff', color: '#2563eb' };
  };

  // Compute week range text based on week offset
  const getWeekRangeText = () => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + currentWeekOffset * 7);
    
    // Find Monday of the current week
    const day = baseDate.getDay();
    const diffToMon = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(baseDate.setDate(diffToMon));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const formatMonthDay = (d) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    return `${formatMonthDay(mon)} - ${formatMonthDay(sun)} ${sun.getFullYear()}`;
  };

  const fetchRosterData = () => {
    setLoading(true);

    // Fetch Organization shifts (Single Source of Truth) and employee data
    Promise.all([
      apiFetch('/organization/shifts').catch(() => []),
      apiFetch('/employees').catch(() => []),
      apiFetch('/attendance/roster').catch(() => [])
    ]).then(([shiftsData, employeesData, rosterRes]) => {
      const activeShifts = Array.isArray(shiftsData) ? shiftsData : [];
      setOrgShifts(activeShifts);

      // CRITICAL: If no active shifts exist in Organization -> Shift Management, clear roster data!
      if (activeShifts.length === 0) {
        setRosterData([]);
        setLoading(false);
        return;
      }

      let empList = [];
      if (Array.isArray(rosterRes) && rosterRes.length > 0) {
        empList = rosterRes;
      } else if (Array.isArray(employeesData) && employeesData.length > 0) {
        empList = employeesData.map((e, idx) => ({
          id: e.id || idx + 1,
          employee: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || `Employee ${idx + 1}`,
          empId: e.employee_code || e.employeeId || `EMP00${e.id || idx + 1}`,
          department: e.department || (idx % 2 === 0 ? 'Engineering' : 'Human Resources'),
          location: e.location || (idx % 3 === 0 ? 'Chennai' : 'Bangalore'),
          avatar: e.profile_photo || e.avatar || null
        }));
      } else {
        empList = DEFAULT_EMPLOYEES;
      }

      // Check if any shift has explicit assignedEmployees array populated
      const hasExplicitAssignments = activeShifts.some(s => Array.isArray(s.assignedEmployees) && s.assignedEmployees.length > 0);

      // Filter employees to ONLY those assigned to active Organization shifts if explicit assignments exist
      const assignedEmpList = empList.filter((emp, index) => {
        if (hasExplicitAssignments) {
          return activeShifts.some(s => Array.isArray(s.assignedEmployees) && s.assignedEmployees.includes(emp.id));
        }
        const totalEmpAssignedInOrg = activeShifts.reduce((sum, s) => sum + (parseInt(s.employees) || 0), 0);
        if (totalEmpAssignedInOrg > 0) {
          return index < totalEmpAssignedInOrg;
        }
        return true;
      });

      const formatShiftTime = (s) => {
        if (!s) return '--';
        const start = s.startTime ? (String(s.startTime).includes(':') ? s.startTime : `${s.startTime}:00 AM`) : '09:00 AM';
        const end = s.endTime ? (String(s.endTime).includes(':') ? s.endTime : `${s.endTime}:00 PM`) : '06:00 PM';
        return `${start} - ${end}`;
      };

      // Construct roster rows based on exact Working Days configured in Organization Shift Management
      const constructedRoster = assignedEmpList.map((emp, index) => {
        // Find assigned Organization shift
        let assignedShift = activeShifts.find(s => Array.isArray(s.assignedEmployees) && s.assignedEmployees.includes(emp.id));
        if (!assignedShift) {
          assignedShift = activeShifts[index % activeShifts.length];
        }

        const assignedWorkingDays = Array.isArray(assignedShift?.workingDays) && assignedShift.workingDays.length > 0
          ? assignedShift.workingDays
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

        const weekDayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const days = weekDayKeys.map(dayKey => {
          if (assignedWorkingDays.includes(dayKey)) {
            return {
              day: dayKey,
              shift: assignedShift ? assignedShift.name : 'General Shift',
              time: formatShiftTime(assignedShift),
              type: assignedShift ? (assignedShift.code || assignedShift.name) : 'general'
            };
          }
          return {
            day: dayKey,
            shift: assignedShift?.dayOffLabels?.[dayKey] || assignedShift?.offLabel || 'Weekly Off',
            time: '--',
            type: 'off'
          };
        });

        return {
          id: emp.id,
          employee: emp.employee || emp.name,
          empId: emp.empId || `EMP00${emp.id}`,
          department: emp.department || 'Engineering',
          location: emp.location || 'Chennai',
          avatar: emp.avatar,
          shifts: days
        };
      });

      setRosterData(constructedRoster);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load Organization Shift Roster data:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRosterData();
    window.addEventListener('focus', fetchRosterData);
    return () => window.removeEventListener('focus', fetchRosterData);
  }, []);

  // Filter roster data based on department and location filters
  const filteredRoster = rosterData.filter(row => {
    const matchesDept = selectedDepartment === 'All Departments' || row.department === selectedDepartment || !row.department;
    const matchesLoc = selectedLocation === 'All Locations' || row.location === selectedLocation || !row.location;
    return matchesDept && matchesLoc;
  });

  return (
    <div className="hrms-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Header Toolbar (Filters & Week Navigator) - NO Add Shift Button */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Week Selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev - 1)} 
              style={{ padding: '8px 12px', background: '#fff', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
              title="Previous Week"
            >
              <ChevronLeft size={16} style={{ color: '#64748b' }} />
            </button>
            <span className="hrms-text-sm hrms-font-semibold" style={{ padding: '8px 16px', color: '#1e293b', whiteSpace: 'nowrap' }}>
              {getWeekRangeText()}
            </span>
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev + 1)} 
              style={{ padding: '8px 12px', background: '#fff', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer' }}
              title="Next Week"
            >
              <ChevronRight size={16} style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* Department Filter */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowLocDropdown(false); }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>{selectedDepartment}</span>
              <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            </div>
            {showDeptDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                {departments.map(dept => (
                  <div 
                    key={dept} 
                    onClick={() => { setSelectedDepartment(dept); setShowDeptDropdown(false); }}
                    style={{ padding: '8px 14px', fontSize: 13, color: '#334155', cursor: 'pointer', background: selectedDepartment === dept ? '#eff6ff' : '#fff' }}
                  >
                    {dept}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Filter */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => { setShowLocDropdown(!showLocDropdown); setShowDeptDropdown(false); }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>{selectedLocation}</span>
              <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            </div>
            {showLocDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                {locations.map(loc => (
                  <div 
                    key={loc} 
                    onClick={() => { setSelectedLocation(loc); setShowLocDropdown(false); }}
                    style={{ padding: '8px 14px', fontSize: 13, color: '#334155', cursor: 'pointer', background: selectedLocation === loc ? '#eff6ff' : '#fff' }}
                  >
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Source of Truth Info Badge */}
        <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
          Shifts managed via <strong>Organization → Shift Management</strong>
        </div>
      </div>

      {/* Roster Grid Table */}
      <div style={{ width: '100%', flex: 1, display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          <div className="hrms-card" style={{ padding: '0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 64px 16px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Employee</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Mon</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Tue</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Wed</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Thu</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Fri</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Sat</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '13px' }}>Sun</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                      Loading Organization Shift Roster…
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                      No Shift Roster records found for selected filters. Manage shifts in <strong>Organization → Shift Management</strong>.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 64px 16px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {row.avatar ? (
                            <img
                              src={getAvatarUrl(row.avatar, row.employee)}
                              alt={row.employee}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.employee || 'User')}&background=2563EB&color=fff&bold=true`;
                              }}
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                              {(row.employee || 'E').charAt(0)}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500', color: '#1e293b' }}>{row.employee}</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{row.empId}</span>
                          </div>
                        </div>
                      </td>
                      {row.shifts?.map((shift, i) => {
                        const styles = getShiftStyles(shift.type || shift.shift);

                        return (
                          <td key={i} style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: styles.background,
                              minWidth: '120px'
                            }}>
                              <span style={{ color: styles.color, fontSize: '12px', fontWeight: '600' }}>{shift.shift}</span>
                              {shift.time !== '--' && <span style={{ color: styles.color, fontSize: '10px', opacity: 0.8 }}>{shift.time}</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
