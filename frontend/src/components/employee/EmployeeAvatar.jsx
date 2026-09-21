import React from 'react';
import { getAvatarUrl } from '../../lib/utils';

/**
 * EmployeeAvatar: Shows uploaded photo if available, otherwise renders initials.
 * 
 * Props:
 *   name       - employee name (used for initials fallback)
 *   photoUrl   - uploaded photo path/url (optional)
 *   size       - pixel size (default 40)
 *   className  - additional CSS class
 *   style      - additional inline styles
 *   onClick    - click handler (optional)
 */

// Generates a consistent color from a name string
function getColorFromName(name) {
  const colors = [
    '#2952E3', '#7C3AED', '#DB2777', '#DC2626',
    '#EA580C', '#D97706', '#059669', '#0891B2',
    '#4F46E5', '#9333EA', '#E11D48', '#0D9488'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export default function EmployeeAvatar({ name, photoUrl, size = 40, className = '', style = {}, onClick }) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const fontSize = Math.max(12, Math.round(size * 0.38));
  const resolvedUrl = photoUrl ? getAvatarUrl(photoUrl, name) : null;

  const baseStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  if (resolvedUrl) {
    return (
      <div className={className} style={baseStyle} onClick={onClick}>
        <img
          src={resolvedUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            // If image fails to load, hide it and show initials
            e.target.style.display = 'none';
            e.target.parentElement.style.backgroundColor = bgColor;
            e.target.parentElement.style.color = '#fff';
            const span = document.createElement('span');
            span.textContent = initials;
            span.style.fontWeight = '600';
            span.style.fontSize = `${fontSize}px`;
            span.style.letterSpacing = '0.5px';
            e.target.parentElement.appendChild(span);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        backgroundColor: bgColor,
        color: '#fff',
        fontWeight: 600,
        fontSize: `${fontSize}px`,
        letterSpacing: '0.5px',
        userSelect: 'none'
      }}
      onClick={onClick}
    >
      {initials}
    </div>
  );
}
