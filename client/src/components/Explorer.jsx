import React, { useEffect, useRef, useState } from 'react';
import { FilePlus2, Pencil, Trash2, Download } from 'lucide-react';
import FileIcon from './FileIcon.jsx';

function InlineInput({ initial = '', placeholder, onSubmit, onCancel, selectBase }) {
  const ref = useRef(null);
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, selectBase && dot > 0 ? dot : initial.length);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      ref={ref}
      className="inline-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCancel()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit(value);
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

export default function Explorer({ files, activeId, peers, onOpen, onCreate, onRename, onDelete, onDownload }) {
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [armed, setArmed] = useState(null);

  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(null), 2500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <div className="side-section">
      <div className="side-head">
        <span>Explorer</span>
        <button className="icon-btn sm" title="New file" onClick={() => setCreating(true)}><FilePlus2 size={14} /></button>
      </div>
      <div className="files">
        {files.map((f) => {
          const here = peers.filter((p) => !p.isSelf && p.cursor?.file === f.id);
          if (renaming === f.id) {
            return (
              <div key={f.id} className="file-row editing">
                <FileIcon name={f.name} />
                <InlineInput initial={f.name} selectBase onCancel={() => setRenaming(null)} onSubmit={(v) => { onRename(f.id, v); setRenaming(null); }} />
              </div>
            );
          }
          return (
            <div
              key={f.id}
              className={`file-row ${f.id === activeId ? 'active' : ''}`}
              onClick={() => onOpen(f.id)}
              onDoubleClick={() => setRenaming(f.id)}
            >
              <FileIcon name={f.name} />
              <span className="file-name">{f.name}</span>
              <span className="file-presence">
                {here.slice(0, 3).map((p) => <i key={p.clientId} title={`${p.user.name} is here`} style={{ background: p.user.color }} />)}
              </span>
              <span className="file-actions" onClick={(e) => e.stopPropagation()}>
                <button title="Download" onClick={() => onDownload(f)}><Download size={12} /></button>
                <button title="Rename" onClick={() => setRenaming(f.id)}><Pencil size={12} /></button>
                <button
                  title="Delete"
                  className={armed === f.id ? 'danger armed' : 'danger'}
                  onClick={() => (armed === f.id ? (setArmed(null), onDelete(f.id)) : setArmed(f.id))}
                >
                  {armed === f.id ? 'Sure?' : <Trash2 size={12} />}
                </button>
              </span>
            </div>
          );
        })}
        {creating && (
          <div className="file-row editing">
            <FileIcon name="new.txt" />
            <InlineInput placeholder="filename.ext" onCancel={() => setCreating(false)} onSubmit={(v) => { onCreate(v); setCreating(false); }} />
          </div>
        )}
        {!files.length && !creating && <div className="muted pad">No files. Create one to get started.</div>}
      </div>
      <div className="side-hint">Double-click a file to rename it.</div>
    </div>
  );
}
