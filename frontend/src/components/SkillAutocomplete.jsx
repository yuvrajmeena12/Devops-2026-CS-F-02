import { useEffect, useRef, useState } from 'react';
import skillOptions from '../data/skillOptions';

/**
 * Searchable skill dropdown: shows suggestions for the selected category,
 * filters them as you type, and always offers "Add '<query>' as a new skill"
 * so the list of suggestions never blocks someone from listing something
 * unusual (yodeling, sourdough baking, etc).
 */
export default function SkillAutocomplete({ category, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = skillOptions[category] || [];
  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  const selectOption = (opt) => {
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value); // keep parent form state in sync as they type/pick custom
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Search or type a skill..."
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: -8, zIndex: 30,
          background: '#10201A', border: '1.5px solid var(--ink-raised)', borderRadius: 10,
          maxHeight: 220, overflowY: 'auto', boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
        }}>
          {filtered.length === 0 && query.trim() === '' && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-muted)' }}>
              Start typing to search, or scroll for popular {category} skills.
            </div>
          )}
          {(query.trim() === '' ? options : filtered).map((opt) => (
            <div
              key={opt}
              onClick={() => selectOption(opt)}
              style={{ padding: '10px 14px', fontSize: 14, cursor: 'pointer', color: 'var(--ink-text)' }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {opt}
            </div>
          ))}
          {query.trim() !== '' && !exactMatch && (
            <div
              onClick={() => selectOption(query.trim())}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: '10px 14px', fontSize: 14, cursor: 'pointer', color: 'var(--amber)',
                borderTop: filtered.length > 0 ? '1px solid var(--ink-raised)' : 'none', fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              + Add "{query.trim()}" as a new skill
            </div>
          )}
          {query.trim() !== '' && filtered.length === 0 && exactMatch === false && options.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-muted)' }}>
              No suggestions for "Other" — type any skill name.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
