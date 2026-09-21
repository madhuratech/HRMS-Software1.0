import React, { useState, useEffect } from 'react';
import { Clock, CalendarCheck, Sun, CheckCircle, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function MyShift() {
  const [shiftData, setShiftData] = useState({
    name: 'Morning Shift',
    code: 'MSH-001',
    time: '9:00 AM - 6:00 PM',
    graceTime: '15 Minutes',
    halfDayTime: '01:30 PM',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    offDays: ['Sun'],
    offLabel: 'Weekly Off'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeShift = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/organization/shifts');
        if (Array.isArray(res) && res.length > 0) {
          const mainShift = res[0];
          setShiftData({
            name: mainShift.name || 'General Shift',
            code: mainShift.shiftCode || 'GEN-001',
            time: `${mainShift.startTime || '09:00 AM'} - ${mainShift.endTime || '06:00 PM'}`,
            graceTime: mainShift.graceTime ? `${mainShift.graceTime} Mins` : '15 Mins',
            halfDayTime: mainShift.halfDayTime || '01:30 PM',
            workingDays: Array.isArray(mainShift.workingDays) ? mainShift.workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            offDays: Array.isArray(mainShift.workingDays) 
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(d => !mainShift.workingDays.includes(d))
              : ['Sun'],
            offLabel: mainShift.offLabel || 'Weekly Off'
          });
        }
      } catch (e) {
        console.error("Failed to load employee shift details:", e);
      }
      setLoading(false);
    };

    fetchEmployeeShift();
  }, []);

  const daysOfWeek = [
    { day: 'Mon', full: 'Monday' },
    { day: 'Tue', full: 'Tuesday' },
    { day: 'Wed', full: 'Wednesday' },
    { day: 'Thu', full: 'Thursday' },
    { day: 'Fri', full: 'Friday' },
    { day: 'Sat', full: 'Saturday' },
    { day: 'Sun', full: 'Sunday' }
  ];

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB'
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6">
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(37,99,235,0.25)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>My Shift Schedule</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#DBEAFE' }}>
            Source of Truth: Organization → Shift Management
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: '8px 16px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={16} /> Assigned Shift
        </div>
      </div>

      {/* Main Shift Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={cardStyle} className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                {shiftData.code}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{shiftData.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Shift Timing</span>
              <strong className="text-base font-extrabold text-blue-600">{shiftData.time}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Grace Period</span>
              <strong className="text-slate-800 text-sm">{shiftData.graceTime}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Half Day Cutoff</span>
              <strong className="text-slate-800 text-sm">{shiftData.halfDayTime}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Weekly Off</span>
              <strong className="text-rose-600 text-sm font-bold">{shiftData.offLabel}</strong>
            </div>
          </div>
        </div>

        <div style={cardStyle} className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Shift Policy & Rules</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Punches within grace period count as On Time. Arrival past grace time will be logged as Late Arrival.
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
            <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Shift modifications are managed by your HR / Shift Manager.</span>
          </div>
        </div>
      </div>

      {/* Shift Roster Grid (Weekly Schedule) */}
      <div style={cardStyle}>
        <h3 className="text-base font-bold text-slate-900 mb-4">Weekly Shift Roster</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {daysOfWeek.map((d, idx) => {
            const isWorking = shiftData.workingDays.includes(d.day);
            return (
              <div
                key={idx}
                style={{
                  background: isWorking ? '#F8FAFC' : '#FEF2F2',
                  border: isWorking ? '1px solid #E2E8F0' : '1px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '16px 12px',
                  textAlign: 'center'
                }}
              >
                <span className="text-xs font-bold text-slate-400 block uppercase">{d.day}</span>
                <span className="text-sm font-bold text-slate-800 block my-1">{d.full}</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: isWorking ? '#DCFCE7' : '#FEE2E2',
                    color: isWorking ? '#15803D' : '#DC2626'
                  }}
                >
                  {isWorking ? 'Morning' : shiftData.offLabel}
                </span>
                <span className="text-[10px] text-slate-500 block mt-2">
                  {isWorking ? shiftData.time : 'No Shift'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default MyShift;
