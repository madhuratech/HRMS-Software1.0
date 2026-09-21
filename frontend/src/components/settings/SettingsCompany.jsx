import React from 'react';
import AppDropdown from '../ui/AppDropdown';
import { Save, RotateCcw, Building2, MapPin, Users, CheckCircle2 } from 'lucide-react';

const KpiCard = ({ label, value, iconBg, iconColor, icon: Icon }) => (
  <div style={{
    background: '#FFF',
    borderRadius: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(15,23,42,.04)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '1 1 0',
    minWidth: 0,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: iconBg, color: iconColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
    </div>
  </div>
);

export function SettingsCompany() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* Shared Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Company Information</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage company profile and organization details</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
            background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer',
          }}>
            <RotateCcw size={14} color="#6B7280" /> Reset
          </button>

          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
            background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(41,82,227,0.25)',
          }}>
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Company Profile"     value="Active"       iconBg="#EFF6FF" iconColor="#2563EB" icon={Building2} />
        <KpiCard label="Branches"            value="12 Units"     iconBg="#ECFDF5" iconColor="#059669" icon={MapPin} />
        <KpiCard label="Total Employees"     value="248 Active"   iconBg="#EFF6FF" iconColor="#2563EB" icon={Users} />
        <KpiCard label="Organization Status" value="Verified 100%"iconBg="#ECFDF5" iconColor="#059669" icon={CheckCircle2} />
      </div>

      {/* Main Form Layout (Left 70% Form + Right 30% Summary) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        
        {/* Left Form */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>General Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company Name</label>
              <input type="text" defaultValue="Acme Enterprise HRMS Solutions Pvt Ltd" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Registration Number (CIN)</label>
              <input type="text" defaultValue="U72900KA2020PTC134567" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>GST Number</label>
              <input type="text" defaultValue="29AAAAA0000A1Z5" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>PAN Number</label>
              <input type="text" defaultValue="AAAAA0000A" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Official Email</label>
              <input type="email" defaultValue="contact@acmehrms.com" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone Number</label>
              <input type="text" defaultValue="+91 80 4567 8900" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Headquarters Address</label>
            <input type="text" defaultValue="Plot 42, Electronic City Phase 1, Hosur Road, Bangalore" style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Currency</label>
              <AppDropdown options={[{value:'INR (₹)',label:'INR (₹)'},{value:'USD ($)',label:'USD ($)'}]} size="sm" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Time Zone</label>
              <AppDropdown options={[{value:'(UTC+05:30) IST - Kolkata',label:'(UTC+05:30) IST - Kolkata'}]} size="sm" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Financial Year Start</label>
              <AppDropdown options={[{value:'April 1st',label:'April 1st'},{value:'January 1st',label:'January 1st'}]} size="sm" />
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Profile Completion</h3>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', marginBottom: 6 }}>100%</div>
            <div style={{ height: 6, background: '#ECFDF5', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#10B981' }} />
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '8px 0 0' }}>All regulatory and tax compliance parameters are complete.</p>
          </div>

          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Updates</h3>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>GST Details updated by Admin</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Today at 10:45 AM</div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default SettingsCompany;
