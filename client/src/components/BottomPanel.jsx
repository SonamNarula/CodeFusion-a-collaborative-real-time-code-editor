import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Terminal, Trash2, X, Loader2 } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { monaco } from '../lib/monacoSetup';
import { timeOf } from '../lib/utils';

function ConsoleView({ entries, live, onClear }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [entries.length, live?.lines.length]);

  const Lines = ({ lines }) => (
    <div className="c-lines">
      {lines.length === 0 && <div className="c-line muted">No output.</div>}
      {lines.map((l, i) => <div key={i} className={`c-line ${l.k}`}>{l.t}</div>)}
    </div>
  );

  return (
    <div className="console">
      <div className="console-scroll">
        {entries.length === 0 && !live && (
          <div className="empty row">
            <Terminal size={20} />
            <div><b>Shared console</b><span>Press <kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd> to run the active file. Output is visible to everyone in the room.</span></div>
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} className={`run ${e.ok ? 'ok' : 'bad'}`}>
            <div className="run-head">
              <Avatar name={e.by.name} color={e.by.color} size={18} />
              <span><b>{e.by.name}</b> ran <code>{e.file}</code></span>
              <span className="grow" />
              <span className={`status ${e.ok ? 'ok' : 'bad'}`}>{e.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{e.ok ? 'Success' : 'Failed'}</span>
              <span className="muted">{e.ms}ms · {timeOf(e.ts)}</span>
            </div>
            <Lines lines={e.lines} />
          </div>
        ))}
        {live && (
          <div className="run live">
            <div className="run-head">
              <Loader2 size={14} className="spin" />
              <span>Running <code>{live.file}</code>…</span>
            </div>
            <Lines lines={live.lines} />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function ProblemsView({ activeId, activeName }) {
  const [markers, setMarkers] = useState([]);
  useEffect(() => {
    const collect = () => {
      const all = monaco.editor.getModelMarkers({}).filter((m) => m.resource.path.startsWith(`/${activeId}.`));
      setMarkers(all.sort((a, b) => b.severity - a.severity || a.startLineNumber - b.startLineNumber));
    };
    collect();
    const sub = monaco.editor.onDidChangeMarkers(collect);
    return () => sub.dispose();
  }, [activeId]);

  if (!markers.length) {
    return <div className="empty row"><CheckCircle2 size={20} /><div><b>No problems</b><span>{activeName ? `${activeName} looks clean.` : 'Open a file to see diagnostics.'}</span></div></div>;
  }
  return (
    <div className="problems">
      {markers.map((m, i) => (
        <div key={i} className="problem">
          {m.severity === monaco.MarkerSeverity.Error ? <AlertCircle size={14} className="err" /> : <AlertTriangle size={14} className="warn" />}
          <span>{m.message}</span>
          <code>Ln {m.startLineNumber}, Col {m.startColumn}</code>
        </div>
      ))}
    </div>
  );
}

export default function BottomPanel({ tab, onTab, entries, live, onClear, activeId, activeName, onClose, problemCount }) {
  return (
    <div className="bottom">
      <div className="bottom-tabs">
        <button className={tab === 'console' ? 'on' : ''} onClick={() => onTab('console')}><Terminal size={13} /> Console {entries.length > 0 && <b>{entries.length}</b>}</button>
        <button className={tab === 'problems' ? 'on' : ''} onClick={() => onTab('problems')}><AlertCircle size={13} /> Problems {problemCount > 0 && <b className="err">{problemCount}</b>}</button>
        <span className="grow" />
        {tab === 'console' && <button className="icon-btn sm" title="Clear console for everyone" onClick={onClear}><Trash2 size={13} /></button>}
        <button className="icon-btn sm" title="Close panel" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="bottom-body">
        {tab === 'console' ? <ConsoleView entries={entries} live={live} /> : <ProblemsView activeId={activeId} activeName={activeName} />}
      </div>
    </div>
  );
}
