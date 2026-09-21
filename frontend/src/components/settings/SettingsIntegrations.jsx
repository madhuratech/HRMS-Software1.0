import React from 'react';
import { Save, Link2, Key, Cpu, CheckCircle2 } from 'lucide-react';

export function SettingsIntegrations() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Integrations</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure biometric devices, REST API keys, and third-party webhooks</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save Integrations
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Connected Apps</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>6 Apps</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>API Keys</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>4 Active Keys</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Biometric Devices</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 2 }}>12 Online</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Webhooks</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>3 Active</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Biometric Sync (ZKTeco / Matrix)</h3>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>Device IP: 192.168.1.120:4370</div>
          <button style={{ height: 34, padding: '0 14px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Connected (Auto Sync Every 5 Mins)
          </button>
        </div>

        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#111827' }}>REST API Tokens</h3>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Prod Token: hrms_live_89a7f6e210b4</div>
          <button style={{ height: 34, padding: '0 14px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Regenerate Secret Key
          </button>
        </div>
      </div>

    </div>
  );
}

export default SettingsIntegrations;
