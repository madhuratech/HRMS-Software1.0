import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2, ArrowLeft, Edit2, Mail, Phone, Globe, MapPin,
  Briefcase, Users, Calendar, Activity, Loader2, ChevronRight,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { apiFetch, formatDate, getInitials } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

const TYPE_STYLE = {
  Prospect: { bg: '#EEF2FF', color: '#4338CA' },
  Active:   { bg: '#DCFCE7', color: '#15803D' },
  Inactive: { bg: '#F3F4F6', color: '#6B7280' },
  Former:   { bg: '#FEF3C7', color: '#D97706' },
};

const STATUS_STYLE = {
  Active:   { bg: '#DCFCE7', color: '#15803D' },
  Inactive: { bg: '#F3F4F6', color: '#6B7280' },
  Blocked:  { bg: '#FEE2E2', color: '#DC2626' },
};

const PROJECT_STATUS_STYLE = {
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Completed':   { bg: '#DCFCE7', color: '#15803D' },
  'On Hold':     { bg: '#FEF3C7', color: '#D97706' },
  'Overdue':     { bg: '#FEE2E2', color: '#DC2626' },
  'Not Started': { bg: '#F3F4F6', color: '#6B7280' },
  'Planning':    { bg: '#EDE9FE', color: '#5B21B6' }
};

const pill = (label, map) => {
  const s = (map || {})[label] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  );
};

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects' | 'activity'

  const canEdit = hasPermission('clients', 'client_management', 'edit');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      apiFetch(`/clients/${id}`),
      apiFetch(`/clients/${id}/projects`),
      apiFetch(`/clients/${id}/activity`).catch(() => ({ success: false, data: [] }))
    ])
      .then(([clientRes, projectsRes, activityRes]) => {
        if (clientRes.success && clientRes.data) {
          setClient(clientRes.data);
        } else {
          addToast(clientRes.message || 'Failed to load client details', 'error');
          navigate('/clients/list');
        }

        if (projectsRes.success && projectsRes.data) {
          setProjects(projectsRes.data.projects || []);
        }

        if (activityRes.success && activityRes.data) {
          setActivities(activityRes.data || []);
        }
      })
      .catch(err => {
        addToast('Error loading client data', 'error');
        navigate('/clients/list');
      })
      .finally(() => setLoading(false));
  }, [id, addToast, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, color: '#64748B', fontSize: 14 }}>Loading client details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', minHeight: '100vh', background: '#F8FAFC', padding: '24px 28px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        <Link to="/clients/list" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Clients
        </Link>
        <ChevronRight size={14} color="#94A3B8" />
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{client.company_name}</span>
      </div>

      {/* Client Profile Header Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#EEF2FF',
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              flexShrink: 0
            }}>
              {getInitials(client.company_name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                  {client.company_name}
                </h1>
                {pill(client.client_type, TYPE_STYLE)}
                {pill(client.status, STATUS_STYLE)}
              </div>

              <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginTop: 4, fontFamily: 'monospace' }}>
                {client.client_code}
              </div>

              <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
                {client.email && <InfoChip icon={Mail} text={client.email} />}
                {client.phone && <InfoChip icon={Phone} text={client.phone} />}
                {client.project && <InfoChip icon={Briefcase} text={`Project: ${client.project}`} />}
                {client.website && <InfoChip icon={Globe} text={client.website} />}
                {client.city && <InfoChip icon={MapPin} text={[client.city, client.country].filter(Boolean).join(', ')} />}
                {client.industry && <InfoChip icon={Briefcase} text={client.industry} />}
              </div>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => navigate(`/clients/${client.id}/edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 12,
                border: '1.5px solid #6366F1',
                background: '#fff',
                color: '#6366F1',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#EEF2FF'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <Edit2 size={14} /> Edit Client
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginTop: 28, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'projects', label: `Projects (${projects.length})`, icon: Briefcase },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: active ? '#EEF2FF' : 'transparent',
                  color: active ? '#6366F1' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <DataBlock label="Project" value={client.project} />
              <DataBlock label="Contact Person" value={client.contact_person} />
              <DataBlock label="Designation" value={client.designation} />
              <DataBlock label="Email Address" value={client.email} />
              <DataBlock label="Phone Number" value={client.phone} />
              <DataBlock label="Alternate Phone" value={client.alternate_phone} />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>
              Company & Tax Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <DataBlock label="Industry" value={client.industry} />
              <DataBlock label="Company Size" value={client.company_size ? `${client.company_size} employees` : null} />
              <DataBlock label="Website" value={client.website} isLink={true} />
              <DataBlock label="GST / Tax ID" value={client.gst_number} />
              <DataBlock label="Address" value={client.address} />
              <DataBlock label="City" value={client.city} />
              <DataBlock label="State" value={client.state} />
              <DataBlock label="Country" value={client.country} />
              <DataBlock label="Postal Code" value={client.postal_code} />
            </div>
          </div>

          {client.notes && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', borderLeft: '4px solid #6366F1' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                Internal Notes
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: PROJECTS */}
      {activeTab === 'projects' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Projects for {client.company_name}
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>
                All enterprise projects linked to this client account
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
              <Briefcase size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No projects linked to this client yet.</p>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                When creating or editing a project, select {client.company_name} as the client.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #F1F5F9', background: '#FAFAFA' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B' }}>Project Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B' }}>Project Manager</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B' }}>Team</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B' }}>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{p.project_name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>{p.project_code}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>
                        {p.project_manager_name || 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} color="#94A3B8" /> {p.team_count ?? 0} members
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {pill(p.status, PROJECT_STATUS_STYLE)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatDate(p.start_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: ACTIVITY */}
      {activeTab === 'activity' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0' }}>
            Client Activity Timeline
          </h2>

          {activities.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                <CheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Client Account Created</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Record initialized under code {client.client_code} on {formatDate(client.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                  <Clock size={16} color="#6366F1" style={{ flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{act.action || 'Updated'}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{act.description}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{formatDate(act.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 500 }}>
      <Icon size={14} color="#94A3B8" /> {text}
    </div>
  );
}

function DataBlock({ label, value, isLink = false }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {isLink ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 14, fontWeight: 600, color: '#6366F1', marginTop: 4, display: 'inline-block', textDecoration: 'none' }}
        >
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 4 }}>
          {value}
        </div>
      )}
    </div>
  );
}
