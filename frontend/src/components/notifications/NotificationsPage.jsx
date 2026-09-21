import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Calendar, CheckSquare, Folder, Settings, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';

export function NotificationsPage({ userRole }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [userPermissions, setUserPermissions] = useState(null);

  const fetchPermissions = async () => {
    try {
      const res = await apiFetch('/rbac/user-permissions');
      if (res && res.success && res.data) {
        setUserPermissions(res.data);
      }
    } catch (e) {
      console.error('Failed to load user permissions:', e);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/notifications');
      if (res && res.success) {
        const rawList = res.notifications || res.data || [];
        const normalized = rawList.map(n => ({
          ...n,
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || '',
          is_read: Boolean(n.is_read || n.isRead),
          isRead: Boolean(n.is_read || n.isRead),
          created_at: n.created_at || n.createdAt,
          action_url: n.action_url || n.actionUrl
        }));
        setNotifications(normalized);
      } else {
        addToast('Failed to load notifications', 'error');
      }
    } catch (e) {
      addToast('Error fetching notifications from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await apiFetch(`/notifications/${notif.id}/read`, { method: 'PUT' });
      }
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true, isRead: true } : n));
      
      // Perform security permission check before navigating
      if (notif.action_url) {
        let permitted = true;
        if (userPermissions && userRole !== 'SUPER_ADMIN' && userRole !== 'Super Admin') {
          const url = notif.action_url.toLowerCase();
          if (url.includes('leave') && userPermissions.leave?.view === false) permitted = false;
          else if (url.includes('payroll') && userPermissions.payroll?.view === false) permitted = false;
          else if (url.includes('attendance') && userPermissions.attendance?.view === false) permitted = false;
          else if (url.includes('project') && userPermissions.projects?.view === false) permitted = false;
          else if (url.includes('task') && userPermissions.projects?.view === false) permitted = false;
          else if (url.includes('settings') && userPermissions.settings?.view === false) permitted = false;
        }

        if (permitted) {
          navigate(notif.action_url);
        } else {
          addToast('Access Denied: You no longer have permission to access this resource.', 'error');
        }
      }
    } catch (e) {
      console.error('Failed to process notification click:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
      addToast('All notifications marked as read', 'success');
    } catch (e) {
      addToast('Failed to mark notifications read', 'error');
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Just now';
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('LEAVE')) return <Calendar size={20} className="text-amber-500" />;
    if (t.includes('TASK')) return <CheckSquare size={20} className="text-blue-500" />;
    if (t.includes('PROJECT')) return <Folder size={20} className="text-indigo-500" />;
    if (t.includes('PERMISSION') || t.includes('ROLE')) return <Settings size={20} className="text-purple-500" />;
    return <FileText size={20} className="text-slate-500" />;
  };

  // Check if a filter option is permitted for the user's role
  const isFilterPermitted = (categoryKey) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'Super Admin') return true;
    if (!userPermissions) return true; // Show while loading
    if (categoryKey === 'leave' && userPermissions.leave?.view === false) return false;
    if (categoryKey === 'attendance' && userPermissions.attendance?.view === false) return false;
    if (categoryKey === 'projects' && userPermissions.projects?.view === false) return false;
    if (categoryKey === 'payroll' && userPermissions.payroll?.view === false) return false;
    return true;
  };

  // Filters logic
  const filteredNotifications = notifications.filter(n => {
    const t = (n.type || '').toUpperCase();
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    if (filter === 'LEAVE') return t.includes('LEAVE');
    if (filter === 'ATTENDANCE') return t.includes('ATTENDANCE');
    if (filter === 'TASKS') return t.includes('TASK');
    if (filter === 'PROJECTS') return t.includes('PROJECT');
    if (filter === 'HR') return t.includes('HR_ANNOUNCEMENT') || t.includes('HOLIDAY_UPDATED') || t.includes('LEAVE_POLICY_UPDATED');
    if (filter === 'PAYROLL') return t.includes('PAYROLL');
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Bell size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>Notifications Center</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: '14px', color: '#64748B' }}>
            Manage and view all your personalized HRMS updates, reminders, and alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: '#EFF6FF', color: '#2563EB',
              borderRadius: '8px', fontWeight: 600, fontSize: '13px', border: 'none',
              cursor: 'pointer'
            }}
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#475569', fontSize: '13px', fontWeight: 700, borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
            <Filter size={14} /> FILTERS
          </div>
          {[
            { key: 'ALL', label: 'All Notifications', count: notifications.length },
            { key: 'UNREAD', label: 'Unread Only', count: unreadCount },
            { key: 'READ', label: 'Read History', count: readCount },
            { key: 'LEAVE', label: 'Leave & Absences', count: notifications.filter(n => n.type.includes('LEAVE')).length, permission: 'leave' },
            { key: 'ATTENDANCE', label: 'Attendance alerts', count: notifications.filter(n => n.type.includes('ATTENDANCE')).length, permission: 'attendance' },
            { key: 'TASKS', label: 'Tasks & Reminders', count: notifications.filter(n => n.type.includes('TASK')).length, permission: 'projects' },
            { key: 'PROJECTS', label: 'Projects', count: notifications.filter(n => n.type.includes('PROJECT')).length, permission: 'projects' },
            { key: 'HR', label: 'HR Updates & Holidays', count: notifications.filter(n => n.type.includes('HR_ANNOUNCEMENT') || n.type.includes('HOLIDAY')).length },
            { key: 'PAYROLL', label: 'Payroll', count: notifications.filter(n => n.type.includes('PAYROLL')).length, permission: 'payroll' }
          ]
            .filter(item => !item.permission || isFilterPermitted(item.permission))
            .map(item => {
              const isActive = filter === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
                    textAlign: 'left', background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#2563EB' : '#475569', fontWeight: isActive ? 600 : 500,
                    fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{
                    fontSize: '11px', background: isActive ? '#2563EB' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#64748B', padding: '2px 6px',
                    borderRadius: '10px', fontWeight: 600
                  }}>
                    {item.count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Notifications List */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Loading notifications...
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map((notif, idx) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    background: !notif.is_read ? '#F8FAFC' : '#FFFFFF',
                    borderBottom: idx === filteredNotifications.length - 1 ? 'none' : '1px solid #F1F5F9',
                    display: 'flex',
                    gap: '16px',
                    position: 'relative',
                    transition: 'background-color 0.15s'
                  }}
                  className="hover-bg-slate-50-custom"
                >
                  {/* Left Icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#F1F5F9', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{
                        margin: 0, fontSize: '15px', fontWeight: !notif.is_read ? 700 : 600,
                        color: !notif.is_read ? '#0F172A' : '#334155', truncate: true
                      }}>
                        {notif.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#94A3B8', whitespace: 'nowrap' }}>
                        {getRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notif.is_read && (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#2563EB', alignSelf: 'center', flexShrink: 0
                    }} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '80px 40px', textAlign: 'center', color: '#64748B' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#475569' }}>
                No notifications found
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                {filter === 'UNREAD' ? 'You have caught up with all updates!' : 'There are no updates in this category.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
