import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  Phone, Mail, Globe, MapPin, Users, Briefcase, TrendingUp, AlertCircle,
  X, Check, Loader2
} from 'lucide-react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { hasPermission } from '../../lib/permissions';

/* ────────────────────────── constants ────────────────────────── */
const CLIENT_TYPES  = ['Prospect', 'Active', 'Inactive', 'Former'];
const STATUS_OPTS   = ['Active', 'Inactive', 'Blocked'];
const INDUSTRIES    = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Hospitality', 'Media', 'Logistics',
  'Consulting', 'Construction', 'Automotive', 'Telecommunications', 'Other'
];

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

const pill = (label, map) => {
  const s = (map || {})[label] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.02em'
    }}>{label}</span>
  );
};

const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const AVATAR_COLORS = [
  { bg: '#EEF2FF', c: '#4338CA' }, { bg: '#DCFCE7', c: '#065F46' },
  { bg: '#FEF3C7', c: '#92400E' }, { bg: '#FCE7F3', c: '#9D174D' },
  { bg: '#DBEAFE', c: '#1D4ED8' }, { bg: '#FEE2E2', c: '#991B1B' },
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ────────────────────────── summary card ────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9',
      display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 160
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{value ?? 0}</div>
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ────────────────────────── main component ────────────────────────── */
export default function AllClients() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [clients, setClients]       = useState([]);
  const [stats, setStats]           = useState({ total: 0, active: 0, prospect: 0, inactive: 0 });
  const [industries, setIndustries] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const limit = 10;
  const [loading, setLoading]       = useState(false);

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  // Permission checks
  const canCreate = hasPermission('clients', 'client_management', 'create');
  const canEdit   = hasPermission('clients', 'client_management', 'edit');
  const canDelete = hasPermission('clients', 'client_management', 'delete');

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, industryFilter]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/clients?page=${page}&limit=${limit}`;
      if (search)         url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter)     url += `&client_type=${encodeURIComponent(typeFilter)}`;
      if (statusFilter)   url += `&status=${encodeURIComponent(statusFilter)}`;
      if (industryFilter) url += `&industry=${encodeURIComponent(industryFilter)}`;

      const res = await apiFetch(url);
      if (res.success && res.data) {
        setClients(res.data.clients || []);
        setTotal(res.data.total || 0);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.industries) setIndustries(res.data.industries);
      } else {
        addToast(res.message || 'Failed to fetch clients', 'error');
      }
    } catch (err) {
      addToast('Error loading clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, industryFilter, addToast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/clients/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Client deleted successfully', 'success');
        setDeleteConfirmId(null);
        fetchClients();
      } else {
        addToast(res.message || 'Failed to delete client', 'error');
      }
    } catch {
      addToast('Error deleting client', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', minHeight: '100vh', background: '#F8FAFC', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Client Management</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Manage your business clients, contacts, and relationships</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/clients/add')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} /> Add Client
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon={Building2}  label="Total Clients"    value={stats.total}    color="#6366F1" bg="#EEF2FF" />
        <StatCard icon={Check}      label="Active Clients"   value={stats.active}   color="#16A34A" bg="#DCFCE7" />
        <StatCard icon={TrendingUp} label="Prospects"        value={stats.prospect} color="#D97706" bg="#FEF3C7" />
        <StatCard icon={AlertCircle} label="Inactive / Blocked" value={stats.inactive} color="#DC2626" bg="#FEE2E2" />
      </div>

      {/* Filters row */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search clients by name, contact, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 14, height: 40,
              border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13,
              outline: 'none', background: '#F8FAFC', boxSizing: 'border-box', color: '#1E293B'
            }}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <AppDropdown
            options={CLIENT_TYPES}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            allOption="All Types"
            allOptionValue=""
            size="sm"
          />
        </div>

        <div style={{ minWidth: 140 }}>
          <AppDropdown
            options={STATUS_OPTS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
            allOption="All Status"
            allOptionValue=""
            size="sm"
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <AppDropdown
            options={industries.length > 0 ? industries : INDUSTRIES}
            value={industryFilter}
            onChange={setIndustryFilter}
            placeholder="All Industries"
            allOption="All Industries"
            allOptionValue=""
            size="sm"
          />
        </div>

        {(search || typeFilter || statusFilter || industryFilter) && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setIndustryFilter(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748B', fontWeight: 600 }}
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #F1F5F9', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            {total > 0 ? `${total} Client${total !== 1 ? 's' : ''}` : 'No Clients Found'}
          </span>
          {loading && <Loader2 size={16} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Client', 'Contact Person', 'Industry', 'Type', 'Status', 'Projects', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center' }}>
                    <Loader2 size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#64748B', marginTop: 12, fontSize: 14 }}>Loading clients...</p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 64, textAlign: 'center' }}>
                    <Building2 size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
                    <p style={{ color: '#64748B', fontSize: 15, fontWeight: 600, margin: 0 }}>No clients found</p>
                    <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 6 }}>
                      {canCreate ? 'Click "+ Add Client" to create your first client.' : 'No clients match your filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : clients.map((c) => {
                const av = avatarColor(c.id);
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderTop: '1px solid #F8FAFC',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Client name + code */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: av.bg, color: av.c,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, flexShrink: 0
                        }}>
                          {initials(c.company_name)}
                        </div>
                        <div>
                          <div
                            style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
                            onClick={() => navigate(`/clients/${c.id}`)}
                          >
                            {c.company_name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, fontFamily: 'monospace' }}>
                              {c.client_code}
                            </span>
                            {c.project && (
                              <span style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>
                                {c.project}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{c.contact_person || '—'}</div>
                      {c.email && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{c.email}</div>}
                      {c.phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.phone}</div>}
                    </td>

                    {/* Industry */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{c.industry || '—'}</span>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '14px 16px' }}>{pill(c.client_type, TYPE_STYLE)}</td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>{pill(c.status, STATUS_STYLE)}</td>

                    {/* Projects count */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', cursor: 'pointer' }}
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        {c.project_count ?? 0} {c.project_count === 1 ? 'project' : 'projects'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <ActionBtn
                          icon={Eye}
                          title="View Details"
                          color="#6366F1"
                          bg="#EEF2FF"
                          onClick={() => navigate(`/clients/${c.id}`)}
                        />
                        {canEdit && (
                          <ActionBtn
                            icon={Edit2}
                            title="Edit"
                            color="#0EA5E9"
                            bg="#E0F2FE"
                            onClick={() => navigate(`/clients/${c.id}/edit`)}
                          />
                        )}
                        {canDelete && (
                          <ActionBtn
                            icon={Trash2}
                            title="Delete"
                            color="#EF4444"
                            bg="#FEE2E2"
                            onClick={() => setDeleteConfirmId(c.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
          }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} clients
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1
                }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: p === page ? 'none' : '1px solid #E2E8F0',
                    background: p === page ? '#6366F1' : '#fff',
                    color: p === page ? '#fff' : '#475569',
                    fontSize: 13, fontWeight: p === page ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.4 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #F1F5F9'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', marginBottom: 16 }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Delete Client?</h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
              Are you sure you want to delete this client? Linked projects will have their client association unassigned. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 10, border: 'none',
                  background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color, bg, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none',
        background: bg, color: color, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Icon size={14} />
    </button>
  );
}
