import React from 'react';
import { GitBranch, Radio, Users } from 'lucide-react';
import { LANG_LABEL } from '../lib/utils';

export default function StatusBar({ status, peerCount, cursor, language, following, followName, onStopFollow }) {
  const online = status === 'connected';
  return (
    <footer className="statusbar">
      <span className={`sb-pill ${online ? 'ok' : 'bad'}`}><i /> {online ? 'Live sync' : 'Offline · edits will sync on reconnect'}</span>
      <span><Users size={12} /> {peerCount} online</span>
      {following != null && (
        <button className="sb-follow" onClick={onStopFollow}><Radio size={12} /> Following {followName} · click to stop</button>
      )}
      <span className="grow" />
      {cursor && <span>Ln {cursor.line}, Col {cursor.column}</span>}
      <span>{LANG_LABEL[language] || 'Plain text'}</span>
      <span>Spaces: 2</span>
      <span>UTF-8</span>
      <span><GitBranch size={12} /> main</span>
    </footer>
  );
}
