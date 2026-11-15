import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { timeOf } from '../lib/utils';

export default function Chat({ items, me, onSend, hidden }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!hidden) endRef.current?.scrollIntoView({ block: 'end' });
  }, [items.length, hidden]);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="chat" hidden={hidden}>
      <div className="chat-list">
        {items.length === 0 && (
          <div className="empty"><MessageSquare size={26} /><b>No messages yet</b><span>Say hello to your collaborators.</span></div>
        )}
        {items.map((m, i) => {
          const mine = m.by === me.id;
          const prev = items[i - 1];
          const grouped = prev && prev.by === m.by && m.ts - prev.ts < 90000;
          return (
            <div key={m.id} className={`msg ${mine ? 'mine' : ''} ${grouped ? 'grouped' : ''}`}>
              {!mine && (grouped ? <span className="avatar-gap" /> : <Avatar name={m.name} color={m.color} size={26} />)}
              <div className="bubble-wrap">
                {!grouped && <div className="meta">{mine ? 'You' : m.name}<span>{timeOf(m.ts)}</span></div>}
                <div className="bubble" style={mine ? undefined : { borderColor: `${m.color}33` }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the room…" maxLength={1000} />
        <button className="btn btn-primary icon-only" disabled={!text.trim()} aria-label="Send"><Send size={15} /></button>
      </form>
    </div>
  );
}
