import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search, X, Loader2, AlertCircle } from 'lucide-react';

/**
 * AppDropdown — Central reusable custom dropdown component for HRMS.
 *
 * Replaces all native <select> elements across the application.
 *
 * Props:
 *  - options: Array<{value, label, sublabel?, avatar?, disabled?}> | Array<string|number>
 *  - value: current selected value (matches option.value)
 *  - onChange: (value) => void
 *  - placeholder: string
 *  - label: string (optional field label above trigger)
 *  - required: bool
 *  - disabled: bool
 *  - searchable: bool (default: auto — true when options > 6)
 *  - clearable: bool (allow clear/reset to null)
 *  - loading: bool (shows loading state)
 *  - error: bool (red border)
 *  - errorMessage: string (text shown below trigger)
 *  - emptyMessage: string
 *  - loadingMessage: string
 *  - style: CSSProperties (applied to wrapper)
 *  - menuStyle: CSSProperties (applied to dropdown menu)
 *  - size: 'sm' | 'md' | 'lg' (default 'md')
 *  - allOption: bool | string — prepend "All" option (for filter dropdowns)
 *  - allOptionValue: any — value of the "All" option (default '')
 */
export default function AppDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  required = false,
  disabled = false,
  searchable,
  clearable = false,
  loading = false,
  error = false,
  errorMessage,
  emptyMessage = 'No options found',
  loadingMessage = 'Loading...',
  style = {},
  menuStyle = {},
  size = 'md',
  allOption = false,
  allOptionValue = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Normalize all option formats to { value, label, sublabel, avatar, disabled }
  const normalizeOpt = (opt) => {
    if (opt === null || opt === undefined) return null;
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt), sublabel: null, avatar: null, disabled: false };
    }
    return {
      value: opt.id !== undefined ? opt.id : (opt.value !== undefined ? opt.value : opt),
      label: opt.name || opt.label || opt.title || opt.dept_name || opt.role_name || String(opt.value || opt.id || ''),
      sublabel: opt.sublabel || opt.department_name || opt.department || opt.code || opt.emp_code || null,
      avatar: opt.avatar || opt.profile_photo || null,
      disabled: opt.disabled || false,
      raw: opt,
    };
  };

  const normalizedOptions = options.map(normalizeOpt).filter(Boolean);

  // Prepend "All" option for filter dropdowns
  const allEntry = allOption
    ? { value: allOptionValue, label: typeof allOption === 'string' ? allOption : 'All', sublabel: null, avatar: null, disabled: false }
    : null;

  const displayOptions = allEntry ? [allEntry, ...normalizedOptions] : normalizedOptions;

  // Auto-enable search for large lists
  const isSearchable = searchable !== undefined ? searchable : displayOptions.length > 6;

  const selectedOption = displayOptions.find(opt => String(opt.value) === String(value));

  const filteredOptions = displayOptions.filter(opt => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(opt.label).toLowerCase().includes(q) ||
      (opt.sublabel ? String(opt.sublabel).toLowerCase().includes(q) : false)
    );
  });

  // Size tokens
  const sizeMap = {
    sm: { minHeight: 36, fontSize: 12, padding: '0 10px', borderRadius: 8 },
    md: { minHeight: 44, fontSize: 14, padding: '0 14px', borderRadius: 10 },
    lg: { minHeight: 52, fontSize: 15, padding: '0 16px', borderRadius: 12 },
  };
  const sz = sizeMap[size] || sizeMap.md;

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    }
    if (!isOpen) setSearch('');
  }, [isOpen, isSearchable]);

  const handleSelect = useCallback((val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    if (onChange) onChange(null);
  }, [onChange]);

  const triggerBorder = error
    ? '1.5px solid #EF4444'
    : (isOpen || isFocused)
      ? '1.5px solid #3B82F6'
      : '1px solid #E2E8F0';

  const triggerShadow = error
    ? '0 0 0 3px rgba(239,68,68,0.15)'
    : (isOpen || isFocused)
      ? '0 0 0 3px rgba(59,130,246,0.18)'
      : 'none';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none', ...style }}>
      {/* Label */}
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        tabIndex={disabled ? -1 : 0}
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setIsOpen(prev => !prev)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          minHeight: sz.minHeight,
          padding: sz.padding,
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          border: triggerBorder,
          boxShadow: triggerShadow,
          borderRadius: sz.borderRadius,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
          gap: 8,
        }}
      >
        {/* Left: selected label or placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          {loading ? (
            <span style={{ fontSize: sz.fontSize, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              {loadingMessage}
            </span>
          ) : selectedOption ? (
            <span style={{ fontSize: sz.fontSize, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span style={{ fontSize: sz.fontSize - 2, color: '#6B7280', fontWeight: 400, marginLeft: 4 }}>
                  — {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: sz.fontSize, color: '#9CA3AF' }}>{placeholder}</span>
          )}
        </div>

        {/* Right: clear + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', padding: 2, borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#6B7280'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              <X size={12} />
            </span>
          )}
          {loading
            ? <Loader2 size={15} style={{ color: '#9CA3AF', animation: 'spin 1s linear infinite' }} />
            : <ChevronDown size={15} style={{ color: '#6B7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }} />
          }
        </div>
      </button>

      {/* Error message */}
      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: '#EF4444' }}>
          <AlertCircle size={12} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -5px rgba(0,0,0,0.08)',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...menuStyle,
          }}
        >
          {/* Search */}
          {isSearchable && (
            <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: 9, color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: 32,
                    paddingLeft: 28,
                    paddingRight: search ? 26 : 8,
                    fontSize: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 7,
                    outline: 'none',
                    background: '#FFFFFF',
                    color: '#111827',
                  }}
                />
                {search && (
                  <X
                    size={11}
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 7, color: '#9CA3AF', cursor: 'pointer' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', padding: '4px 0', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                {search ? `No results for "${search}"` : emptyMessage}
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={e => { if (!opt.disabled) e.currentTarget.style.background = '#F1F5F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#EFF6FF' : 'transparent'; }}
                    style={{
                      padding: '9px 14px',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: opt.disabled ? '#CBD5E1' : (isSelected ? '#1D4ED8' : '#1F2937'),
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      transition: 'background 0.1s ease',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      {opt.avatar && (
                        <img
                          src={opt.avatar}
                          alt=""
                          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          onError={e => e.target.style.display = 'none'}
                        />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 400, flexShrink: 0 }}>
                          ({opt.sublabel})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={13} style={{ color: '#2563EB', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Also export as named export for convenience
export { AppDropdown };
AppDropdown.displayName = 'AppDropdown';
Object.defineProperty(AppDropdown, 'name', { value: 'AppDropdown' });

// Named re-export alias
function AppDropdownAlias(props) { return AppDropdown ? <AppDropdown {...props} /> : null; }
export { AppDropdownAlias as AppDropdownComponent };
