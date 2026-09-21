import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Palette, Image, ShieldCheck, Eye, Upload, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';

const KpiCard = ({ label, value, iconBg, iconColor, icon: Icon }) => (
  <div style={{
    background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)',
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0', minWidth: 0,
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} />
    </div>
    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
    </div>
  </div>
);

export function SettingsBranding() {
  const { addToast } = useToast();
  const [primaryColor, setPrimaryColor] = useState('#2952E3');
  const [successColor, setSuccessColor] = useState('#10B981');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load saved branding configuration on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hrms_branding_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.successColor) setSuccessColor(parsed.successColor);
        if (parsed.logoPreview) setLogoPreview(parsed.logoPreview);
      }
    } catch (e) {
      console.error('Error loading branding config:', e);
    }
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('File size exceeds 5MB limit', 'error');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      addToast(`Selected ${file.name}`, 'info');
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    addToast('Logo removed', 'info');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const config = {
        primaryColor,
        successColor,
        logoPreview,
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage so UI components immediately react
      localStorage.setItem('hrms_branding_config', JSON.stringify(config));

      // Attempt to save to backend API if route exists
      const auth = localStorage.getItem('hrms_auth');
      const token = auth ? JSON.parse(auth).token : '';

      await fetch('/app/organization/company-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          branding: {
            companyThemeColor: primaryColor,
            companyLogoName: logoFile ? logoFile.name : (logoPreview ? 'Custom Logo' : '')
          }
        })
      }).catch(() => {});

      addToast('Branding settings saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save branding settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor('#2952E3');
    setSuccessColor('#10B981');
    setLogoFile(null);
    setLogoPreview(null);
    localStorage.removeItem('hrms_branding_config');
    addToast('Branding reset to default theme.', 'info');
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* Shared Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Branding Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Customize company logos, primary theme colors, and live brand identity</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleReset}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}
          >
            <RotateCcw size={14} color="#6B7280" /> Reset Theme
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
              background: primaryColor, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 2px 8px ${primaryColor}40`
            }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20, width: '100%' }}>
        <KpiCard label="Logo Status"    value={logoPreview ? "Uploaded Logo" : "Default Logo"} iconBg="#EFF6FF" iconColor="#2563EB" icon={Image} />
        <KpiCard label="Active Theme"   value="Enterprise HRMS" iconBg="#ECFDF5" iconColor="#059669" icon={Palette} />
        <KpiCard label="Favicon"        value="Active 32x32" iconBg="#EFF6FF" iconColor="#2563EB" icon={Image} />
        <KpiCard label="PDF Watermark"  value="Enabled"      iconBg="#ECFDF5" iconColor="#059669" icon={ShieldCheck} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        
        {/* Left Options Form */}
        <form onSubmit={handleSave} style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Brand Identity & Theme Colors</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Primary Color ({primaryColor})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: 44, height: 38, border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#FFF' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ flex: 1, height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Accent Success Color ({successColor})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={successColor}
                  onChange={(e) => setSuccessColor(e.target.value)}
                  style={{ width: 44, height: 38, border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#FFF' }}
                />
                <input
                  type="text"
                  value={successColor}
                  onChange={(e) => setSuccessColor(e.target.value)}
                  style={{ flex: 1, height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Upload Company Logo</h4>

            {logoPreview ? (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, textAlign: 'center', background: '#FAFAFA', position: 'relative' }}>
                <img src={logoPreview} alt="Company Logo Preview" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', marginBottom: 12 }} />
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>{logoFile ? logoFile.name : 'Uploaded Company Logo'}</div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Remove Logo
                </button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed #CBD5E1', borderRadius: 12, padding: 30, textAlign: 'center', background: '#FAFAFA', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                <Upload size={32} color="#64748B" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Click to upload SVG, PNG or JPG</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Maximum file size: 5MB. Recommended resolution: 400x100px</div>
              </label>
            )}
          </div>
        </form>

        {/* Right Live Preview Card */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={16} /> Theme Live Preview
          </h3>
          <div style={{ background: '#0F172A', borderRadius: 10, padding: 16, color: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ height: 26, objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>HAWKEYE NEST</div>
              )}
            </div>
            
            <div style={{ background: primaryColor, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 10, transition: 'background-color 0.2s' }}>
              Active Navigation Item
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: successColor, background: `${successColor}1A`, padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>
              <Check size={13} /> Success Badge ({successColor})
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default SettingsBranding;
