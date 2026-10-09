import { useEffect, useRef, useState } from 'react';
import { useYObserve } from '../hooks/useCollab.js';
import { askAI } from '../lib/api.js';
import { randomId } from '../lib/user.js';

const AI_ACTIONS = [
  ['explain', 'Explain'],
  ['review', 'Review'],
  ['fix', 'Fix bugs'],
  ['tests', 'Write tests'],
];

function CodeBlock({ src }) {
  const nl = src.indexOf('\n');
  const body = nl > -1 && /^[\w+#-]*$/.test(src.slice(0, nl).trim()) ? src.slice(nl + 1) : src;
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeblock">
      <button className="btn small" onClick={() => navigator.clipboard.writeText(body.trimEnd()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => {})}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="mono">{body.trimEnd()}</pre>
    </div>
  );
}

function Rich({ text }) {
  return text.split('```').map((part, i) =>
    i % 2 ? <CodeBlock key={i} src={part} /> : part.trim() ? <p key={i}>{part.trim()}</p> : null,
  );
}

export default function Sidebar({ collab, user, peers, followId, onFollow, language, aiEnabled, getLastOutput }) {
  const { chat, meta, code, awareness } = collab;
  useYObserve(chat);
  useYObserve(meta);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const busy = meta.get('aiBusy');
  const aiBusy = busy && Date.now() - busy.ts < 60000;
  const hostId = meta.get('host');
  const messages = chat.toArray();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, aiBusy]);

  const push = (m) => {
    collab.ydoc.transact(() => {
      chat.push([{ id: randomId(8), ts: Date.now(), ...m }]);
      if (chat.length > 200) chat.delete(0, chat.length - 200);
    });
  };

  const ask = async (mode, prompt = '') => {
    if (aiBusy) return;
    meta.set('aiBusy', { by: user.name, ts: Date.now() });
    const label = AI_ACTIONS.find(([m]) => m === mode)?.[1] ?? 'Ask';
    push({ author: user.name, color: user.color, text: prompt ? `Ask AI: ${prompt}` : `${label} this code` });
    try {
      const { text: reply } = await askAI({ mode, prompt, code: code.toString(), language, output: getLastOutput() });
      push({ author: 'CodeFusion AI', ai: true, text: reply });
    } catch (e) {
      push({ author: 'CodeFusion AI', ai: true, text: `Could not get an answer: ${e.message}` });
    } finally {
      meta.delete('aiBusy');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    if (aiEnabled && /^\/ai\s+/i.test(t)) ask('ask', t.replace(/^\/ai\s+/i, ''));
    else push({ author: user.name, color: user.color, text: t.slice(0, 1000) });
  };

  return (
    <aside className="sidebar panel">
      <section className="people" aria-label="People in this room">
        <h3>In this room ({peers.length})</h3>
        <ul>
          {peers.map((p) => {
            const me = p.user.id === user.id;
            return (
              <li key={p.user.id}>
                <i className="swatch" style={{ background: p.user.color }} />
                <span className="grow">
                  {p.user.name}
                  {me && <span className="muted"> (you)</span>}
                  {p.user.id === hostId && <span className="tag">host</span>}
                  {p.typing && !me && <span className="muted small"> typing…</span>}
                </span>
                {!me && (
                  <button className={`btn small ${followId === p.user.id ? 'active' : ''}`} onClick={() => onFollow(followId === p.user.id ? null : p.user.id)} title="Scroll along with their cursor">
                    {followId === p.user.id ? 'Following' : 'Follow'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="chat" aria-label="Chat and AI">
        <h3>Chat{aiEnabled ? ' and AI' : ''}</h3>
        <div className="messages" ref={listRef}>
          {messages.length === 0 && (
            <p className="muted small">
              {aiEnabled ? 'Say hi, or use the buttons below to have the AI look at the shared code.' : 'Say hi to the room.'}
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.ai ? 'ai' : ''}`}>
              <div className="msg-author" style={{ color: m.ai ? 'var(--accent)' : m.color }}>{m.author}</div>
              <Rich text={m.text} />
            </div>
          ))}
          {aiBusy && <p className="muted small">CodeFusion AI is answering {busy.by}…</p>}
        </div>
        {aiEnabled ? (
          <div className="ai-actions">
            {AI_ACTIONS.map(([mode, label]) => (
              <button key={mode} className="btn small" disabled={aiBusy} onClick={() => ask(mode)}>{label}</button>
            ))}
          </div>
        ) : (
          <p className="muted small">The AI assistant is off. Set GROQ_API_KEY on the server to turn it on.</p>
        )}
        <form onSubmit={submit} className="chat-form">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={aiEnabled ? 'Message, or /ai your question' : 'Message'} aria-label="Message" maxLength={1000} />
          <button className="btn primary" disabled={!text.trim()}>Send</button>
        </form>
      </section>
    </aside>
  );
}
