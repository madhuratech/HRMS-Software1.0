import React from 'react';

// ─── Shared Design Tokens ─────────────────────────────────────────────────────
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const CARD = {
  background: '#FFFFFF', border: '1px solid #E8EAF2', borderRadius: 12,
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
  width: '100%', maxWidth: 700, fontFamily: FONT,
};

// ─── Shared Sub-components ────────────────────────────────────────────────────
function getInitials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}
function avatarColor(name) {
  const colors = [['#6847F5','#9B87F7'],['#3B82F6','#60A5FA'],['#10B981','#34D399'],['#F59E0B','#FCD34D'],['#EC4899','#F9A8D4']];
  const idx = ((name || '').charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}
function Avatar({ name, size = 34 }) {
  const [from, to] = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${from},${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.35), letterSpacing: 0.5 }}>
      {getInitials(name)}
    </div>
  );
}
function StatusPill({ status }) {
  const s = (status || '').toLowerCase();
  let bg = '#F4F2FF', col = '#6847F5', bc = '#DDD6FF';
  if (s === 'active' || s === 'approved' || s === 'paid' || s === 'completed' || s === 'present') { bg = '#EDFBF4'; col = '#15803D'; bc = '#BBF7D0'; }
  else if (s === 'pending' || s === 'on-hold' || s === 'in progress') { bg = '#FFFBEB'; col = '#B45309'; bc = '#FDE68A'; }
  else if (s === 'rejected' || s === 'absent' || s === 'inactive' || s === 'cancelled') { bg = '#FEF3F2'; col = '#B91C1C'; bc = '#FECACA'; }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color: col, border: `1px solid ${bc}`, borderRadius: 20, fontSize: 9, fontWeight: 600, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, display: 'inline-block', flexShrink: 0 }} />
      {status || 'Unknown'}
    </span>
  );
}
function Badge({ label, color = '#6847F5', bg = '#EEE9FF' }) {
  return <span style={{ fontSize: 9, fontWeight: 600, color, background: bg, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' }}>{label}</span>;
}
function DBFooter({ time }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #F0F0F7' }}>
      <span style={{ fontSize: 9, color: '#8A98B0' }}>{time}</span>
      <span style={{ fontSize: 9, color: '#8A98B0', display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A98B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        Source: HRMS Database
      </span>
    </div>
  );
}
function IconBox({ children }) {
  return <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</div>;
}
function SectionTitle({ icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <IconBox>{icon}</IconBox>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: '#17213A', margin: 0 }}>{title}</p>
        {count != null && <p style={{ fontSize: 11, color: '#71809C', margin: 0 }}>{count} record{count !== 1 ? 's' : ''}</p>}
      </div>
    </div>
  );
}
function DataTable({ headers, rows }) {
  return (
    <div style={{ border: '1px solid #E8EAF2', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: '#F4F2FF' }}>
              {headers.map((h, i) => <th key={i} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#17213A', fontSize: 10.5, borderBottom: '1px solid #E8EAF2', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: '#FFFFFF', borderBottom: ri < rows.length - 1 ? '1px solid #F0F0F7' : 'none' }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: '7px 10px', color: ci === 0 && typeof cell === 'number' ? '#71809C' : '#17213A', fontWeight: ci === 1 ? 600 : 400, whiteSpace: 'nowrap' }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, color: '#8A98B0', minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#17213A', fontWeight: 600, wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IC = { stroke: '#6847F5', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
const PeopleIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PersonIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const CalIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const ClockIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const BuildIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/></svg>;
const StarIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const DollarIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const BagIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const FolderIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const TicketIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>;
const InfoIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const ListIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" {...IC}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;

// ─── Card Implementations ─────────────────────────────────────────────────────

// 1. Employee List
function EmployeeListCard({ data, text, time }) {
  const employees = data.employees || [];
  const activeCount = employees.filter(e => (e.status || '').toLowerCase() === 'active').length;
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<PeopleIcon />} title="Employee Directory" count={employees.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8, marginBottom: 14 }}>
          {employees.map((emp, i) => (
            <div key={i} style={{ background: '#FAFAFF', border: '1px solid #E8EAF2', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Avatar name={emp.name || ''} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#17213A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{emp.name}</p>
                  {(emp.role || emp.designation) && <p style={{ fontSize: 9.5, color: '#6847F5', fontWeight: 500, margin: 0 }}>{emp.role || emp.designation}</p>}
                </div>
              </div>
              {emp.email && <div style={{ fontSize: 9.5, color: '#4B5563', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</div>}
              <StatusPill status={emp.status} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ListIcon /><span style={{ fontSize: 11, fontWeight: 700, color: '#17213A' }}>Table View ({activeCount} active)</span>
        </div>
        <DataTable
          headers={['#', 'Name', 'Email', 'Phone', 'Designation', 'Status']}
          rows={employees.map((e, i) => [
            i + 1, e.name, e.email || '—',
            e.phone ? `+${String(e.phone).replace(/^\+/, '')}` : '—',
            e.role || e.designation || '—',
            <StatusPill key={i} status={e.status} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 2. Employee Profile
function EmployeeProfileCard({ data, text, time }) {
  const emp = data.employee || {};
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <Avatar name={emp.name || ''} size={52} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#17213A', margin: '0 0 2px' }}>{emp.name}</p>
            <p style={{ fontSize: 11, color: '#6847F5', fontWeight: 500, margin: '0 0 8px' }}>{emp.role || emp.designation}</p>
            <StatusPill status={emp.status} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
          <InfoRow label="Email" value={emp.email} />
          <InfoRow label="Phone" value={emp.phone ? `+${String(emp.phone).replace(/^\+/, '')}` : '—'} />
          <InfoRow label="Department" value={emp.department} />
          <InfoRow label="Designation" value={emp.designation || emp.role} />
          <InfoRow label="Join Date" value={emp.join_date ? new Date(emp.join_date).toLocaleDateString() : '—'} />
          <InfoRow label="Employee ID" value={emp.id || emp.employee_id} />
        </div>
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 3. Attendance Summary
function AttendanceSummaryCard({ data, text, time }) {
  const records = data.attendance || [];
  const present = records.filter(r => (r.status || '').toLowerCase() === 'present').length;
  const absent  = records.filter(r => (r.status || '').toLowerCase() === 'absent').length;
  const other   = records.length - present - absent;
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<CalIcon />} title="Attendance Summary" count={records.length} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ label: 'Present', val: present, col: '#15803D', bg: '#EDFBF4', bc: '#BBF7D0' }, { label: 'Absent', val: absent, col: '#B91C1C', bg: '#FEF3F2', bc: '#FECACA' }, { label: 'Other', val: other, col: '#6847F5', bg: '#EEE9FF', bc: '#DDD6FF' }].map(st => (
            <div key={st.label} style={{ flex: 1, background: st.bg, border: `1px solid ${st.bc}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: st.col, margin: 0 }}>{st.val}</p>
              <p style={{ fontSize: 10, color: st.col, margin: 0, fontWeight: 600 }}>{st.label}</p>
            </div>
          ))}
        </div>
        <DataTable
          headers={['Employee', 'Date', 'Check In', 'Check Out', 'Status']}
          rows={records.map(r => [
            r.name || r.employee_name || '—',
            r.date ? new Date(r.date).toLocaleDateString() : '—',
            r.check_in || '—', r.check_out || '—',
            <StatusPill key={r.id} status={r.status} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 4. Employee Attendance
function EmployeeAttendanceCard({ data, text, time }) {
  const records = data.attendance || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<ClockIcon />} title={data.employee_name ? `Attendance — ${data.employee_name}` : 'Employee Attendance'} count={records.length} />
        <DataTable
          headers={['Date', 'Check In', 'Check Out', 'Hours', 'Status']}
          rows={records.map(r => [
            r.date ? new Date(r.date).toLocaleDateString() : '—',
            r.check_in || '—', r.check_out || '—', r.hours_worked || '—',
            <StatusPill key={r.id} status={r.status} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 5. Leave Balance
function LeaveBalanceCard({ data, text, time }) {
  const balances = data.balances || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<CalIcon />} title={data.employee_name ? `Leave Balance — ${data.employee_name}` : 'Leave Balance'} count={balances.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 12 }}>
          {balances.map((b, i) => {
            const used  = Number(b.used_days || b.used || 0);
            const total = Number(b.total_days || b.total || b.allocated || 0);
            const rem   = total - used;
            const pct   = total > 0 ? Math.round((rem / total) * 100) : 0;
            const col   = pct > 50 ? '#22C55E' : pct > 20 ? '#F59E0B' : '#EF4444';
            return (
              <div key={i} style={{ background: '#FAFAFF', border: '1px solid #E8EAF2', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#17213A', margin: '0 0 4px' }}>{b.leave_type || b.type || `Type ${i+1}`}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#6847F5', margin: '0 0 2px' }}>{rem}</p>
                <p style={{ fontSize: 9, color: '#8A98B0', margin: '0 0 8px' }}>of {total} days remaining</p>
                <div style={{ height: 4, background: '#E8EAF2', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
        <DataTable
          headers={['Leave Type', 'Allocated', 'Used', 'Remaining']}
          rows={balances.map(b => {
            const used  = Number(b.used_days || b.used || 0);
            const total = Number(b.total_days || b.total || b.allocated || 0);
            return [b.leave_type || b.type || '—', total, used, <span key={b.leave_type} style={{ fontWeight: 700, color: '#6847F5' }}>{total - used}</span>];
          })}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 6. Leave Request List
function LeaveRequestListCard({ data, text, time }) {
  const requests = data.requests || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<CalIcon />} title="Leave Requests" count={requests.length} />
        <DataTable
          headers={['Employee', 'Type', 'From', 'To', 'Days', 'Status']}
          rows={requests.map(r => [
            r.employee_name || r.name || '—', r.leave_type || r.type || '—',
            r.start_date ? new Date(r.start_date).toLocaleDateString() : '—',
            r.end_date   ? new Date(r.end_date).toLocaleDateString()   : '—',
            r.days || '—', <StatusPill key={r.id} status={r.status} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 7. Department List
function DepartmentListCard({ data, text, time }) {
  const departments = data.departments || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<BuildIcon />} title="Departments" count={departments.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
          {departments.map((d, i) => (
            <div key={i} style={{ background: '#FAFAFF', border: '1px solid #E8EAF2', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#EEE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><BuildIcon /></div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#17213A', margin: '0 0 2px' }}>{d.name || d.department_name}</p>
              {d.employee_count != null && <p style={{ fontSize: 10, color: '#8A98B0', margin: 0 }}>{d.employee_count} employees</p>}
              {d.head && <p style={{ fontSize: 9.5, color: '#6847F5', margin: '4px 0 0', fontWeight: 500 }}>Head: {d.head}</p>}
            </div>
          ))}
        </div>
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 8. Department Employees
function DepartmentEmployeesCard({ data, text, time }) {
  const employees = data.employees || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<PeopleIcon />} title={data.department_name ? `${data.department_name} — Employees` : 'Department Employees'} count={employees.length} />
        <DataTable
          headers={['#', 'Name', 'Designation', 'Email', 'Status']}
          rows={employees.map((e, i) => [i+1, e.name, e.designation || e.role || '—', e.email || '—', <StatusPill key={i} status={e.status} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 9. Designation List
function DesignationListCard({ data, text, time }) {
  const designations = data.designations || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<StarIcon />} title="Designations" count={designations.length} />
        <DataTable
          headers={['#', 'Designation', 'Department', 'Employees']}
          rows={designations.map((d, i) => [i+1, d.name || d.designation_name, d.department || '—', d.employee_count || '—'])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 10. Holiday List
function HolidayListCard({ data, text, time }) {
  const holidays = data.holidays || [];
  const today = new Date();
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<CalIcon />} title="Holidays" count={holidays.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {holidays.map((h, i) => {
            const dateObj = h.date ? new Date(h.date) : null;
            const upcoming = dateObj && dateObj >= today;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: upcoming ? '#F7F3FF' : '#FAFAFF', border: `1px solid ${upcoming ? '#DDD6FF' : '#E8EAF2'}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, background: upcoming ? '#EEE9FF' : '#F0F0F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {dateObj ? <>
                    <span style={{ fontSize: 15, fontWeight: 800, color: upcoming ? '#6847F5' : '#8A98B0', lineHeight: 1 }}>{dateObj.getDate()}</span>
                    <span style={{ fontSize: 8, color: upcoming ? '#9B87F7' : '#A0AEC0', fontWeight: 600 }}>{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                  </> : <CalIcon />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#17213A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name || h.holiday_name}</p>
                  <p style={{ fontSize: 9.5, color: '#71809C', margin: 0 }}>
                    {dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
                {upcoming && <Badge label="Upcoming" />}
              </div>
            );
          })}
        </div>
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 11. Payroll Summary
function PayrollSummaryCard({ data, text, time }) {
  const s = data.summary || {};
  const stats = [
    { label: 'Total Employees', value: s.total_employees || s.employee_count || '—', col: '#6847F5', bg: '#EEE9FF' },
    { label: 'Total Gross',     value: s.total_gross ? `$${Number(s.total_gross).toLocaleString()}` : '—', col: '#15803D', bg: '#EDFBF4' },
    { label: 'Total Deductions',value: s.total_deductions ? `$${Number(s.total_deductions).toLocaleString()}` : '—', col: '#B91C1C', bg: '#FEF3F2' },
    { label: 'Net Pay',         value: (s.total_net || s.net_pay) ? `$${Number(s.total_net || s.net_pay).toLocaleString()}` : '—', col: '#1D4ED8', bg: '#F0F8FF' },
  ];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<DollarIcon />} title={`Payroll Summary${s.month ? ` — ${s.month}` : ''}`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {stats.map((st, i) => (
            <div key={i} style={{ background: st.bg, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 9.5, color: st.col, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{st.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: st.col, margin: 0 }}>{st.value}</p>
            </div>
          ))}
        </div>
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 12. Employee Payroll
function EmployeePayrollCard({ data, text, time }) {
  const payroll = data.payroll || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<DollarIcon />} title={data.employee_name ? `Payroll — ${data.employee_name}` : 'Employee Payroll'} count={payroll.length} />
        <DataTable
          headers={['Month', 'Gross Pay', 'Deductions', 'Net Pay', 'Status']}
          rows={payroll.map(p => [
            p.month || p.pay_period || '—',
            p.gross_pay ? `$${Number(p.gross_pay).toLocaleString()}` : '—',
            p.deductions ? `$${Number(p.deductions).toLocaleString()}` : '—',
            p.net_pay ? <span key={p.id} style={{ fontWeight: 700, color: '#15803D' }}>${Number(p.net_pay).toLocaleString()}</span> : '—',
            <StatusPill key={p.id} status={p.status || 'Paid'} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 13. Job Positions
function JobPositionsCard({ data, text, time }) {
  const positions = data.positions || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<BagIcon />} title="Job Positions" count={positions.length} />
        <DataTable
          headers={['Position', 'Department', 'Openings', 'Type', 'Status']}
          rows={positions.map(p => [p.title || p.position_name || '—', p.department || '—', p.openings || p.vacancies || '—', p.type || '—', <StatusPill key={p.id} status={p.status || 'Open'} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 14. Candidates
function CandidatesCard({ data, text, time }) {
  const candidates = data.candidates || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<PeopleIcon />} title="Candidates" count={candidates.length} />
        <DataTable
          headers={['Name', 'Position', 'Email', 'Applied On', 'Stage', 'Status']}
          rows={candidates.map(c => [c.name || '—', c.position || c.job_title || '—', c.email || '—', c.applied_date ? new Date(c.applied_date).toLocaleDateString() : '—', c.stage || '—', <StatusPill key={c.id} status={c.status} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 15. Interview Schedules
function InterviewSchedulesCard({ data, text, time }) {
  const schedules = data.schedules || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<CalIcon />} title="Interview Schedules" count={schedules.length} />
        <DataTable
          headers={['Candidate', 'Position', 'Date', 'Time', 'Interviewer', 'Status']}
          rows={schedules.map(s => [s.candidate_name || s.name || '—', s.position || '—', s.interview_date ? new Date(s.interview_date).toLocaleDateString() : '—', s.interview_time || '—', s.interviewer || '—', <StatusPill key={s.id} status={s.status} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 16. Company Profile
function CompanyProfileCard({ data, text, time }) {
  const p = data.profile || {};
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<InfoIcon />} title="Company Profile" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
          <InfoRow label="Company Name"   value={p.name || p.company_name} />
          <InfoRow label="Industry"       value={p.industry} />
          <InfoRow label="Email"          value={p.email} />
          <InfoRow label="Phone"          value={p.phone} />
          <InfoRow label="Address"        value={p.address} />
          <InfoRow label="Website"        value={p.website} />
          <InfoRow label="Founded"        value={p.founded_year || p.established} />
          <InfoRow label="Total Employees" value={p.total_employees} />
        </div>
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 17. Projects
function ProjectsCard({ data, text, time }) {
  const projects = data.projects || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<FolderIcon />} title="Projects" count={projects.length} />
        <DataTable
          headers={['Project', 'Client', 'Start', 'Deadline', 'Team', 'Status']}
          rows={projects.map(p => [p.name || p.project_name || '—', p.client || '—', p.start_date ? new Date(p.start_date).toLocaleDateString() : '—', (p.deadline || p.end_date) ? new Date(p.deadline || p.end_date).toLocaleDateString() : '—', p.team_size || p.members || '—', <StatusPill key={p.id} status={p.status} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 18. Tasks
function TasksCard({ data, text, time }) {
  const tasks = data.tasks || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<ListIcon />} title="Tasks" count={tasks.length} />
        <DataTable
          headers={['Task', 'Assigned To', 'Project', 'Due Date', 'Priority', 'Status']}
          rows={tasks.map(t => [
            t.title || t.task_name || '—', t.assignee || t.assigned_to || '—', t.project || '—',
            t.due_date ? new Date(t.due_date).toLocaleDateString() : '—',
            t.priority ? <Badge key={t.id} label={t.priority} color={t.priority === 'High' ? '#B91C1C' : t.priority === 'Medium' ? '#B45309' : '#15803D'} bg={t.priority === 'High' ? '#FEF3F2' : t.priority === 'Medium' ? '#FFFBEB' : '#EDFBF4'} /> : '—',
            <StatusPill key={t.id + '-s'} status={t.status} />
          ])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// 19. Support Tickets
function SupportTicketsCard({ data, text, time }) {
  const tickets = data.tickets || [];
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px 12px' }}>
        {text && <p style={{ fontSize: 13, color: '#17213A', marginBottom: 12, lineHeight: '19px' }}>{text}</p>}
        <SectionTitle icon={<TicketIcon />} title="Support Tickets" count={tickets.length} />
        <DataTable
          headers={['#', 'Subject', 'Submitted By', 'Category', 'Created', 'Status']}
          rows={tickets.map((t, i) => [i+1, t.subject || t.title || '—', t.submitted_by || t.employee_name || '—', t.category || '—', t.created_at ? new Date(t.created_at).toLocaleDateString() : '—', <StatusPill key={t.id} status={t.status} />])}
        />
      </div>
      <DBFooter time={time} />
    </div>
  );
}

// ─── Generic Text Bubble (fallback) ──────────────────────────────────────────
function TextBubble({ text, time }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8EAF2', borderRadius: 10, borderTopLeftRadius: 4, padding: '12px 14px', maxWidth: 520, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: '#17213A', margin: '0 0 6px', lineHeight: '18px' }}>{text}</p>
      <p style={{ fontSize: 9, color: '#8A98B0', margin: 0 }}>{time}</p>
    </div>
  );
}

function WebAnswerCard({ data, text, time }) {
  const results = data.results || [];
  return (
    <div style={{ ...CARD, padding: '14px 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6847F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6847F5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Web Search Result
        </span>
      </div>
      {text && <p style={{ fontSize: 12, color: '#17213A', marginBottom: 14, lineHeight: '18px' }}>{text}</p>}
      
      {results.length > 0 && (
        <div style={{ borderTop: '1px solid #F0F0F7', paddingTop: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#8A98B0', marginBottom: 8 }}>Sources & References</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.slice(0, 4).map((res, i) => (
              <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 6, alignItems: 'flex-start', textDecoration: 'none' }}>
                <span style={{ fontSize: 9.5, background: '#EEE9FF', color: '#6847F5', borderRadius: 4, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 10, color: '#6847F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {res.title || res.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Router ──────────────────────────────────────────────────────────────
export function AIResponseRenderer({ data, text, time }) {
  if (!data || !data.type) return <TextBubble text={text} time={time} />;
  const props = { data, text, time };
  switch (data.type) {
    case 'employee_list':        return <EmployeeListCard        {...props} />;
    case 'employee_profile':     return <EmployeeProfileCard     {...props} />;
    case 'attendance_summary':   return <AttendanceSummaryCard   {...props} />;
    case 'employee_attendance':  return <EmployeeAttendanceCard  {...props} />;
    case 'leave_balance':        return <LeaveBalanceCard        {...props} />;
    case 'leave_request_list':   return <LeaveRequestListCard    {...props} />;
    case 'department_list':      return <DepartmentListCard      {...props} />;
    case 'department_employees': return <DepartmentEmployeesCard {...props} />;
    case 'designation_list':     return <DesignationListCard     {...props} />;
    case 'holiday_list':         return <HolidayListCard         {...props} />;
    case 'payroll_summary':      return <PayrollSummaryCard      {...props} />;
    case 'employee_payroll':     return <EmployeePayrollCard     {...props} />;
    case 'job_positions':        return <JobPositionsCard        {...props} />;
    case 'candidates':           return <CandidatesCard          {...props} />;
    case 'interview_schedules':  return <InterviewSchedulesCard  {...props} />;
    case 'company_profile':      return <CompanyProfileCard      {...props} />;
    case 'projects':             return <ProjectsCard            {...props} />;
    case 'tasks':                return <TasksCard               {...props} />;
    case 'support_tickets':      return <SupportTicketsCard      {...props} />;
    case 'web_answer':           return <WebAnswerCard           {...props} />;
    default:                     return <TextBubble text={text} time={time} />;
  }
}
