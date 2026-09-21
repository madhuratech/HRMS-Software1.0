import React from 'react';
import { Save, Clock, Calendar, DollarSign, UserCheck } from 'lucide-react';

export function SettingsHR() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>HR Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure attendance rules, leave policies, and employee ID formats</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save Rules
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Attendance Rules</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>Strict 9:30 AM</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Leave Policies</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>18 Paid Leaves</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Payroll Rules</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>PF + ESI Enabled</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Employee ID Format</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>EMP-001</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Attendance & Shift Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Grace Period (Minutes)</label>
              <input type="number" defaultValue={15} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Half-Day Marking Threshold (Hours)</label>
              <input type="number" defaultValue={4} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            </div>
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Probation & Notice Period</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Probation Period (Months)</label>
              <input type="number" defaultValue={6} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notice Period (Days)</label>
              <input type="number" defaultValue={60} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SettingsHR;
