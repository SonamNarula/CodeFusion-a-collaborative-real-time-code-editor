import { useState } from 'react';
import { cleanName } from '../lib/user.js';

export default function NameGate({ onSubmit }) {
  const [name, setName] = useState('');
  const ok = cleanName(name).length >= 2;
  return (
    <div className="gate">
      <form
        className="panel gate-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) onSubmit(name);
        }}
      >
        <h2>Join the room</h2>
        <p className="muted">Pick a name so others can see who is typing.</p>
        <input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
        <button className="btn primary" disabled={!ok}>Join room</button>
      </form>
    </div>
  );
}
