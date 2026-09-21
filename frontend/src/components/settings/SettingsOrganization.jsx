import React from 'react';
import { Save, MapPin, Building, Layers, Globe } from 'lucide-react';

const BRANCHES = [
  { name: 'Bangalore HQ', type: 'Headquarters', city: 'Bangalore', emps: 150, status: 'Active' },
  { name: 'Mumbai Tech Hub', type: 'Regional Office', city: 'Mumbai', emps: 65, status: 'Active' },
  { name: 'Hyderabad Branch', type: 'Branch Office', city: 'Hyderabad', emps: 33, status: 'Active' },
];

export function SettingsOrganization() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Organization Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Configure branches, departments, and business units</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save Structure
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Branches</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>12 Units</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Departments</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>8 Divisions</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Business Units</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>4 Units</div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Locations</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>5 Cities</div>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>Branch Offices & Business Locations</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
              {['Branch Name', 'Type', 'City', 'Employees', 'Status'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANCHES.map((b, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 44 }}>
                <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.name}</td>
                <td style={{ padding: '0 16px', fontSize: 13, color: '#374151' }}>{b.type}</td>
                <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280' }}>{b.city}</td>
                <td style={{ padding: '0 16px', fontSize: 13, color: '#111827', fontWeight: 600 }}>{b.emps}</td>
                <td style={{ padding: '0 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#059669' }}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default SettingsOrganization;
