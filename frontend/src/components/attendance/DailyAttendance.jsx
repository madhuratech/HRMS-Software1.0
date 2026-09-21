import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle, MoreVertical, Calendar as CalendarIcon, ChevronDown, Eye, Edit2, Trash2, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import EmployeeAvatar from '../employee/EmployeeAvatar';
import { useToast } from '../ui/Toast';

export default function DailyAttendance() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    present: 0,
    presentPct: '0.00%',
    absent: 0,
    absentPct: '0.00%',
    late: 0,
    latePct: '0.00%',
    leave: 0,
    leavePct: '0.00%'
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    status: 'Present',
    workingHours: '08h 00m'
  });

  const loadDailyAttendance = () => {
    setLoading(true);
    apiFetch(`/attendance/daily?date=${selectedDate}`)
      .then(data => {
        if (data.records) setAttendanceData(data.records);
        if (data.kpis) setKpis(data.kpis);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch daily attendance", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const handleViewProfile = (emp) => {
    localStorage.setItem('selectedEmployeeId', emp.db_id);
    navigate('/employees/profile');
  };

  const handleOpenEdit = (emp) => {
    setEditingRecord(emp);

    // Parse times (e.g. "01:04 PM" -> "13:04")
    const formatTimeForInput = (timeStr) => {
      if (!timeStr || timeStr === '--') return '';
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
      }
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    setEditForm({
      checkInTime: formatTimeForInput(emp.checkIn),
      checkOutTime: formatTimeForInput(emp.checkOut),
      status: emp.status || 'Present',
      workingHours: emp.workingHours !== '00h 00m' ? emp.workingHours : '08h 00m'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/attendance/records/${editingRecord.db_id}/${selectedDate}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      if (res.success) {
        addToast("Attendance record updated successfully!", "success");
        setShowEditModal(false);
        loadDailyAttendance();
      } else {
        addToast(res.message || "Failed to update record", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update record", "error");
    }
  };

  const handleDeleteRecord = async (emp) => {
    const confirmed = window.confirm(`Are you sure you want to delete the daily attendance record for ${emp.name} on ${selectedDate}?`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/attendance/records/${emp.db_id}/${selectedDate}`, {
        method: 'DELETE'
      });
      if (res.success) {
        addToast("Attendance record deleted successfully!", "success");
        loadDailyAttendance();
      } else {
        addToast(res.message || "Failed to delete record", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to delete record", "error");
    }
  };

  const filteredDocs = attendanceData.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hrms-content">
      {/* Header and Toolbar */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
        <div className="hrms-flex-start" style={{ flexWrap: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', outline: 'none', color: '#475569', fontWeight: '500', fontSize: '14px', width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Departments</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '180px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Locations</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', minWidth: '150px', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span className="hrms-text-sm" style={{ color: '#475569', fontWeight: '500' }}>All Status</span>
            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Filter size={16} /> Filter
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <button style={{ background: '#fff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 24px', color: '#2952E3', fontWeight: '500', cursor: 'pointer' }}>Import</button>
          <button style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 24px', color: '#2952E3', fontWeight: '500', cursor: 'pointer' }}>Export</button>
        </div>
      </div>

      <div style={{ width: '100%', flex: 1, display: 'flex' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
            <div className="hrms-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '20px' }}>Total Employees</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2952E3', lineHeight: '1' }}>{kpis.totalEmployees}</div>
            </div>
            <div className="hrms-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '20px' }}>Present</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', lineHeight: '1' }}>{kpis.present}</div>
                <span style={{ fontSize: '11px', color: '#94a3b8', paddingBottom: '4px', fontWeight: '500' }}>{kpis.presentPct}</span>
              </div>
            </div>
            <div className="hrms-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '20px' }}>Absent</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', lineHeight: '1' }}>{kpis.absent}</div>
                <span style={{ fontSize: '11px', color: '#94a3b8', paddingBottom: '4px', fontWeight: '500' }}>{kpis.absentPct}</span>
              </div>
            </div>
            <div className="hrms-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '20px' }}>Late</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', lineHeight: '1' }}>{kpis.late}</div>
                <span style={{ fontSize: '11px', color: '#94a3b8', paddingBottom: '4px', fontWeight: '500' }}>{kpis.latePct}</span>
              </div>
            </div>
            <div className="hrms-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '20px' }}>On Leave</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6', lineHeight: '1' }}>{kpis.leave}</div>
                <span style={{ fontSize: '11px', color: '#94a3b8', paddingBottom: '4px', fontWeight: '500' }}>{kpis.leavePct}</span>
              </div>
            </div>
          </div>

          {/* Search Bar and Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', width: '320px' }}>
              <Search size={18} style={{ color: '#94a3b8', marginRight: '12px' }} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#334155' }}
              />
            </div>

            <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="hrms-table-container">
                <table className="hrms-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Working Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading daily attendance records...</td>
                      </tr>
                    ) : filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No records found.</td>
                      </tr>
                    ) : (
                      filteredDocs.map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="hrms-user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <EmployeeAvatar name={emp.name} photoUrl={emp.avatar} size={32} />
                              <span className="hrms-font-medium hrms-text-primary">{emp.name}</span>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}><span className="hrms-text-muted">{emp.id}</span></td>
                          <td style={{ whiteSpace: 'nowrap' }}>{emp.department}</td>
                          <td style={{ whiteSpace: 'nowrap' }} className="hrms-font-medium">{emp.checkIn}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{emp.checkOut}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: emp.status === 'On Leave' ? '#f3e8ff' : emp.status === 'Late' ? '#fef3c7' : emp.status === 'Absent' ? '#fee2e2' : '#dcfce7',
                              color: emp.status === 'On Leave' ? '#9333ea' : emp.status === 'Late' ? '#d97706' : emp.status === 'Absent' ? '#dc2626' : '#16a34a'
                            }}>
                              {emp.status}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{emp.workingHours}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleViewProfile(emp)}
                                title="View Profile"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                title="Edit Attendance"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '4px' }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(emp)}
                                title="Delete Record"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="hrms-flex-between" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <span className="hrms-text-sm hrms-text-muted">
                  Showing 1 to {filteredDocs.length} of {attendanceData.length} entries
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="hrms-secondary-btn" style={{ padding: '6px', borderRadius: '4px' }} disabled>
                    &lt;
                  </button>
                  <button className="hrms-primary-btn" style={{ padding: '6px 12px', borderRadius: '4px' }}>1</button>
                  <button className="hrms-secondary-btn" style={{ padding: '6px', borderRadius: '4px' }} disabled>
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            width: '100%',
            maxWidth: '440px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Edit Attendance Record</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Employee</label>
                <input
                  type="text"
                  disabled
                  value={`${editingRecord.name} (${editingRecord.id})`}
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'not-allowed', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Check In Time</label>
                  <input
                    type="time"
                    value={editForm.checkInTime}
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '14px', fontWeight: '500', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Check Out Time</label>
                  <input
                    type="time"
                    value={editForm.checkOutTime}
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '14px', fontWeight: '500', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Status</label>
                  <AppDropdown
                value={editForm.status}
                onChange={v => setEditForm({ ...editForm, status: v })}
                options={[{value:'Present',label:'Present'},{value:'Late',label:'Late'},{value:'Early Exit',label:'Early Exit'},{value:'Completed',label:'Completed'},{value:'Absent',label:'Absent'},{value:'On Leave',label:'On Leave'}]}
                size="sm"
              />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Working Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 08h 00m"
                    value={editForm.workingHours}
                    onChange={(e) => setEditForm({ ...editForm, workingHours: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '14px', fontWeight: '500', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
