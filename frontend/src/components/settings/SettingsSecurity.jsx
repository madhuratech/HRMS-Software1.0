import React from 'react';
import { Save, Shield, Lock, Smartphone, FileText } from 'lucide-react';

export function SettingsSecurity() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Security Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure password policies, two-factor authentication, and session timeouts</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save Security Rules
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Password Policy</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>Strong (8+ Chars)</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>2FA Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 2 }}>Enforced (TOTP)</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Audit Events</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>1,420 Logged</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Session Timeout</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>30 Minutes</div>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Authentication & Password Controls</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Min Password Length</label>
            <input type="number" defaultValue={8} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Session Timeout (Minutes)</label>
            <input type="number" defaultValue={30} style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
        </div>
      </div>

    </div>
  );
}

export default SettingsSecurity;
