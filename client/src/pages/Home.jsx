import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGUAGES, langInfo } from '../lib/languages.js';
import { useTheme } from '../lib/theme.js';
import { cleanName, loadUser, parseRoomInput, randomId, recentRooms, saveName } from '../lib/user.js';

const FEATURES = [
  ['Conflict-free editing', 'Everyone types at once and nothing gets overwritten. Edits made offline merge when you reconnect.'],
  ['Run it together', 'JavaScript runs in your browser. Python, C and C++ run on the server. The output shows up for everyone.'],
  ['AI in the room', 'Ask for an explanation, a review, a bug fix or tests. The answer lands in the shared chat.'],
  ['Session replay', 'Scrub through how the code was written, keystroke by keystroke.'],
  ['Interview mode', 'The host can lock editing, start a shared countdown, and follow a candidate\u2019s cursor.'],
  ['Rooms that stay', 'Close the tab or restart the server. The room and its history are still there.'],
];

export default function Home() {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(() => loadUser().name);
  const [language, setLanguage] = useState('javascript');
  const [join, setJoin] = useState('');
  const recent = recentRooms();
  const nameOk = cleanName(name).length >= 2;
  const joinId = parseRoomInput(join);

  const create = (e) => {
    e.preventDefault();
    if (!nameOk) return;
    saveName(name);
    nav(`/room/${randomId(8)}`, { state: { created: true, language } });
  };
  const joinRoom = (e) => {
    e.preventDefault();
    if (!nameOk || !joinId) return;
    saveName(name);
    nav(`/room/${joinId}`);
  };

  return (
    <div className="home">
      <header className="home-nav">
        <span className="brand"><span className="logo">&lt;/&gt;</span> CodeFusion</span>
        <div className="spacer" />
        <button className="btn" onClick={toggle}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Write code together, at the same time.</h1>
          <p className="lead">Open a room, send the link, and edit one file with a teammate or a candidate. Run it, ask the AI about it, and replay the session afterwards.</p>

          <form className="panel start" onSubmit={create}>
            <label>
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Asha" />
            </label>
            <label>
              Language
              <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
            <button className="btn primary big" disabled={!nameOk}>Create room</button>
          </form>

          <form className="join" onSubmit={joinRoom}>
            <input value={join} onChange={(e) => setJoin(e.target.value)} placeholder="Paste a room link or ID" aria-label="Room link or ID" />
            <button className="btn" disabled={!nameOk || !joinId}>Join</button>
          </form>
          {!nameOk && <p className="muted small">Enter your name (at least 2 characters) to start.</p>}
        </div>

        <div className="demo panel" aria-hidden="true">
          <div className="demo-bar"><i /><i /><i /><span className="muted small mono">main.py</span></div>
          <pre className="mono">
{`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`}
          </pre>
          <span className="demo-cursor c1"><b>Asha</b></span>
          <span className="demo-cursor c2"><b>Dev</b></span>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="recent">
          <h2>Recent rooms</h2>
          <ul>
            {recent.map((r) => (
              <li key={r.id}>
                <Link to={`/room/${r.id}`} className="mono">{r.id}</Link>
                <span className="muted small">{langInfo(r.language).label} · {new Date(r.ts).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="features">
        {FEATURES.map(([title, body]) => (
          <div key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>
      <footer className="muted small">MIT licensed. Built with React, Yjs and Monaco.</footer>
    </div>
  );
}
