import React, { useState, useEffect, useMemo } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { CalendarDays, MapPin } from 'lucide-react';

export default function HolidayList() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/organization/holidays');
      if (Array.isArray(data)) {
        setHolidays(data);
      }
    } catch (e) {
      console.error("Failed to load holidays in Leave Management:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHolidays();
    window.addEventListener('focus', loadHolidays);
    return () => window.removeEventListener('focus', loadHolidays);
  }, []);

  // Helper to format date string and get day of the week
  const formatHolidayDate = (dateStr) => {
    if (!dateStr) return { dateStr: '—', dayStr: '—', rawDate: null };
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return { dateStr: dateStr, dayStr: '—', rawDate: null };
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[parsed.getDay()];
    const monthName = months[parsed.getMonth()];
    const dateNum = String(parsed.getDate()).padStart(2, '0');
    const year = parsed.getFullYear();

    return {
      dateStr: `${dateNum} ${monthName} ${year}`,
      dayStr: dayName,
      rawDate: parsed
    };
  };

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const matchesLoc = selectedLocation === 'All Locations' || (h.branch || h.location || 'All Locations') === selectedLocation;
      if (!matchesLoc) return false;
      if (selectedYear !== 'All') {
        const parsed = new Date(h.date);
        if (!isNaN(parsed.getTime()) && String(parsed.getFullYear()) !== selectedYear) {
          return false;
        }
      }
      return true;
    });
  }, [holidays, selectedYear, selectedLocation]);

  // Compute Upcoming Holidays (up to 3)
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return holidays
      .filter(h => h.status === 'Active')
      .map(h => {
        const fmt = formatHolidayDate(h.date);
        return { ...h, fmt };
      })
      .filter(h => h.fmt.rawDate && h.fmt.rawDate >= today)
      .sort((a, b) => a.fmt.rawDate - b.fmt.rawDate)
      .slice(0, 3);
  }, [holidays]);

  // Compute Holiday Statistics
  const statistics = useMemo(() => {
    const gazettedCount = holidays.filter(h => h.type === 'National' || h.type === 'Public' || h.type === 'Gazetted').length;
    const optionalCount = holidays.filter(h => h.type === 'Optional' || h.type === 'Regional' || h.type === 'Company').length;
    return {
      total: holidays.length,
      gazetted: gazettedCount,
      optional: optionalCount,
      workingDays: Math.max(0, 365 - 104 - gazettedCount)
    };
  }, [holidays]);

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
    border: '1px solid #E5E7EB',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

      {/* Header Toolbar (Single Source of Truth Info) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <AppDropdown
                value={selectedYear}
                onChange={v => setSelectedYear(v)}
                options={[{value:'All',label:'All Years'},{value:'2026',label:'2026'},{value:'2025',label:'2025'},{value:'2024',label:'2024'}]}
                size="sm"
              />

          <AppDropdown
                value={selectedLocation}
                onChange={v => setSelectedLocation(v)}
                options={[{value:'All Locations',label:'All Locations'},{value:'Mumbai',label:'Mumbai'},{value:'Bangalore',label:'Bangalore'},{value:'Chennai',label:'Chennai'}]}
                size="sm"
              />
        </div>

        {/* Source of Truth Info Badge */}
        <div style={{ fontSize: '12px', color: '#64748B', background: '#F8FAFC', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: '500' }}>
          Holidays managed via <strong>Organization → Holiday Calendar</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>

        {/* Main Table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Day</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Holiday Name</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Description</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Location</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Loading Organization Holidays…
                    </td>
                  </tr>
                ) : filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No holidays found. Manage company holidays in <strong>Organization → Holiday Calendar</strong>.
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((holiday, idx) => {
                    const fmt = formatHolidayDate(holiday.date);
                    return (
                      <tr key={holiday.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap' }}>{fmt.dateStr}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748b' }}>{fmt.dayStr}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#2563eb', whiteSpace: 'nowrap' }}>{holiday.name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{holiday.description || '—'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{holiday.branch || holiday.location || 'All Locations'}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: holiday.type === 'National' || holiday.type === 'Public' ? '#ecfdf5' : '#f5f3ff',
                            color: holiday.type === 'National' || holiday.type === 'Public' ? '#047857' : '#7c3aed'
                          }}>
                            {holiday.type || 'Public'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: holiday.status === 'Active' ? '#ecfdf5' : '#f3f4f6',
                            color: holiday.status === 'Active' ? '#047857' : '#4b5563'
                          }}>
                            {holiday.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Upcoming Holidays */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Upcoming Holidays</h3>
            {upcomingHolidays.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No upcoming holidays scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcomingHolidays.map((h, i) => {
                  const dayNum = h.fmt.rawDate ? h.fmt.rawDate.getDate() : '--';
                  const monthName = h.fmt.rawDate ? h.fmt.rawDate.toLocaleString('en-US', { month: 'short' }) : 'MON';
                  return (
                    <div key={h.id || i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#10b981', textTransform: 'uppercase' }}>{monthName}</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{dayNum}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{h.name}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{h.fmt.dayStr} • {h.type || 'Public'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Holiday Statistics */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Holiday Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569' }}>Total Holidays</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{statistics.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569' }}>Gazetted / Public</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{statistics.gazetted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569' }}>Optional / Regional</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{statistics.optional}</span>
              </div>
              <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#1e293b', fontWeight: '600' }}>Effective Working Days</span>
                <span style={{ fontWeight: '700', color: '#2563eb' }}>{statistics.workingDays}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
