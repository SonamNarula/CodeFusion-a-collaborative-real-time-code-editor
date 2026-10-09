import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import Editor from '@monaco-editor/react';
import { getReplay } from '../lib/api.js';

const decode = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

export default function ReplayModal({ roomId, theme, onClose }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState({ text: '', lang: 'javascript' });
  const state = useRef({ doc: null, applied: -1, updates: [] });

  useEffect(() => {
    getReplay(roomId)
      .then(({ events: ev }) => {
        state.current.updates = ev.map((e) => decode(e.u));
        setEvents(ev);
        setIdx(Math.max(0, ev.length - 1));
      })
      .catch((e) => setError(e.message));
    return () => state.current.doc?.destroy();
  }, [roomId]);

  // Scrub: replay forward incrementally, rebuild from scratch when going backwards.
  useEffect(() => {
    if (!events?.length) return;
    const s = state.current;
    if (!s.doc || idx < s.applied) {
      s.doc?.destroy();
      s.doc = new Y.Doc();
      s.applied = -1;
    }
    for (let i = s.applied + 1; i <= idx; i++) Y.applyUpdate(s.doc, s.updates[i]);
    s.applied = idx;
    setView({ text: s.doc.getText('code').toString(), lang: s.doc.getMap('meta').get('language') || 'javascript' });
  }, [idx, events]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setIdx((i) => (i >= events.length - 1 ? (setPlaying(false), i) : i + 1)), 50);
    return () => clearInterval(t);
  }, [playing, events]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const last = (events?.length ?? 1) - 1;
  const elapsed = events?.length ? events[idx].t - events[0].t : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal panel" role="dialog" aria-label="Session replay" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Session replay</h2>
          <div className="spacer" />
          <button className="btn small" onClick={onClose}>Close</button>
        </div>
        {error && <p className="err">{error}</p>}
        {!events && !error && <p className="muted">Loading history…</p>}
        {events && events.length === 0 && <p className="muted">Nothing recorded for this room yet.</p>}
        {events?.length > 0 && (
          <>
            <div className="replay-editor">
              <Editor
                value={view.text}
                language={view.lang}
                theme={theme === 'dark' ? 'cf-dark' : 'cf-light'}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            </div>
            <div className="replay-controls">
              <button className="btn primary" onClick={() => { if (idx >= last) setIdx(0); setPlaying((p) => !p); }}>{playing ? 'Pause' : 'Play'}</button>
              <input type="range" min={0} max={last} value={idx} onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }} aria-label="Timeline" />
              <span className="mono small muted">{clock(elapsed)} · {new Date(events[idx].t).toLocaleTimeString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
