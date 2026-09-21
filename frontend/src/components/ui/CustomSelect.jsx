import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  required = false,
  error = false,
  disabled = false,
  searchable = true,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to { value, label, sublabel, avatar }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.id !== undefined ? opt.id : opt.value,
      label: opt.name || opt.label || opt.title || String(opt.value),
      sublabel: opt.sublabel || opt.department_name || opt.department || opt.project_code || null,
      avatar: opt.avatar || opt.profile_photo || null,
      raw: opt
    };
  });

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(opt => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const l = String(opt.label).toLowerCase();
    const s = opt.sublabel ? String(opt.sublabel).toLowerCase() : '';
    return l.includes(q) || s.includes(q);
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none', ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          minHeight: 48,
          padding: '0 14px',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          border: error ? '1.5px solid #EF4444' : (isOpen || isFocused) ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
          boxShadow: (isOpen || isFocused) ? '0 0 0 4px rgba(37,99,235,0.20)' : 'none',
          borderRadius: 12,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {selectedOption ? (
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {selectedOption.label} {selectedOption.sublabel ? <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}> — {selectedOption.sublabel}</span> : ''}
            </span>
          ) : (
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: '#6B7280',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
            maxHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {searchable && normalizedOptions.length > 4 && (
            <div style={{ padding: 8, borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, color: '#9CA3AF' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 34,
                    paddingLeft: 30,
                    paddingRight: 28,
                    fontSize: 13,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                {search && (
                  <X
                    size={12}
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 8, color: '#9CA3AF', cursor: 'pointer' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Option List */}
          <div style={{ overflowY: 'auto', padding: '4px 0', maxHeight: 200 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? '#EFF6FF' : 'transparent')}
                    style={{
                      padding: '9px 14px',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#1D4ED8' : '#1F2937',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 400 }}>
                          ({opt.sublabel})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ color: '#2563EB', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
