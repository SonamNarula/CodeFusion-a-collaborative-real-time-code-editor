import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LANGUAGES } from '../lib/languages.js';

const STATUS = {
  connected: ['ok', 'Live'],
  connecting: ['warn', 'Connecting'],
  disconnected: ['bad', 'Offline: edits will sync when back'],
};

function Timer({ timer, isHost, onSet }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!timer) return undefined;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [timer]);

  if (!timer) {
    if (!isHost) return null;
    return (
      <select className="select" aria-label="Start a timer" value="" onChange={(e) => onSet(Number(e.target.value))}>
        <option value="">Timer</option>
        {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
      </select>
    );
  }
  const left = Math.max(0, timer.end - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  return (
    <span className={`chip ${left === 0 ? 'bad' : left < 300000 ? 'warn' : ''}`} title="Shared countdown">
      {left === 0 ? "Time's up" : `${mm}:${ss}`}
      {isHost && <button className="icon-btn" aria-label="Clear timer" onClick={() => onSet(0)}>×</button>}
    </span>
  );
}

export default function Topbar(p) {
  const [tone, label] = STATUS[p.status] || STATUS.connecting;
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="CodeFusion home">
        <span className="logo">&lt;/&gt;</span> CodeFusion
      </Link>
      <button className="chip mono" onClick={p.onCopy} title="Copy invite link">
        {p.roomId}
      </button>
      <span className={`chip status ${tone}`}><i className="dot" />{label}</span>
      <div className="spacer" />
      <Timer timer={p.timer} isHost={p.isHost} onSet={p.onSetTimer} />
      <select className="select" aria-label="Language" value={p.language} disabled={p.readOnly} onChange={(e) => p.onLanguage(e.target.value)}>
        {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
      </select>
      <button className="btn primary" onClick={p.onRun} disabled={!p.canRun || p.running} title={p.canRun ? 'Run (Ctrl/Cmd + Enter)' : 'Running this language is not enabled on the server'}>
        {p.running ? 'Running…' : 'Run'}
      </button>
      {p.isHost && (
        <button className={`btn ${p.locked ? 'active' : ''}`} onClick={p.onToggleLock} title="Make the room view-only for everyone except you">
          {p.locked ? 'Unlock editing' : 'Lock editing'}
        </button>
      )}
      <button className="btn" onClick={p.onReplay}>Replay</button>
      <button className="btn" onClick={p.onDownload}>Download</button>
      <button className="btn" onClick={p.onToggleTheme} aria-label="Toggle theme">{p.theme === 'dark' ? 'Light' : 'Dark'}</button>
    </header>
  );
}
