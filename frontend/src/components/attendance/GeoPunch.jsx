import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Camera, CheckCircle, AlertTriangle, Loader2, Navigation, ArrowRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '../../lib/api';

export function GeoPunch() {
  const [status, setStatus] = useState('idle'); // 'idle', 'locating', 'success', 'error'
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [coords, setCoords] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [recent, setRecent] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const data = await apiFetch('/attendance/recent');
      if (Array.isArray(data)) {
        setRecent(data);
      } else if (data && Array.isArray(data.sessions)) {
        setRecent(data.sessions);
      }
    } catch (e) {
      console.error("Failed to fetch recent attendance logs", e);
    }
  }, []);

  const fetchTodayStatus = useCallback(async () => {
    try {
      setFetchError(false);
      const data = await apiFetch('/attendance/today-status');
      if (data && data.success) {
        setTodayRecord(data.attendance || data);
      } else {
        setTodayRecord({ status: 'NOT_PUNCHED' });
      }
    } catch (e) {
      console.error("Failed to fetch today status", e);
      setFetchError(true);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      await Promise.all([fetchTodayStatus(), fetchRecent()]);
    } catch (e) {
      console.error("Error loading attendance initial data", e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchTodayStatus, fetchRecent]);

  useEffect(() => {
    loadInitialData();

    // Listen to cross-component attendance updates
    const handleAttendanceChange = () => {
      fetchTodayStatus();
      fetchRecent();
    };
    window.addEventListener('attendance-updated', handleAttendanceChange);
    return () => window.removeEventListener('attendance-updated', handleAttendanceChange);
  }, [loadInitialData, fetchTodayStatus, fetchRecent]);

  // Update live working hours elapsed timer for PUNCHED_IN employees
  useEffect(() => {
    if (todayRecord?.status !== 'PUNCHED_IN' || !todayRecord?.checkInTimeRaw) {
      return;
    }

    const updateTimer = () => {
      const start = new Date(todayRecord.checkInTimeRaw);
      const now = new Date();
      const diffMs = Math.max(0, now - start);
      const hrs = String(Math.floor(diffMs / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${hrs}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  const handlePunch = (type) => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setStatus('error');
      return;
    }

    setStatus("locating");
    setErrorMessage('');

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await apiFetch('/attendance/punch', {
            method: 'POST',
            body: JSON.stringify({
              punch_type: type,
              latitude: lat,
              longitude: lng,
              device_info: navigator.userAgent,
              browser: getBrowserName(),
              ip_address: ''
            })
          });

          if (res && res.success) {
            const att = res.attendance || res.todayRecord || {
              status: type === 'IN' ? 'PUNCHED_IN' : 'PUNCHED_OUT',
              punchInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              locationName: res.locationName || 'HQ Office Geofence',
              workingHours: type === 'OUT' ? 'Calculated' : '00h 00m'
            };

            setTodayRecord(att);
            setSuccessInfo({
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              lat,
              lng,
              locationName: res.locationName || 'HQ Office Geofence',
              distance: res.distance || 0,
              type
            });
            setStatus('success');
            window.dispatchEvent(new CustomEvent('attendance-updated', { detail: { type, attendance: att } }));
            fetchRecent();
          } else {
            setErrorMessage(res?.message || res?.error || "You are outside the permitted office location.");
            setStatus('error');
          }
        } catch (err) {
          console.error("Punch request error:", err);
          setErrorMessage(err.message || "Error submitting punch request. Please check your connection.");
          setStatus('error');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("GPS permission denied. Please enable location permissions in your browser settings to punch attendance.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("Location information is unavailable. Ensure your device GPS is active.");
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage("GPS location request timed out. Please try again in an area with better signal.");
        } else {
          setErrorMessage("Could not retrieve GPS coordinates. Please ensure location services are enabled.");
        }
        setStatus('error');
      },
      options
    );
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) return "Google Chrome";
    if (userAgent.indexOf("Safari") > -1) return "Apple Safari";
    if (userAgent.indexOf("Firefox") > -1) return "Mozilla Firefox";
    return "Web Browser";
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }} className="max-w-md mx-auto space-y-5">
      
      {/* Premium Main Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden'
      }}>

        {/* Dynamic Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          padding: '24px',
          color: '#FFFFFF',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ fontSize: '13px', color: '#DBEAFE', fontWeight: '600', letterSpacing: '0.02em', marginBottom: '4px' }}>
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {format(currentTime, 'hh:mm:ss')} <span style={{ fontSize: '16px', fontWeight: '600', opacity: 0.8 }}>{format(currentTime, 'a')}</span>
          </div>

          {/* Top Status Pill */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            {loading ? (
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(4px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Loader2 size={12} className="animate-spin" /> CHECKING ATTENDANCE...
              </span>
            ) : (
              <span style={{
                background: todayRecord?.status === 'PUNCHED_IN' ? '#10B981' : todayRecord?.status === 'PUNCHED_OUT' ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(4px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} className="animate-ping" />
                {todayRecord?.status === 'PUNCHED_IN' ? 'CHECKED IN' : todayRecord?.status === 'PUNCHED_OUT' ? 'CHECKED OUT' : 'READY TO CHECK IN'}
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '24px' }}>

          {/* Loading Initial State */}
          {loading && (
            <div className="text-center py-10 space-y-3">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
              <div className="text-sm font-semibold text-slate-700">Loading attendance status...</div>
              <p className="text-xs text-slate-400">Verifying today's punch records from database.</p>
            </div>
          )}

          {/* Fetch Error State */}
          {!loading && fetchError && (
            <div className="text-center py-8 space-y-3">
              <div style={{ width: '56px', height: '56px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '3px solid #FEE2E2' }}>
                <AlertTriangle className="text-rose-600" size={26} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Unable to load today's attendance</h4>
                <p className="text-xs text-slate-500 mt-1">Please check your network connection and retry.</p>
              </div>
              <button
                onClick={loadInitialData}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Idle State: Not Punched Yet (Ready to Check In) */}
          {!loading && !fetchError && status === 'idle' && (todayRecord?.status === 'NOT_PUNCHED' || !todayRecord?.status) && (
            <div className="text-center space-y-4">
              <div style={{ width: '72px', height: '72px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '4px solid #DBEAFE' }}>
                <MapPin className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Geofenced Punch In</h3>
                <p className="text-xs text-slate-500 mt-1">Requires browser GPS verification to mark attendance.</p>
              </div>
              <button
                onClick={() => handlePunch('IN')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.40)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.02em',
                  transition: 'opacity 0.15s, transform 0.1s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={18} /> PUNCH IN NOW
              </button>
            </div>
          )}

          {/* Idle State: Currently Punched In -> Active Shift (Punch Out Now) */}
          {!loading && !fetchError && status === 'idle' && todayRecord?.status === 'PUNCHED_IN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Shift Stats Card */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                {/* Row: Check In Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Check In Time</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>{todayRecord.punchInTime || '09:15 AM'}</strong>
                </div>
                {/* Row: Working Hours (Live) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#EFF6FF' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Working Hours</span>
                  <strong style={{ fontSize: '15px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{elapsed}</strong>
                </div>
                {/* Row: Location */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Location</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600', maxWidth: '200px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {todayRecord.locationName || 'Verified / Geo-fenced'}
                  </strong>
                </div>
                {/* Row: Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Status</span>
                  <span style={{ padding: '3px 10px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '700', borderRadius: '20px', letterSpacing: '0.03em' }}>
                    {todayRecord.statusLabel || 'Checked In'}
                  </span>
                </div>
              </div>

              {/* Punch Out Action Button */}
              <button
                onClick={() => handlePunch('OUT')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                  boxShadow: '0 8px 20px -4px rgba(220, 38, 38, 0.35)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.02em',
                  transition: 'opacity 0.15s, transform 0.1s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={18} /> PUNCH OUT NOW
              </button>
            </div>
          )}

          {/* Idle State: Punched Out Completed (Checked Out) */}
          {!loading && !fetchError && status === 'idle' && todayRecord?.status === 'PUNCHED_OUT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Check icon + title */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: '3px solid #D1FAE5' }}>
                  <CheckCircle className="text-emerald-600" size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Attendance Completed</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>You have completed your shift for today.</p>
              </div>

              {/* Stats rows */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
                {/* Punch In */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Check In</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>{todayRecord.punchInTime}</strong>
                </div>
                {/* Punch Out */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Check Out</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>{todayRecord.punchOutTime}</strong>
                </div>
                {/* Working Hours */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#EFF6FF' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Working Hours</span>
                  <strong style={{ fontSize: '15px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{todayRecord.workingHours}</strong>
                </div>
                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Status</span>
                  <span style={{ padding: '3px 10px', background: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: '700', borderRadius: '20px', letterSpacing: '0.03em' }}>
                    {todayRecord.statusLabel || 'Completed'}
                  </span>
                </div>
              </div>

              {/* Success note */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#16A34A' }}>
                <CheckCircle size={14} /> Attendance successfully recorded for today!
              </div>
            </div>
          )}

          {/* Locating GPS State */}
          {status === 'locating' && (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Verifying GPS Location...</h4>
                <p className="text-xs text-slate-400 mt-1">Acquiring accurate GPS coordinates from your device.</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && successInfo && (
            <div className="text-center space-y-4">
              <div style={{ width: '64px', height: '64px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle className="text-emerald-600" size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Punch {successInfo.type} Successful!</h3>
                <p className="text-xs text-slate-500 mt-1">Recorded at {successInfo.time}</p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 text-left space-y-1">
                  <div><strong>Location:</strong> {successInfo.locationName}</div>
                  <div><strong>Coordinates:</strong> {successInfo.lat.toFixed(5)}, {successInfo.lng.toFixed(5)}</div>
                </div>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <AlertTriangle className="text-rose-600" size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Punch Rejected</h3>
                <p className="text-xs text-rose-600 font-semibold mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Recent Activity List */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(15,23,42,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Recent Punch Logs
          </h4>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
            {recent.length} {recent.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#94A3B8' }}>
              No recent punch activity.
            </div>
          ) : (
            recent.map((item, idx) => {
              const isToday = item.date === 'Today' || item.isToday;
              const hasCheckOut = item.checkOut && item.checkOut !== '--';
              const statusText = item.status || (hasCheckOut ? 'Completed' : 'Checked In');
              const isPunchedInActive = statusText === 'Checked In' || (!hasCheckOut && item.checkIn && item.checkIn !== '--');

              return (
                <div key={item.id || idx} style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isToday ? '#F0FDF4' : '#F8FAFC',
                  border: isToday ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Top Header: Date + Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isToday ? '#15803D' : '#1E293B'
                      }}>
                        {item.date || (item.punch_time ? new Date(item.punch_time).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : 'Session')}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: '9px', fontWeight: '800', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: '700',
                      background: isPunchedInActive ? '#DCFCE7' : '#DBEAFE',
                      color: isPunchedInActive ? '#15803D' : '#1D4ED8',
                      whiteSpace: 'nowrap',
                    }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Punch Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px', fontWeight: '600' }}>Check In</span>
                      <strong style={{ color: '#0F172A', fontWeight: '700' }}>
                        {item.checkIn || (item.punch_type === 'IN' ? new Date(item.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--')}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px', fontWeight: '600' }}>Check Out</span>
                      <strong style={{ color: '#0F172A', fontWeight: '700' }}>
                        {item.checkOut || (item.punch_type === 'OUT' ? new Date(item.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--')}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px', fontWeight: '600' }}>Hours</span>
                      <strong style={{ color: '#2563EB', fontWeight: '700' }}>
                        {item.workingHours || '--'}
                      </strong>
                    </div>
                  </div>

                  {/* Location info if available */}
                  {item.location && (
                    <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} className="text-slate-400" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

export default GeoPunch;