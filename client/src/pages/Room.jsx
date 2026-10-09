import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useCollab, usePeers, useYObserve } from '../hooks/useCollab.js';
import { getConfig, runRemote } from '../lib/api.js';
import { runJS } from '../lib/jsRunner.js';
import { TEMPLATES, langInfo } from '../lib/languages.js';
import { isRoomId, loadUser, rememberRoom, saveName } from '../lib/user.js';
import { useTheme } from '../lib/theme.js';
import CodeEditor from '../components/CodeEditor.jsx';
import NameGate from '../components/NameGate.jsx';
import OutputPanel from '../components/OutputPanel.jsx';
import ReplayModal from '../components/ReplayModal.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function Room() {
  const { roomId } = useParams();
  const loc = useLocation();
  const [user, setUser] = useState(loadUser);
  if (!isRoomId(roomId)) return <Navigate to="/" replace />;
  if (!user.name) {
    return <NameGate onSubmit={(n) => { saveName(n); setUser(loadUser()); }} />;
  }
  return <RoomView key={roomId} roomId={roomId} user={user} created={!!loc.state?.created} startLang={loc.state?.language} />;
}

function RoomView({ roomId, user, created, startLang }) {
  const { theme, toggle } = useTheme();
  const { collab, status } = useCollab(roomId, user);
  useYObserve(collab?.meta);
  useYObserve(collab?.run);
  const peers = usePeers(collab?.awareness);

  const [cfg, setCfg] = useState({ runnable: [], ai: false });
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [replay, setReplay] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { getConfig().then(setCfg); }, []);

  const meta = collab?.meta;
  const language = meta?.get('language') || startLang || 'javascript';
  const hostId = meta?.get('host');
  const isHost = hostId === user.id;
  const locked = !!meta?.get('locked');
  const readOnly = locked && !isHost;
  const hostPresent = peers.some((p) => p.user.id === hostId);
  const canClaimHost = !!hostId && !isHost && !hostPresent && peers.length > 0;
  const timer = meta?.get('timer') || null;
  const lastRun = collab?.run.get('last');
  const canRun = language === 'javascript' || cfg.runnable.includes(language);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  // First sync: the creator seeds the starter file; whoever arrives at a host-less room claims it.
  useEffect(() => {
    if (!collab) return undefined;
    const { provider, ydoc, meta: m, code } = collab;
    const init = () => {
      ydoc.transact(() => {
        if (created && !m.get('initialized')) {
          const lang = startLang || 'javascript';
          m.set('initialized', true);
          m.set('language', lang);
          if (code.length === 0) code.insert(0, TEMPLATES[lang] ?? '');
        }
        if (!m.get('host')) m.set('host', user.id);
      });
    };
    if (provider.synced) { init(); return undefined; }
    const onSync = (synced) => { if (synced) { init(); provider.off('sync', onSync); } };
    provider.on('sync', onSync);
    return () => provider.off('sync', onSync);
  }, [collab, created, startLang, user.id]);

  useEffect(() => { rememberRoom(roomId, language); }, [roomId, language]);

  const setLanguage = (next) => {
    const { ydoc, code, meta: m } = collab;
    ydoc.transact(() => {
      const prev = m.get('language');
      // Swap the starter snippet only if nobody has edited it yet
      if (code.toString() === TEMPLATES[prev] && TEMPLATES[next]) {
        code.delete(0, code.length);
        code.insert(0, TEMPLATES[next]);
      }
      m.set('language', next);
    });
  };

  const run = async () => {
    if (!collab || running || !canRun) return;
    setRunning(true);
    const started = performance.now();
    let res;
    try {
      const src = collab.code.toString();
      res = language === 'javascript' ? await runJS(src) : await runRemote(language, src, stdin);
    } catch (e) {
      res = { stdout: '', stderr: e.message, code: 1 };
    }
    collab.run.set('last', { ...res, by: user.name, lang: language, ms: Math.round(performance.now() - started), ts: Date.now() });
    setRunning(false);
  };
  const runRef = useRef(run);
  runRef.current = run;

  const copyInvite = () => navigator.clipboard.writeText(location.href).then(() => flash('Invite link copied')).catch(() => flash('Copy failed'));
  const download = () => {
    const url = URL.createObjectURL(new Blob([collab.code.toString()], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `main.${langInfo(language).ext}` });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!collab) return <div className="splash">Connecting…</div>;

  return (
    <div className="room">
      <Topbar
        roomId={roomId} status={status} language={language} readOnly={readOnly}
        onLanguage={setLanguage} canRun={canRun} running={running} onRun={() => runRef.current()}
        isHost={isHost} canClaimHost={canClaimHost} onClaimHost={() => meta.set('host', user.id)} locked={locked} onToggleLock={() => meta.set('locked', !locked)}
        timer={timer} onSetTimer={(min) => (min ? meta.set('timer', { end: Date.now() + min * 60000, minutes: min }) : meta.delete('timer'))}
        onReplay={() => setReplay(true)} onDownload={download} onCopy={copyInvite}
        theme={theme} onToggleTheme={toggle}
      />
      <div className="workspace">
        <main className="editor-col">
          {readOnly && <div className="banner">The host locked editing. You can watch and chat, but not edit.</div>}
          <div className="editor-wrap">
            <CodeEditor collab={collab} language={language} readOnly={readOnly} theme={theme} followId={followId} onRun={() => runRef.current()} />
          </div>
          <OutputPanel
            result={lastRun} running={running} stdin={stdin} onStdin={setStdin}
            showStdin={language !== 'javascript'} onClear={() => collab.run.delete('last')}
          />
        </main>
        <Sidebar
          collab={collab} user={user} peers={peers} followId={followId} onFollow={setFollowId}
          language={language} aiEnabled={cfg.ai}
          getLastOutput={() => (lastRun ? [lastRun.stdout, lastRun.stderr].filter(Boolean).join('\n') : '')}
        />
      </div>
      {replay && <ReplayModal roomId={roomId} theme={theme} onClose={() => setReplay(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}