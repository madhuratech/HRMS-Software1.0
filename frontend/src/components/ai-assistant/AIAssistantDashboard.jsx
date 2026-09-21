import React, { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '../../lib/api';
import { AIResponseRenderer } from './AIResponseRenderer';

// ─── Inline SVG Icons (exact sizing from spec) ───────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SparkleIcon = ({ color = '#8A98B0', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
  </svg>
);
const ChatIcon = ({ color = '#8A98B0', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const UserIcon = ({ color = '#3B82F6', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const CalendarIcon = ({ color = '#10B981', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = ({ color = '#F59E0B', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const FileIcon = ({ color = '#8B5CF6', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const MicIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const ThumbUpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);
const ThumbDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const CheckIcon = ({ color = '#20B879', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const AbsentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const AttendanceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" />
  </svg>
);
const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const StatsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// ─── AI Robot Avatar (exact visual from reference) ─────────────────────────
const AIAvatar = ({ size = 96 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 0 6px #f0edff, 0 4px 20px rgba(104,71,245,0.15)',
    flexShrink: 0, overflow: 'hidden'
  }}>
    <img
      src="/uploads/bot-avatar.png"
      alt="AI Assistant"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

// ─── Small AI Avatar for chat ──────────────────────────────────────────────
const SmallAIAvatar = () => (
  <div style={{
    width: 34, height: 34, borderRadius: '50%',
    background: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #ddd6ff', flexShrink: 0, overflow: 'hidden'
  }}>
    <img
      src="/uploads/bot-avatar.png"
      alt="AI Assistant Small"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);
// ─── Employee List Rich Card ─────────────────────────────────────────────────
function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function EmployeeAvatar({ name }) {
  const initials = getInitials(name);
  const colors = [
    ['#6847F5', '#9B87F7'],
    ['#3B82F6', '#60A5FA'],
    ['#10B981', '#34D399'],
    ['#F59E0B', '#FCD34D'],
    ['#EC4899', '#F9A8D4'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [from, to] = colors[idx];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: 12,
      letterSpacing: 0.5
    }}>
      {initials}
    </div>
  );
}

function StatusPill({ status }) {
  const active = (status || '').toLowerCase() === 'active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: active ? '#EDFBF4' : '#FEF3F2',
      color: active ? '#15803D' : '#B91C1C',
      border: `1px solid ${active ? '#BBF7D0' : '#FECACA'}`,
      borderRadius: 20, fontSize: 9, fontWeight: 600,
      padding: '2px 8px', letterSpacing: 0.2
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: active ? '#22C55E' : '#EF4444',
        display: 'inline-block', flexShrink: 0
      }} />
      {status || 'Unknown'}
    </span>
  );
}

function EmployeeListCard({ employees = [], time }) {
  const activeCount = employees.filter(e => (e.status || '').toLowerCase() === 'active').length;

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E8EAF2',
    borderRadius: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 680,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <div style={cardStyle}>
      <div style={{ padding: '14px 16px 0' }}>
        {/* Intro text */}
        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#17213A', marginBottom: 12 }}>
          Here is the list of active employees.
        </p>

        {/* Active Employees header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: '#EEE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#17213A', lineHeight: 1.4 }}>Active Employees</p>
              <p style={{ fontSize: 10, color: '#71809C', lineHeight: 1.4 }}>{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span style={{
            background: '#EDFBF4', color: '#15803D',
            border: '1px solid #BBF7D0',
            borderRadius: 20, fontSize: 10, fontWeight: 600,
            padding: '3px 10px', flexShrink: 0
          }}>
            {activeCount} Active
          </span>
        </div>

        {/* Employee cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))`,
          gap: 8, marginBottom: 14
        }}>
          {employees.map((emp, i) => (
            <div key={i} style={{
              background: '#FAFAFF', border: '1px solid #E8EAF2',
              borderRadius: 10, padding: '10px 12px',
            }}>
              {/* Header: avatar + name/role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <EmployeeAvatar name={emp.name || ''} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#17213A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emp.name}
                  </p>
                  {emp.role && (
                    <p style={{ fontSize: 9.5, color: '#6847F5', fontWeight: 500 }}>{emp.role}</p>
                  )}
                </div>
              </div>
              {/* Email */}
              {emp.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span style={{ fontSize: 9.5, color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {emp.email}
                  </span>
                </div>
              )}
              {/* Phone */}
              {emp.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.34 2 2 0 0 1 3.62 1.12h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.82-.82a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span style={{ fontSize: 9.5, color: '#4B5563' }}>+{String(emp.phone).replace(/^\+/, '')}</span>
                </div>
              )}
              {/* Status */}
              <StatusPill status={emp.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F0F0F7', margin: '0 0 12px' }} />

      {/* Table section */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#17213A' }}>Employee List (Table View)</span>
        </div>

        <div style={{ border: '1px solid #E8EAF2', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
              <thead>
                <tr style={{ background: '#F4F2FF' }}>
                  {['#', 'Employee Name', 'Email', 'Phone', 'Role', 'Status'].map(col => (
                    <th key={col} style={{
                      padding: '7px 10px', textAlign: 'left',
                      fontWeight: 700, color: '#17213A', fontSize: 9.5,
                      borderBottom: '1px solid #E8EAF2', whiteSpace: 'nowrap'
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={i} style={{ background: '#FFFFFF', borderBottom: i < employees.length - 1 ? '1px solid #F0F0F7' : 'none' }}>
                    <td style={{ padding: '7px 10px', color: '#71809C', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: '7px 10px', color: '#17213A', fontWeight: 600, whiteSpace: 'nowrap' }}>{emp.name}</td>
                    <td style={{ padding: '7px 10px', color: '#4B5563', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</td>
                    <td style={{ padding: '7px 10px', color: '#4B5563', whiteSpace: 'nowrap' }}>{emp.phone ? `+${String(emp.phone).replace(/^\+/, '')}` : '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#4B5563', whiteSpace: 'nowrap' }}>{emp.role || '—'}</td>
                    <td style={{ padding: '7px 10px' }}><StatusPill status={emp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px 10px', borderTop: '1px solid #F0F0F7'
      }}>
        <span style={{ fontSize: 9, color: '#8A98B0' }}>{time}</span>
        <span style={{ fontSize: 9, color: '#8A98B0', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Source: HRMS Database
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AIAssistantDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [conversations, setConversations] = useState([]);
  const [contextSuggestions, setContextSuggestions] = useState([]);
  const [availableModules, setAvailableModules] = useState({
    employees: true, attendance: true, leaves: true, holidays: true, departments: true, payroll: false, performance: false, recruitment: false, hr_policies: true
  });
  const [permissions, setPermissions] = useState({ payroll: false, salary: false });
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/ai/conversations', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          setConversations(data.conversations);
        }
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/ai/modules', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.modules) setAvailableModules(data.modules);
          if (data.permissions) setPermissions(data.permissions);
        }
      }
    } catch (e) {
      console.error("Error fetching modules:", e);
    }
  };

  const deleteChat = async (convId) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      const response = await fetch(`/api/ai/conversations/${convId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        if (activeChat === convId) {
          setMessages([]);
          setActiveChat(null);
          setConversationId(crypto.randomUUID());
        }
        fetchConversations();
      }
    } catch (e) {
      console.error("Error deleting conversation:", e);
    }
  };

  const clearAllChats = async () => {
    if (!window.confirm("Are you sure you want to clear all conversations?")) return;
    try {
      const response = await fetch(`/api/ai/conversations`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        setMessages([]);
        setActiveChat(null);
        setConversationId(crypto.randomUUID());
        fetchConversations();
      }
    } catch (e) {
      console.error("Error clearing all conversations:", e);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchModules();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, directQuery = '') => {
    e?.preventDefault();
    const query = (directQuery || inputVal).trim();
    if (!query || loading) return;

    // 1. Add user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: timestamp };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // 2. Add temporary "AI Thinking..." step message
    const stepId = Date.now() + 1;
    setMessages(prev => [...prev, { id: stepId, sender: 'ai', isStep: true, text: "AI Thinking...", time: timestamp }]);

    try {
      // 3. Make real API request
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ message: query, conversationId })
      });

      if (!response.ok) {
        let errMsg = 'API request failed';
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch (e) { }
        throw new Error(errMsg);
      }

      const data = await response.json();

      // Remove the step message and add the real response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== stepId);
        const aiMsg = {
          id: Date.now() + 2,
          sender: 'ai',
          text: data.message || "No response received.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hasTool: !!data.toolUsed,
          toolData: data.toolUsed,
          structuredData: data.structuredData || null,
          suggestions: data.suggestions || []
        };
        return [...filtered, aiMsg];
      });

      // Update contextual follow-up suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setContextSuggestions(data.suggestions);
      }

      // Reload conversations list
      fetchConversations();

    } catch (error) {
      console.error("AI Assistant API Error:", error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== stepId);
        return [...filtered, {
          id: Date.now() + 2,
          sender: 'ai',
          text: `Error: ${error.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    } finally {
      setLoading(false);
    }
  };

  const chatsList = conversations.map(c => ({
    id: c.conversation_id,
    conversation_id: c.conversation_id,
    title: c.title || "AI Conversation",
    preview: "Click to load history...",
    time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    section: 'Today'
  }));

  if (chatsList.length === 0) {
    chatsList.push(
      { id: 1, title: 'Employee leave balance', preview: 'How many leave days do John...', time: '10:30 AM', section: 'Today' },
      { id: 2, title: 'Attendance report', preview: "Show me today's attendance...", time: '09:15 AM', section: 'Today' },
      { id: 3, title: 'Payroll summary', preview: 'Generate payroll summary...', time: '08:45 AM', section: 'Today' },
      { id: 4, title: 'HR policies', preview: 'What is the maternity leave policy?', time: '08:30 AM', section: 'Today' },
      { id: 5, title: 'Team performance', preview: 'Show performance of sales team...', time: 'Yesterday', section: 'Yesterday' },
      { id: 6, title: 'Employee directory', preview: 'List all employees in IT department...', time: 'Yesterday', section: 'Yesterday' },
      { id: 7, title: 'Recruitment status', preview: 'How many positions are open?', time: 'Yesterday', section: 'Yesterday' }
    );
  }

  const filtered = chatsList.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const todayChats = filtered.filter(c => c.section === 'Today');
  const yesterdayChats = filtered.filter(c => c.section === 'Yesterday');

  const loadChat = async (chat) => {
    if (!chat.conversation_id) {
      // It's a static template chat
      setActiveChat(chat.id);
      setMessages([]);
      if (chat.id === 1) {
        setInputVal("How many leave days does John have left?");
      } else if (chat.id === 2) {
        setInputVal("Show today's attendance summary.");
      } else if (chat.id === 3) {
        setInputVal("Show me the payroll summary.");
      } else if (chat.id === 4) {
        setInputVal("What is the maternity leave policy?");
      } else {
        setInputVal(chat.preview);
      }
      return;
    }

    setActiveChat(chat.conversation_id);
    setConversationId(chat.conversation_id);
    setMessages([]);
    setLoading(true);

    try {
      const response = await fetch(`/api/ai/conversations/${chat.conversation_id}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const loaded = [];
          for (let i = 0; i < data.messages.length; i++) {
            const msg = data.messages[i];
            if (msg.role === 'user') {
              loaded.push({
                id: i,
                sender: 'user',
                text: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            } else if (msg.role === 'assistant') {
              const nextMsg = data.messages[i + 1];
              const hasTool = nextMsg && nextMsg.role === 'tool';
              
              if (hasTool) {
                let finalText = "Query executed successfully.";
                for (let j = i + 2; j < data.messages.length; j++) {
                  if (data.messages[j].role === 'assistant' && !data.messages[j].tool_call_id) {
                    finalText = data.messages[j].content;
                    data.messages[j].skip = true;
                    break;
                  }
                }
                
                let toolData = null;
                let structuredData = null;
                try {
                  const parsed = JSON.parse(nextMsg.content);
                  toolData = {
                    name: nextMsg.tool_name === 'get_employees' ? "Employee List Tool" :
                      nextMsg.tool_name === 'get_employee_count' ? "Employee Count Tool" :
                        nextMsg.tool_name === 'get_employee' ? "Employee Detail Tool" :
                          nextMsg.tool_name === 'search_employee' ? "Employee Search Tool" :
                            nextMsg.tool_name === 'get_attendance' ? "Attendance Tool" :
                              nextMsg.tool_name === 'get_employee_attendance' ? "Attendance Detail Tool" :
                                nextMsg.tool_name === 'get_leave_balance' ? "Leave Balance Tool" :
                                  nextMsg.tool_name === 'get_leave_requests' ? "Leave Request Tool" :
                                    nextMsg.tool_name === 'get_departments' ? "Department Tool" : nextMsg.tool_name,
                    status: parsed.error ? "Failed" : "Success",
                    description: parsed.error ? `Failed to query: ${parsed.error}` : `Query executed successfully.`
                  };

                  const toolName = nextMsg.tool_name;
                  if (!parsed.error) {
                    if (toolName === 'get_employees') {
                      structuredData = { type: 'employee_list', employees: parsed };
                    } else if (toolName === 'get_employee') {
                      structuredData = { type: 'employee_profile', employee: parsed };
                    } else if (toolName === 'search_employee' || toolName === 'get_employee_count') {
                      if (Array.isArray(parsed) && parsed.length === 1) {
                        structuredData = { type: 'employee_profile', employee: parsed[0] };
                      } else if (Array.isArray(parsed) && parsed.length > 1) {
                        structuredData = { type: 'employee_list', employees: parsed };
                      }
                    } else if (toolName === 'get_attendance') {
                      structuredData = { type: 'attendance_summary', attendance: parsed };
                    } else if (toolName === 'get_employee_attendance') {
                      structuredData = { type: 'employee_attendance', attendance: parsed };
                    } else if (toolName === 'get_leave_balance') {
                      structuredData = { type: 'leave_balance', balances: parsed };
                    } else if (toolName === 'get_leave_requests') {
                      structuredData = { type: 'leave_request_list', requests: parsed };
                    } else if (toolName === 'get_departments') {
                      structuredData = { type: 'department_list', departments: parsed };
                    } else if (toolName === 'get_department_employees') {
                      structuredData = { type: 'department_employees', employees: parsed };
                    } else if (toolName === 'get_designations') {
                      structuredData = { type: 'designation_list', designations: parsed };
                    } else if (toolName === 'get_holidays') {
                      structuredData = { type: 'holiday_list', holidays: Array.isArray(parsed) ? parsed : (parsed.holidays || []) };
                    } else if (toolName === 'get_payroll_summary') {
                      structuredData = { type: 'payroll_summary', summary: parsed };
                    } else if (toolName === 'get_employee_payroll') {
                      structuredData = { type: 'employee_payroll', payroll: parsed };
                    } else if (toolName === 'get_job_positions') {
                      structuredData = { type: 'job_positions', positions: parsed };
                    } else if (toolName === 'get_candidates') {
                      structuredData = { type: 'candidates', candidates: parsed };
                    } else if (toolName === 'get_interview_schedules') {
                      structuredData = { type: 'interview_schedules', schedules: parsed };
                    } else if (toolName === 'get_company_profile') {
                      structuredData = { type: 'company_profile', profile: parsed };
                    } else if (toolName === 'get_projects') {
                      structuredData = { type: 'projects', projects: parsed };
                    } else if (toolName === 'get_tasks') {
                      structuredData = { type: 'tasks', tasks: parsed };
                    } else if (toolName === 'get_support_tickets') {
                      structuredData = { type: 'support_tickets', tickets: parsed };
                    }
                  }
                } catch (e) {
                  toolData = {
                    name: nextMsg.tool_name,
                    status: "Success",
                    description: "Query executed successfully."
                  };
                }

                loaded.push({
                  id: i,
                  sender: 'ai',
                  text: finalText,
                  time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  hasTool,
                  toolData,
                  structuredData
                });
              } else if (!msg.skip) {
                loaded.push({
                  id: i,
                  sender: 'ai',
                  text: msg.content,
                  time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
            }
          }
          setMessages(loaded);
        }
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Styles (inline for precision) ─────────────────────────────────────
  const styles = {
    root: {
      display: 'flex', width: '100%', height: '100%',
      background: '#FBFAFF', overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    // LEFT PANEL
    sidebar: {
      width: 335, minWidth: 335, background: '#FFFFFF',
      borderRight: '1px solid #E8EAF2',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    },
    sidebarTop: { padding: '18px 18px 12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    sidebarHeading: { fontSize: 15, fontWeight: 600, color: '#17213A', margin: 0, letterSpacing: '-0.01em' },
    newChatBtn: {
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '0 12px', height: 34, minWidth: 100,
      background: '#6847F5', borderRadius: 7, border: 'none', cursor: 'pointer',
      color: '#fff', fontSize: 12, fontWeight: 500,
      boxShadow: '0 2px 8px rgba(104,71,245,0.25)',
      fontFamily: 'inherit', transition: 'background 0.15s',
    },
    searchWrap: { padding: '0 18px 14px', flexShrink: 0 },
    searchBox: {
      width: '100%', height: 40,
      border: '1px solid #E1E3EC', borderRadius: 9,
      background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
      boxSizing: 'border-box',
    },
    searchInput: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontSize: 12, color: '#17213A', fontFamily: 'inherit',
    },
    chatList: { flex: 1, overflowY: 'auto', padding: '0 10px' },
    sectionLabel: {
      fontSize: 11, fontWeight: 600, color: '#6847F5',
      padding: '8px 8px 4px', textTransform: 'none', display: 'block',
    },
    chatItem: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 10px', borderRadius: 9, cursor: 'pointer',
      background: isActive ? '#EEE9FF' : 'transparent',
      border: 'none', width: '100%', textAlign: 'left',
      marginBottom: 2, transition: 'background 0.12s',
    }),
    chatIconWrap: (isActive) => ({
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isActive ? '#ffffff' : '#F4F4F8',
    }),
    chatItemRight: { flex: 1, minWidth: 0 },
    chatItemTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    chatItemTitle: { fontSize: 13, fontWeight: 600, color: '#17213A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
    chatItemTime: { fontSize: 10, color: '#71809C', flexShrink: 0, marginLeft: 6 },
    chatItemPreview: { fontSize: 11, color: '#71809C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    viewAllWrap: { padding: '12px 18px', borderTop: '1px solid #E8EAF2', flexShrink: 0 },
    viewAllBtn: {
      width: '100%', height: 40, border: '1px solid #E1E3EC',
      borderRadius: 9, background: '#FFFFFF', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontSize: 12, fontWeight: 600, color: '#17213A', fontFamily: 'inherit',
      transition: 'background 0.12s',
    },

    chatHeader: {
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: '1px solid #E8EAF2', background: '#FFFFFF', flexShrink: 0
    },
    chatHeaderTitle: { fontSize: 14, fontWeight: 600, color: '#17213A' },
    clearChatBtn: {
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2',
      color: '#EF4444', fontSize: 12, fontWeight: 500, cursor: 'pointer',
      transition: 'background 0.12s', fontFamily: 'inherit'
    },

    // MAIN CHAT
    main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#FBFAFF' },
    messageArea: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 },

    // WELCOME CARD
    welcomeCard: {
      background: '#FFFFFF', border: '1px solid #F0F0F5', borderRadius: 14,
      padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start',
      boxShadow: '0 2px 12px rgba(90,70,180,0.04)', flexShrink: 0,
    },
    welcomeText: { flex: 1 },
    greeting: { fontSize: 22, fontWeight: 700, color: '#17213A', margin: '0 0 6px', lineHeight: 1.2 },
    greetingSub: { fontSize: 13, color: '#71809C', margin: 0, lineHeight: '20px', fontWeight: 400 },
    quickCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 },
    quickCard: (bg) => ({
      background: bg, border: '1px solid #E8EAF2', borderRadius: 10,
      padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
      transition: 'box-shadow 0.12s', fontFamily: 'inherit',
    }),
    quickCardIconWrap: {
      width: 28, height: 28, borderRadius: 7, background: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 10,
    },
    quickCardTitle: { fontSize: 12, fontWeight: 600, color: '#17213A', margin: '0 0 4px', display: 'block' },
    quickCardDesc: { fontSize: 11, color: '#71809C', margin: 0, lineHeight: '15px' },

    // USER MESSAGE
    userMsgRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 10 },
    userBubble: {
      background: '#F0EBFF', border: '1px solid #E5DEFF', borderRadius: 15,
      borderBottomRightRadius: 4, padding: '12px 14px',
      maxWidth: 340, minWidth: 200,
    },
    userMsgText: { fontSize: 12, color: '#17213A', margin: '0 0 6px', lineHeight: '18px' },
    userMsgMeta: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 9, color: '#71809C' },
    userAvatar: {
      width: 38, height: 38, borderRadius: '50%', objectFit: 'cover',
      border: '2px solid #E8EAF2', flexShrink: 0,
    },

    // AI MESSAGE
    aiMsgRow: { display: 'flex', alignItems: 'flex-start', gap: 12 },
    aiBubble: {
      background: '#FFFFFF', border: '1px solid #E8EAF2', borderRadius: 10,
      borderTopLeftRadius: 4, padding: '12px 14px',
      maxWidth: 320,
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    },
    aiStepText: { fontSize: 11, color: '#71809C', margin: 0, display: 'flex', alignItems: 'center', gap: 6 },
    aiMsgText: { fontSize: 12, fontWeight: 500, color: '#17213A', margin: '0 0 6px', lineHeight: '18px' },
    aiMsgTime: { fontSize: 9, color: '#8A98B0', margin: 0 },

    // TOOL CARD
    toolCard: {
      background: '#FFFFFF', border: '1px solid #E8EAF2', borderRadius: 10,
      maxWidth: 420, overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
    },
    toolCardTop: { padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    toolIconWrap: {
      width: 30, height: 30, borderRadius: 8, background: '#EDFBF4',
      border: '1px solid #c3f0dc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    toolInfo: { flex: 1, marginLeft: 10 },
    toolNameRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
    toolName: { fontSize: 11, fontWeight: 600, color: '#17213A' },
    toolBadge: { fontSize: 10, color: '#20B879', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 },
    toolDesc: { fontSize: 10, color: '#71809C', margin: 0 },
    toolViewDetails: { fontSize: 11, color: '#6847F5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', flexShrink: 0 },
    toolDivider: { height: 1, background: '#F0F0F5' },
    toolActions: { padding: '10px 14px', display: 'flex', gap: 14 },
    toolActionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#8A98B0' },

    // SUGGESTION PILLS
    pillsRow: { display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 32px 12px' },
    pill: {
      display: 'flex', alignItems: 'center', gap: 6, height: 34,
      padding: '0 14px', background: '#FFFFFF', border: '1px solid #E5E6EF',
      borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 500,
      color: '#17213A', fontFamily: 'inherit', transition: 'border-color 0.12s, box-shadow 0.12s',
    },

    // CHAT INPUT
    inputWrap: { padding: '0 32px 10px', flexShrink: 0 },
    inputBox: {
      display: 'flex', alignItems: 'center', gap: 8,
      height: 54, background: '#FFFFFF',
      border: '1px solid #DCD6FF', borderRadius: 15,
      padding: '0 10px 0 14px',
      boxShadow: '0 0 0 3px rgba(104,71,245,0.06)',
    },
    chatInput: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontSize: 16, color: '#17213A', fontFamily: 'inherit',
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 12,
      background: '#6847F5', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(104,71,245,0.3)',
    },
    footer: { textAlign: 'center', fontSize: 9, color: '#8A98B0', padding: '4px 32px 12px' },
  };

  return (
    <div style={styles.root}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
      <aside style={styles.sidebar}>

        {/* Header row */}
        <div style={styles.sidebarTop}>
          <p style={styles.sidebarHeading}>Conversations</p>
          <button style={styles.newChatBtn} onClick={() => { setMessages([]); setActiveChat(null); setConversationId(crypto.randomUUID()); }}>
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
            New Chat
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <div style={styles.searchBox}>
            <SearchIcon />
            <input
              style={styles.searchInput}
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <SparkleIcon color="#8A98B0" size={14} />
          </div>
        </div>

        {/* Chat list */}
        <div style={styles.chatList}>
          {/* Today */}
          {todayChats.length > 0 && (
            <>
              <span style={styles.sectionLabel}>Today</span>
              {todayChats.map(chat => (
                <div 
                  key={chat.id} 
                  style={{ ...styles.chatItem(activeChat === chat.id), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                  onClick={() => loadChat(chat)}
                  role="button"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={styles.chatIconWrap(activeChat === chat.id)}>
                      <ChatIcon color={activeChat === chat.id ? '#6847F5' : '#8A98B0'} size={15} />
                    </div>
                    <div style={styles.chatItemRight}>
                      <div style={styles.chatItemTopRow}>
                        <span style={styles.chatItemTitle}>{chat.title}</span>
                        <span style={styles.chatItemTime}>{chat.time}</span>
                      </div>
                      <div style={styles.chatItemPreview}>{chat.preview}</div>
                    </div>
                  </div>
                  {chat.conversation_id && (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#EF4444',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.12s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.conversation_id);
                      }}
                      title="Delete Conversation"
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.7}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Yesterday */}
          {yesterdayChats.length > 0 && (
            <>
              <span style={{ ...styles.sectionLabel, marginTop: 12, display: 'block' }}>Yesterday</span>
              {yesterdayChats.map(chat => (
                <div 
                  key={chat.id} 
                  style={{ ...styles.chatItem(activeChat === chat.id), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                  onClick={() => loadChat(chat)}
                  role="button"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={styles.chatIconWrap(activeChat === chat.id)}>
                      <ChatIcon color={activeChat === chat.id ? '#6847F5' : '#8A98B0'} size={15} />
                    </div>
                    <div style={styles.chatItemRight}>
                      <div style={styles.chatItemTopRow}>
                        <span style={styles.chatItemTitle}>{chat.title}</span>
                        <span style={styles.chatItemTime}>{chat.time}</span>
                      </div>
                      <div style={styles.chatItemPreview}>{chat.preview}</div>
                    </div>
                  </div>
                  {chat.conversation_id && (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#EF4444',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.12s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.conversation_id);
                      }}
                      title="Delete Conversation"
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.7}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* View all */}
        <div style={styles.viewAllWrap}>
          <button style={styles.viewAllBtn} onClick={() => setSearchQuery("")}>
            <ListIcon />
            View all conversations
          </button>
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ──────────────────────────────────────────── */}
      <main style={styles.main}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <span style={styles.chatHeaderTitle}>
            {activeChat && typeof activeChat === 'string'
              ? (conversations.find(c => c.conversation_id === activeChat)?.title || "Active Chat")
              : "New Conversation"}
          </span>
          <button 
            style={styles.clearChatBtn}
            onClick={() => {
              if (activeChat && typeof activeChat === 'string') {
                deleteChat(activeChat);
              } else {
                setMessages([]);
              }
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Clear Conversation
          </button>
        </div>

        {/* Scrollable message + welcome area */}
        <div style={styles.messageArea}>

          {/* Welcome Card */}
          <div style={styles.welcomeCard}>
            <AIAvatar size={96} />
            <div style={styles.welcomeText}>
              <p style={styles.greeting}>Hello, Admin! 👋</p>
              <p style={styles.greetingSub}>
                I'm your AI HR Assistant. I can help you with employees, attendance,<br />
                leave management, payroll, HR policies and more.
              </p>
              {/* Quick Action Cards */}
              <div style={styles.quickCards}>
                {[
                  { label: 'Employee Info', desc: 'Get employee details quickly', bg: '#F0F8FF', Icon: UserIcon, iconColor: '#3B82F6', q: 'Show me employee details' },
                  { label: 'Leave Balance', desc: 'Check leave balance', bg: '#F1FBF7', Icon: CalendarIcon, iconColor: '#10B981', q: 'Check leave balance' },
                  { label: 'Attendance', desc: 'View attendance reports', bg: '#FFF8EE', Icon: ClockIcon, iconColor: '#F59E0B', q: "Show today's attendance" },
                  { label: 'HR Policies', desc: 'Ask about company policies', bg: '#F7F3FF', Icon: FileIcon, iconColor: '#8B5CF6', q: 'What are the HR policies?' },
                ].map((card, i) => (
                  <button key={i} style={styles.quickCard(card.bg)} onClick={() => setInputVal(card.q)}>
                    <div style={styles.quickCardIconWrap}>
                      <card.Icon color={card.iconColor} size={15} />
                    </div>
                    <span style={styles.quickCardTitle}>{card.label}</span>
                    <p style={styles.quickCardDesc}>{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.sender === 'user' && (
                <div style={styles.userMsgRow}>
                  <div style={styles.userBubble}>
                    <p style={styles.userMsgText}>{msg.text}</p>
                    <div style={styles.userMsgMeta}>
                      <span>{msg.time}</span>
                      <CheckIcon color="#71809C" size={11} />
                    </div>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
                    alt="User"
                    style={styles.userAvatar}
                  />
                </div>
              )}

              {msg.sender === 'ai' && (
                <div style={styles.aiMsgRow}>
                  <SmallAIAvatar />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {msg.isStep ? (
                      <div style={{
                        ...styles.aiBubble,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 15px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px 12px 12px 2px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        <style>{`
                          @keyframes aiPulseDot {
                            0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
                            40% { transform: scale(1.15); opacity: 1; }
                          }
                        `}</style>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: 'linear-gradient(135deg, #6847F5 0%, #8B5CF6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(104,71,245,0.25)',
                          flexShrink: 0
                        }}>
                          <SparkleIcon color="#FFFFFF" size={13} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#17213A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {msg.text || "AI Thinking..."}
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#6847F5',
                            display: 'inline-block',
                            animation: 'aiPulseDot 1.4s infinite ease-in-out both'
                          }} />
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#6847F5',
                            display: 'inline-block',
                            animation: 'aiPulseDot 1.4s infinite ease-in-out both',
                            animationDelay: '0.2s'
                          }} />
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#6847F5',
                            display: 'inline-block',
                            animation: 'aiPulseDot 1.4s infinite ease-in-out both',
                            animationDelay: '0.4s'
                          }} />
                        </div>
                      </div>
                    ) : msg.structuredData ? (
                      <AIResponseRenderer data={msg.structuredData} text={msg.text} time={msg.time} />
                    ) : (
                      <div style={styles.aiBubble}>
                        <p style={styles.aiMsgText}>{msg.text}</p>
                        <p style={styles.aiMsgTime}>{msg.time}</p>
                      </div>
                    )}

                    {/* Tool card — only show for non-employee-list structured responses */}
                    {msg.hasTool && msg.toolData && !msg.structuredData && (
                      <div style={{ ...styles.toolCard, marginTop: 10 }}>
                        <div style={styles.toolCardTop}>
                          <div style={styles.toolIconWrap}>
                            <CheckIcon color="#20B879" size={14} />
                          </div>
                          <div style={styles.toolInfo}>
                            <div style={styles.toolNameRow}>
                              <span style={styles.toolName}>{msg.toolData.name}</span>
                              <span style={styles.toolBadge}>
                                <CheckIcon color="#20B879" size={10} />
                                {msg.toolData.status}
                              </span>
                            </div>
                            <p style={styles.toolDesc}>{msg.toolData.description}</p>
                          </div>
                          <button style={styles.toolViewDetails}>
                            View details <ExternalLinkIcon />
                          </button>
                        </div>
                        <div style={styles.toolDivider} />
                        <div style={styles.toolActions}>
                          <button style={styles.toolActionBtn}><ThumbUpIcon /></button>
                          <button style={styles.toolActionBtn}><ThumbDownIcon /></button>
                          <button style={styles.toolActionBtn}><CopyIcon /></button>
                          <button style={styles.toolActionBtn}><ShareIcon /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion pills — dynamic based on last AI response */}
        <div style={styles.pillsRow}>
          {(contextSuggestions.length > 0 ? contextSuggestions.map(s => ({ label: s, Icon: AbsentIcon })) : [
            { label: 'Show employee list', Icon: AbsentIcon },
            { label: 'Attendance summary', Icon: AttendanceIcon },
            { label: 'Export report', Icon: ExportIcon },
            { label: 'View monthly stats', Icon: StatsIcon },
          ]).map((pill, i) => (
            <button key={i} style={styles.pill} onClick={() => setInputVal(pill.label)}>
              <pill.Icon />
              {pill.label}
            </button>
          ))}
        </div>

        {/* Input composer */}
        <div style={styles.inputWrap}>
          <form onSubmit={handleSend} style={{ margin: 0 }}>
            <div style={styles.inputBox}>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 }}>
                <PaperclipIcon />
              </button>
              <input
                style={styles.chatInput}
                placeholder="Ask anything about your HRMS..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
              />
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0 4px', flexShrink: 0 }}>
                <MicIcon />
              </button>
              <button type="submit" style={styles.sendBtn}>
                <SendIcon />
              </button>
            </div>
          </form>
        </div>

        {/* Disclaimer */}
        <p style={styles.footer}>AI can make mistakes. Please verify important information.</p>

      </main>
    </div>
  );
}
