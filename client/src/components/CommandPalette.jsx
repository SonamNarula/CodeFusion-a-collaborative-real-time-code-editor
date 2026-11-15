import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';

export default function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(''); setIndex(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);

  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return actions.filter((a) => tokens.every((t) => `${a.group} ${a.label}`.toLowerCase().includes(t)));
  }, [actions, query]);

  useEffect(() => { setIndex(0); }, [query]);
  useEffect(() => { listRef.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); }, [index]);

  if (!open) return null;

  const run = (a) => { onClose(); setTimeout(() => a.run(), 0); };
  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[index]) run(results[index]);
  };

  let lastGroup = null;
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey} placeholder="Type a command or search files…" />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {results.length === 0 && <div className="palette-empty">No matching commands</div>}
          {results.map((a, i) => {
            const header = a.group !== lastGroup ? <div className="palette-group">{a.group}</div> : null;
            lastGroup = a.group;
            return (
              <React.Fragment key={a.id}>
                {header}
                <button className={`palette-item ${i === index ? 'on' : ''}`} onMouseMove={() => setIndex(i)} onClick={() => run(a)}>
                  <span className="pi-icon">{a.icon}</span>
                  <span className="pi-label">{a.label}</span>
                  {a.kbd && <kbd>{a.kbd}</kbd>}
                  {i === index && <CornerDownLeft size={13} className="pi-enter" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
