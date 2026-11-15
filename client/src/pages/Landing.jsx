import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Code2, Eye, Layers, MessageSquare, MousePointer2, Play, Radio, Shield, Sparkles, Terminal, Users, Zap, Moon, Sun,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import { useTheme, useToast } from '../components/context.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { PALETTE, ROOM_RE, getProfile, normalizeRoomInput, randomRoomId, saveProfile } from '../lib/utils';

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

const FEATURES = [
  { icon: MousePointer2, title: 'Live cursors & selections', text: 'See every collaborator’s caret and highlight in their own colour, name-tagged, with zero lag and no merge conflicts.', wide: true },
  { icon: Layers, title: 'Multi-file workspace', text: 'Create, rename and organise files together. The whole project stays in sync.' },
  { icon: Terminal, title: 'Run in the browser', text: 'JavaScript, TypeScript and Python execute locally. Output lands in a console everyone shares.' },
  { icon: Eye, title: 'Live preview', text: 'HTML, CSS and JS render instantly beside your code, with device-width toggles.' },
  { icon: Radio, title: 'Follow mode', text: 'Click a teammate and your editor tracks their cursor across files. Perfect for walkthroughs.' },
  { icon: MessageSquare, title: 'Notes & chat built in', text: 'A markdown notepad and room chat keep context next to the code.', wide: true },
];

function HeroMock() {
  return (
    <div className="mock">
      <div className="mock-glow" />
      <div className="mock-window">
        <div className="mock-bar">
          <i /><i /><i />
          <div className="mock-tabs"><span className="on">index.js</span><span>style.css</span><span>notes.md</span></div>
          <div className="mock-people">
            <span style={{ background: '#22d3ee' }}>A</span><span style={{ background: '#f472b6' }}>M</span><span style={{ background: '#34d399' }}>K</span>
          </div>
        </div>
        <pre className="mock-code">
          <span className="ln">1</span><span className="k">import</span> {'{'} connect {'}'} <span className="k">from</span> <span className="s">'codefusion'</span>;{'\n'}
          <span className="ln">2</span>{'\n'}
          <span className="ln">3</span><span className="k">const</span> room = <span className="f">connect</span>(<span className="s">'launch-day'</span>);{'\n'}
          <span className="ln">4</span>room.<span className="f">on</span>(<span className="s">'edit'</span>, (change) =&gt; {'{'}{'\n'}
          <span className="ln">5</span>{'  '}editor.<span className="f">apply</span>(change);{'\n'}
          <span className="ln">6</span>{'  '}<span className="c">// everyone stays in sync</span>{'\n'}
          <span className="ln">7</span>{'}'});{'\n'}
          <span className="cursor c1"><em>Aarav</em></span>
          <span className="cursor c2"><em>Mia</em></span>
          <span className="sel" />
        </pre>
        <div className="mock-console">
          <span className="dot" /> Aarav ran <b>index.js</b> <span className="ok">✓ 12ms</span>
          <div>Hello from CodeFusion 👋</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const existing = getProfile();
  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState('');
  const [color] = useState(existing?.color || PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  const enter = (roomId) => {
    if (!name.trim()) return toast('Pick a display name first', 'error');
    saveProfile({ name, color });
    navigate(`/room/${roomId}`);
  };
  const create = () => enter(randomRoomId());
  const join = (e) => {
    e.preventDefault();
    const id = normalizeRoomInput(code);
    if (!ROOM_RE.test(id)) return toast('That doesn’t look like a valid room code', 'error');
    enter(id);
  };

  return (
    <div className="landing">
      <div className="bg-aurora a1" /><div className="bg-aurora a2" /><div className="bg-grid" />

      <header className="l-nav">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <a className="btn btn-ghost" href="#start">Start coding</a>
        </nav>
      </header>

      <section className="hero" id="start">
        <div className="hero-copy">
          <span className="pill"><Sparkles size={13} /> Real-time · Multiplayer · Browser-native</span>
          <h1>Code together,<br /><em>in perfect sync.</em></h1>
          <p>A premium workspace where your whole team edits, runs and previews code at the same moment. No installs, no accounts. Just a link.</p>

          <div className="start-card">
            <label className="field">
              <span>Your display name</span>
              <div className="field-row">
                <Avatar name={name || '?'} color={color} size={34} />
                <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya" onKeyDown={(e) => e.key === 'Enter' && create()} />
              </div>
            </label>
            <button className="btn btn-primary btn-xl" onClick={create}>
              <Zap size={17} fill="currentColor" /> Create a new room <ArrowRight size={17} />
            </button>
            <div className="or"><span>or join an existing room</span></div>
            <form className="join-row" onSubmit={join}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Room code or invite link" />
              <button className="btn btn-soft" type="submit">Join <ArrowRight size={15} /></button>
            </form>
          </div>

          <ul className="hero-points">
            <li><Shield size={14} /> Rooms are private to people with the link</li>
            <li><Play size={14} /> JS · TS · Python run in-browser</li>
            <li><Users size={14} /> Unlimited collaborators</li>
          </ul>
        </div>
        <HeroMock />
      </section>

      <section className="section" id="features">
        <Reveal className="section-head">
          <span className="eyebrow">Everything in one room</span>
          <h2>A complete workspace,<br /><em>built for pairing.</em></h2>
        </Reveal>
        <div className="bento">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} className={`bento-card ${f.wide ? 'wide' : ''}`} delay={i * 60}>
              <span className="bento-icon"><f.icon size={20} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <Reveal className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>From idea to pairing<br /><em>in ten seconds.</em></h2>
        </Reveal>
        <div className="steps">
          {[
            ['01', 'Create a room', 'Choose a name and spin up a fresh workspace with a starter project.'],
            ['02', 'Share the link', 'Send the invite to teammates, interviewees or friends. They join instantly.'],
            ['03', 'Build together', 'Edit, run, preview and chat. Rooms are saved and waiting when you return.'],
          ].map(([n, t, d], i) => (
            <Reveal key={n} className="step" delay={i * 90}><b>{n}</b><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="cta">
        <Code2 size={28} />
        <h2>Ready when you are.</h2>
        <p>Open a room and invite someone. It takes less time than reading this sentence.</p>
        <a href="#start" className="btn btn-primary btn-xl">Start a room <ArrowRight size={17} /></a>
      </Reveal>

      <footer className="l-foot"><Logo size={22} /><span>Designed for deep work and fast feedback.</span></footer>
    </div>
  );
}
