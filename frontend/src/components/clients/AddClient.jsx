import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, ArrowLeft, Check, Loader2, User, Mail, Phone, Globe,
  Briefcase, MapPin, FileText, ChevronRight
} from 'lucide-react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';

const CLIENT_TYPES = ['Prospect', 'Active', 'Inactive', 'Former'];
const STATUS_OPTS = ['Active', 'Inactive', 'Blocked'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Hospitality', 'Media', 'Logistics',
  'Consulting', 'Construction', 'Automotive', 'Telecommunications', 'Other'
];

const EMPTY_FORM = {
  company_name: '',
  project: '',
  contact_person: '',
  designation: '',
  email: '',
  phone: '',
  alternate_phone: '',
  website: '',
  industry: 'Technology',
  company_size: '11-50',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postal_code: '',
  client_type: 'Prospect',
  status: 'Active',
  gst_number: '',
  notes: ''
};

export default function AddClient({ isEdit = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [existingProjects, setExistingProjects] = useState([]);
  const [loading, setLoading] = useState(isEdit && Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    apiFetch('/projects?limit=100')
      .then(res => {
        if (res.success && res.data) {
          const list = res.data.projects || res.data.rows || res.data || [];
          setExistingProjects(list);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      apiFetch(`/clients/${id}`)
        .then(res => {
          if (res.success && res.data) {
            const c = res.data;
            setFormData({
              company_name: c.company_name || '',
              project: c.project || '',
              contact_person: c.contact_person || '',
              designation: c.designation || '',
              email: c.email || '',
              phone: c.phone || '',
              alternate_phone: c.alternate_phone || '',
              website: c.website || '',
              industry: c.industry || 'Technology',
              company_size: c.company_size || '11-50',
              address: c.address || '',
              city: c.city || '',
              state: c.state || '',
              country: c.country || 'India',
              postal_code: c.postal_code || '',
              client_type: c.client_type || 'Prospect',
              status: c.status || 'Active',
              gst_number: c.gst_number || '',
              notes: c.notes || ''
            });
          } else {
            addToast(res.message || 'Failed to load client details', 'error');
            navigate('/clients/list');
          }
        })
        .catch(err => {
          addToast('Error loading client details', 'error');
          navigate('/clients/list');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, addToast, navigate]);

  const validate = () => {
    const errs = {};
    if (!formData.company_name.trim()) {
      errs.company_name = 'Company name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Invalid email address';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      addToast('Please correct the errors in the form', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = isEdit && id
        ? await apiFetch(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(formData) })
        : await apiFetch('/clients', { method: 'POST', body: JSON.stringify(formData) });

      if (res.success) {
        addToast(isEdit ? 'Client updated successfully!' : 'Client created successfully!', 'success');
        navigate('/clients/list');
      } else {
        addToast(res.message || 'Failed to save client', 'error');
      }
    } catch (err) {
      addToast('Error saving client', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, color: '#64748B', fontSize: 14 }}>Loading client information...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', minHeight: '100vh', background: '#F8FAFC', padding: '24px 28px' }}>
      {/* Breadcrumb navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        <Link to="/clients/list" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Clients
        </Link>
        <ChevronRight size={14} color="#94A3B8" />
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{isEdit ? 'Edit Client' : 'Add Client'}</span>
      </div>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #F1F5F9', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <Building2 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {isEdit ? 'Edit Client Details' : 'Add New Client'}
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
              Create and manage client details, contact information, and business terms
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, padding: '32px', border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Section 1: Client Information */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #F1F5F9', paddingBottom: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                1
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Client Information
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <FormField label="Company Name *" error={formErrors.company_name}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={formData.company_name}
                  onChange={e => {
                    setFormData({ ...formData, company_name: e.target.value });
                    if (formErrors.company_name) setFormErrors({ ...formErrors, company_name: null });
                  }}
                  style={inputStyle(Boolean(formErrors.company_name))}
                />
              </FormField>

              <FormField label="Project">
                <input
                  type="text"
                  list="client-project-suggestions"
                  placeholder="e.g. Website Redesign, Mobile App"
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                  style={inputStyle(false)}
                />
                <datalist id="client-project-suggestions">
                  {existingProjects.map((p, idx) => (
                    <option key={idx} value={p.project_name || p} />
                  ))}
                </datalist>
              </FormField>

              <FormField label="Contact Person">
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.contact_person}
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Designation">
                <input
                  type="text"
                  placeholder="e.g. Director of Operations"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Email Address" error={formErrors.email}>
                <input
                  type="email"
                  placeholder="e.g. contact@acme.com"
                  value={formData.email}
                  onChange={e => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                  }}
                  style={inputStyle(Boolean(formErrors.email))}
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Alternate Phone">
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 00000"
                  value={formData.alternate_phone}
                  onChange={e => setFormData({ ...formData, alternate_phone: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: Company Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #F1F5F9', paddingBottom: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                2
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Company Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <FormField label="Website">
                <input
                  type="url"
                  placeholder="e.g. https://acme.com"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Industry">
                <AppDropdown
                  value={formData.industry}
                  onChange={v => setFormData({ ...formData, industry: v })}
                  options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                  size="md"
                />
              </FormField>

              <FormField label="Company Size">
                <AppDropdown
                  value={formData.company_size}
                  onChange={v => setFormData({ ...formData, company_size: v })}
                  options={COMPANY_SIZES.map(s => ({ value: s, label: `${s} employees` }))}
                  size="md"
                />
              </FormField>

              <FormField label="Address" span={2}>
                <input
                  type="text"
                  placeholder="Street address, Suite / Floor"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="City">
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="State">
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Country">
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Postal Code">
                <input
                  type="text"
                  placeholder="e.g. 400001"
                  value={formData.postal_code}
                  onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Business Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #F1F5F9', paddingBottom: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                3
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Business Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <FormField label="Client Type">
                <AppDropdown
                  value={formData.client_type}
                  onChange={v => setFormData({ ...formData, client_type: v })}
                  options={CLIENT_TYPES.map(t => ({ value: t, label: t }))}
                  size="md"
                />
              </FormField>

              <FormField label="Status">
                <AppDropdown
                  value={formData.status}
                  onChange={v => setFormData({ ...formData, status: v })}
                  options={STATUS_OPTS.map(s => ({ value: s, label: s }))}
                  size="md"
                />
              </FormField>

              <FormField label="GST / Tax ID">
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={formData.gst_number}
                  onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                  style={inputStyle(false)}
                />
              </FormField>

              <FormField label="Notes" span={2}>
                <textarea
                  rows={3}
                  placeholder="Additional notes about contracts, terms, or account owner..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: 13,
                    outline: 'none',
                    background: '#F8FAFC',
                    boxSizing: 'border-box',
                    color: '#1E293B',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </FormField>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => navigate('/clients/list')}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                background: '#fff',
                color: '#64748B',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 28px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.15s'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEdit ? 'Update Client' : 'Create Client'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

function FormField({ label, error, children, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
          {label}
        </label>
      )}
      {children}
      {error && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 5, fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: '100%',
    height: 42,
    padding: '0 14px',
    border: `1.5px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
    background: hasError ? '#FFF5F5' : '#F8FAFC',
    boxSizing: 'border-box',
    color: '#1E293B',
    transition: 'border-color 0.15s'
  };
}
