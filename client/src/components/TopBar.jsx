import React from 'react';
import { Check, Command, Copy, Link2, Loader2, Moon, Play, Sun, UserPlus, Wifi, WifiOff } from 'lucide-react';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';

export default function TopBar({ roomId, status, peers, theme, onTheme, onRun, running, onShare, onPalette, onPeople, onCopyRoom, following }) {
  const online = status === 'connected';
  const shown = peers.slice(0, 5);
  return (
    <header className="topbar">
      <div className="tb-left">
        <Logo size={26} />
        <span className="tb-div" />
        <button className="room-chip" onClick={onCopyRoom} title="Copy room ID">
          <span className={`live-dot ${online ? 'on' : ''}`} />
          <code>{roomId}</code>
          <Copy size={12} />
        </button>
      </div>

      <button className="cmdk" onClick={onPalette}>
        <Command size={13} />
        <span>Search files or run a command…</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="tb-right">
        <span className={`conn ${online ? 'on' : status === 'connecting' ? 'wait' : 'off'}`}>
          {online ? <Wifi size={13} /> : status === 'connecting' ? <Loader2 size={13} className="spin" /> : <WifiOff size={13} />}
          {online ? 'Synced' : status === 'connecting' ? 'Connecting' : 'Offline'}
        </span>
        <button className="stack" onClick={onPeople} title={`${peers.length} in this room`}>
          {shown.map((p) => <Avatar key={p.clientId} name={p.user.name} color={p.user.color} size={28} ring={following === p.clientId} />)}
          {peers.length > shown.length && <span className="avatar more">+{peers.length - shown.length}</span>}
        </button>
        <button className="icon-btn" onClick={onTheme} title="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button className="btn btn-soft" onClick={onShare}><UserPlus size={14} /> Share</button>
        <button className="btn btn-run" onClick={onRun} disabled={running}>
          {running ? <Loader2 size={14} className="spin" /> : <Play size={13} fill="currentColor" />}
          {running ? 'Running' : 'Run'}
        </button>
      </div>
    </header>
  );
}
