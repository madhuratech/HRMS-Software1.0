import React from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Save, Mail, Bell, Server, CheckCircle2 } from 'lucide-react';

export function SettingsCommunication() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Communication Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage email templates, SMTP settings, and notification preferences</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save SMTP Config
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Email Templates</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>24 Configured</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Notifications</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>Push + Email</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>SMTP Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 2 }}>Connected</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Delivery Success</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>99.8%</div>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>SMTP Gateway Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>SMTP Host</label>
            <input type="text" defaultValue="smtp.gmail.com" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>SMTP Port</label>
            <input type="text" defaultValue="587" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sender Email</label>
            <input type="email" defaultValue="notifications@acmehrms.com" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Encryption</label>
            <AppDropdown options={[{value:'TLS / STARTTLS',label:'TLS / STARTTLS'},{value:'SSL',label:'SSL'}]} size="sm" />
          </div>
        </div>
      </div>

    </div>
  );
}

export default SettingsCommunication;
