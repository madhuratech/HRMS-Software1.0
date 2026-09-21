import React, { useState, useEffect, useCallback } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  UserCheck,
  Loader2,
  AlertCircle,
  X,
  CalendarOff,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Navigation
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function TeamLeaderDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Team Leader Profile State
  const [leader, setLeader] = useState({
    id: 11,
    name: 'Dhilipan P',
    empId: 'EMP0015',
    teamName: 'Software Development',
    department: 'Engineering'
  });

  // Personal Attendance State
  const [myAttendance, setMyAttendance] = useState({
    status: 'Not Punched',
    checkIn: '--',
    checkOut: '--',
    workingHours: '0h 0m'
  });

  // Database Data States
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [nextHoliday, setNextHoliday] = useState(null);
  
  // Sales Tracking States
  const [liveVisits, setLiveVisits] = useState([]);
  const [completedVisits, setCompletedVisits] = useState([]);

  // Calculated Summary Metrics
  const [metrics, setMetrics] = useState({
    teamMembersCount: 0,
    presentCount: 0,
    totalCount: 0,
    activeTasksCount: 0,
    performancePct: 88
  });

  // Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    assignee_id: '',
    priority: 'High',
    due_date: '',
    status: 'In Progress'
  });
  const [metaProjects, setMetaProjects] = useState([]);

  const loadDatabaseData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Read Authenticated Team Leader User Info
      let userId = 11;
      let userObj = null;
      const auth = localStorage.getItem('hrms_auth');
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          userObj = parsed.user || parsed;
          if (userObj && userObj.id) userId = userObj.id;
          setLeader(prev => ({
            ...prev,
            id: userId,
            name: userObj.name || 'Dhilipan P',
            empId: userObj.emp_id || `EMP${String(userId).padStart(4, '0')}`,
            department: userObj.department || userObj.dept_name || 'Engineering'
          }));
        } catch (e) { }
      }

      // Fetch detailed employee profile from database
      try {
        const empProfile = await apiFetch(`/employees/${userId}`);
        if (empProfile && empProfile.id) {
          setLeader(prev => ({
            ...prev,
            name: empProfile.name || prev.name,
            empId: `EMP${String(empProfile.id).padStart(4, '0')}`,
            department: empProfile.dept_name || empProfile.department || prev.department
          }));
        }
      } catch (e) { }

      // 2. Fetch Personal Today's Attendance for Team Leader
      try {
        const todayRes = await apiFetch(`/attendance/today-status?employee_id=${userId}`);
        if (todayRes && todayRes.success) {
          if (todayRes.status === 'PUNCHED_IN') {
            setMyAttendance({
              status: 'Punched In',
              checkIn: todayRes.punchInTime || '--',
              checkOut: '--',
              workingHours: 'In Progress'
            });
          } else if (todayRes.status === 'PUNCHED_OUT') {
            setMyAttendance({
              status: 'Present',
              checkIn: todayRes.punchInTime || '--',
              checkOut: todayRes.punchOutTime || '--',
              workingHours: todayRes.workingHours || '--'
            });
          } else {
            setMyAttendance({
              status: 'Not Punched',
              checkIn: '--',
              checkOut: '--',
              workingHours: '0h 0m'
            });
          }
        }
      } catch (e) {
        console.error("Failed to load TL personal attendance:", e);
      }

      // 3. Fetch Team Members from Database (Team Leader Scoped)
      try {
        const teamScopeRes = await apiFetch('/employees/team-members');
        let members = [];
        if (teamScopeRes && Array.isArray(teamScopeRes.scopedMembers)) {
          members = teamScopeRes.scopedMembers;
        } else if (teamScopeRes && Array.isArray(teamScopeRes.members)) {
          members = teamScopeRes.members;
        }
        setTeamMembers(members);
        if (members.length > 0 && !newTask.assignee_id) {
          setNewTask(prev => ({ ...prev, assignee_id: String(members[0].id) }));
        }
      } catch (e) {
        console.error("Failed to load team members:", e);
      }

      // 4. Fetch Projects for Task Modal
      try {
        const metaRes = await apiFetch('/projects/meta');
        if (metaRes && metaRes.success && metaRes.data && Array.isArray(metaRes.data.projects)) {
          setMetaProjects(metaRes.data.projects);
          if (metaRes.data.projects.length > 0 && !newTask.project_id) {
            setNewTask(prev => ({ ...prev, project_id: String(metaRes.data.projects[0].id) }));
          }
        }
      } catch (e) { }

      // 5. Fetch Tasks assigned to Team
      try {
        const tasksRes = await apiFetch('/tasks');
        const rawTasks = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.data?.tasks || tasksRes?.tasks || []);
        setTeamTasks(rawTasks);
      } catch (e) {
        console.error("Failed to load team tasks:", e);
      }

      // Fetch Sales Tracking Data if TL is in Sales/Marketing
      const isSalesOrMarketing = (userObj?.department_name || userObj?.department || userObj?.dept_name || 'Engineering').toLowerCase().includes('sales') || 
                                 (userObj?.department_name || userObj?.department || userObj?.dept_name || 'Engineering').toLowerCase().includes('marketing') || 
                                 (userObj?.role === 'SALES_MANAGER');
      
      if (isSalesOrMarketing || true) { // Displaying for demo
        try {
          const visitsRes = await apiFetch('/client-visits/live');
          if (visitsRes && visitsRes.success && visitsRes.data) {
            setLiveVisits(visitsRes.data.activeVisits || []);
            setCompletedVisits(visitsRes.data.completedVisits || []);
          }
        } catch(e) {}
      }

      // 6. Fetch Team Attendance Logs from Database
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        const teamAttRes = await apiFetch(`/attendance/team-attendance?leader_id=${userId}&date=${todayDate}`);
        let attRows = [];
        if (Array.isArray(teamAttRes)) {
          attRows = teamAttRes;
        } else {
          const fallbackFeed = await apiFetch(`/attendance/gps-feed?date=${todayDate}`);
          if (fallbackFeed && fallbackFeed.success && Array.isArray(fallbackFeed.records)) {
            attRows = fallbackFeed.records;
          }
        }
        setTeamAttendance(attRows);

        // 7. Calculate Dynamic Metrics
        const totalMembersCount = teamMembers.length || attRows.length || 0;
        const presentMembersCount = attRows.filter(r => r.status === 'Present' || r.status === 'Completed' || r.attendanceStatus === 'Present' || r.attendanceStatus === 'Completed').length;

        setMetrics({
          teamMembersCount: totalMembersCount,
          presentCount: presentMembersCount,
          totalCount: totalMembersCount,
          activeTasksCount: teamTasks.length,
          performancePct: 88
        });
      } catch (e) {
        console.error("Failed to load team attendance:", e);
      }

      // 8. Fetch Next Upcoming Holiday from Database
      try {
        const holidayRes = await apiFetch('/organization/holidays');
        if (Array.isArray(holidayRes) && holidayRes.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = holidayRes
            .filter(h => h.status !== 'Inactive')
            .map(h => ({ ...h, parsedDate: new Date(h.date) }))
            .filter(h => !isNaN(h.parsedDate.getTime()) && h.parsedDate >= today)
            .sort((a, b) => a.parsedDate - b.parsedDate);

          if (upcoming.length > 0) {
            setNextHoliday({
              name: upcoming[0].name,
              date: upcoming[0].date,
              type: upcoming[0].type || 'Company Holiday'
            });
          }
        }
      } catch (e) { }

    } catch (err) {
      console.error("Failed to load Team Leader database data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();

    const handleAttendanceUpdate = () => loadDatabaseData();
    window.addEventListener('attendance-updated', handleAttendanceUpdate);
    window.addEventListener('focus', handleAttendanceUpdate);

    return () => {
      window.removeEventListener('attendance-updated', handleAttendanceUpdate);
      window.removeEventListener('focus', handleAttendanceUpdate);
    };
  }, [loadDatabaseData]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        project_id: parseInt(newTask.project_id) || 1,
        assignee_id: parseInt(newTask.assignee_id) || 1,
        priority: newTask.priority,
        due_date: newTask.due_date || new Date().toISOString().split('T')[0],
        status: newTask.status
      };

      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setShowAddTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        priority: 'High',
        due_date: '',
        status: 'In Progress'
      });
      loadDatabaseData();
    } catch (err) {
      console.error("Error creating database task:", err);
    }
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB'
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm font-semibold text-slate-600">Loading database records for {leader.name} ({leader.empId})...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6">

      {/* ── 1. Welcome Banner Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(37,99,235,0.25)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {getGreeting()}, {leader.name}! 👋
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#DBEAFE' }}>
            {leader.empId} • {leader.department} • Team Leader Operational Dashboard
          </p>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          padding: '10px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CalendarCheck size={16} />
          {getFormattedDate()}
        </div>
      </div>

      {/* ── 2. Summary Cards Grid (Real Database Calculated Data) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 — My Attendance */}
        <div style={cardStyle} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigate('/team-leader/my-attendance')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-extrabold ${myAttendance.status === 'Punched In' || myAttendance.status === 'Present' ? 'text-emerald-600' : 'text-slate-700'}`}>
              {myAttendance.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <div>Check In: <strong className="text-slate-900 font-bold">{myAttendance.checkIn}</strong></div>
            <div>Check Out: <strong className="text-slate-900 font-bold">{myAttendance.checkOut}</strong></div>
          </div>
        </div>

        {/* Card 2 — Team Members */}
        <div style={cardStyle} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigate('/team-leader/team-attendance')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Members</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.teamMembersCount}</span>
            <span className="text-xs text-slate-500 font-semibold">Active Members</span>
          </div>
          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md inline-block">
            {leader.teamName}
          </span>
        </div>

        {/* Card 3 — Team Attendance Today */}
        <div style={cardStyle} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigate('/team-leader/team-attendance')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.presentCount} / {metrics.totalCount}</span>
            <span className="text-xs text-emerald-600 font-bold">Present Today</span>
          </div>
          <div className="text-xs text-slate-500">
            Real-time database log check-ins
          </div>
        </div>

        {/* Card 4 — Active Tasks / Next Holiday */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Holiday</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarOff size={18} />
            </div>
          </div>
          {nextHoliday ? (
            <div>
              <div className="text-base font-bold text-slate-900 truncate">{nextHoliday.name}</div>
              <div className="text-xs text-amber-600 font-bold mt-1">{new Date(nextHoliday.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <span className="text-[10px] text-slate-400 font-semibold">{nextHoliday.type}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium">No upcoming holiday scheduled.</div>
          )}
        </div>

      </div>

      {/* ── 3. Team Attendance & Tasks Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Today's Team Attendance */}
        <div className="lg:col-span-2 space-y-6">

          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Today's Team Attendance</h3>
                <p className="text-xs text-slate-500">Database check-in records for team members</p>
              </div>
              <button
                onClick={() => navigate('/team-leader/team-attendance')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                View Full Attendance <ArrowRight size={14} />
              </button>
            </div>

            {teamAttendance.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
                No attendance records available in database for today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Shift</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Check In</th>
                      <th className="py-3 px-4">Check Out</th>
                      <th className="py-3 px-4">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {teamAttendance.slice(0, 5).map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <strong className="text-slate-900 block font-bold">{row.name || row.employee_name}</strong>
                            <span className="text-[11px] text-slate-400 font-mono">{row.employee_id || row.empId || `EMP00${row.id}`}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{row.shift || 'Morning Shift'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${row.status === 'Present' || row.status === 'Completed' || row.attendanceStatus === 'Present' || row.attendanceStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            row.status === 'Late' || row.attendanceStatus === 'Late' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                            {row.status || row.attendanceStatus || 'Absent'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{row.checkIn || '--'}</td>
                        <td className="py-3 px-4 text-slate-600">{row.checkOut || '--'}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{row.workingHours || row.hours || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Team Tasks Section */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Team Tasks</h3>
                <p className="text-xs text-slate-500">Database task management for team members</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={15} /> Add Task
                </button>
                <button
                  onClick={() => navigate('/team-leader/team-tasks')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Manage Tasks <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {teamTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
                No active tasks found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Task Title</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {teamTasks.slice(0, 5).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{t.title || t.name}</td>
                        <td className="py-3 px-4 text-slate-600">{t.project_name || t.project || 'General'}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{t.assignee_name || t.assigned_to || 'Team Member'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${t.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                            {t.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Today'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            t.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {t.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Team Members Roster & Sales Tracking */}
        <div className="space-y-6">

          {/* Sales Live Tracking Widget */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Navigation size={16} className="text-blue-600"/> Live Sales Tracking</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Active client visits in field</p>
              </div>
            </div>
            {liveVisits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-lg">No active client visits right now.</div>
            ) : (
              <div className="space-y-3">
                {liveVisits.map(v => (
                  <div key={v.id} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{v.employee_name}</div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">At: {v.client_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">Active</div>
                      <div className="text-[10px] text-slate-500 mt-1">{new Date(v.check_in_time).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {completedVisits.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Today's Completed Visits</h4>
                <div className="space-y-2">
                  {completedVisits.map(v => (
                    <div key={v.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-800">{v.employee_name} <span className="font-normal text-slate-500">({v.client_name})</span></span>
                      <span className="font-bold text-blue-600">{v.distance_travelled} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Team Roster</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Active team members list</p>
              </div>
              <button
                onClick={() => navigate('/team-leader/team-attendance')}
                className="text-xs text-blue-600 font-extrabold hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">No team members found in database.</div>
            ) : (
              <div className="space-y-3">
                {teamMembers.slice(0, 6).map(m => {
                  const initials = (m.name || 'User')
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {/* Round Radius Letter Avatar Badge */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block leading-tight">{m.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono font-medium">{`EMP${String(m.id).padStart(4, '0')}`}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-extrabold rounded-lg shrink-0">
                        Active
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── 4. Add Task Modal ── */}
      {showAddTaskModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 520,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create & Assign Team Task</h3>
                <p className="text-xs text-slate-500">Save directly to database for team members</p>
              </div>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build API Endpoint"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project *</label>
                  <AppDropdown value={newTask.project_id} options={[, ...(metaProjects || [])]} size="sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Employee *</label>
                  <AppDropdown value={newTask.assignee_id} options={[, ...(teamMembers || [])]} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <AppDropdown
                value={newTask.priority}
                onChange={v => setNewTask({ ...newTask, priority: v })}
                options={[{value:'High',label:'High'},{value:'Medium',label:'Medium'},{value:'Low',label:'Low'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 h-10 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Save Task to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamLeaderDashboard;
