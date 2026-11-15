import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Eye, FilePlus2, Files, LogOut, MessageSquare, Moon, NotebookPen, Play, PanelBottom, Radio, Sun, Terminal,
  Users, X, Plus, Link2, PanelLeft, PanelRight, Code2,
} from 'lucide-react';
import CodeEditor from './CodeEditor.jsx';
import RemoteCursorStyles from './RemoteCursorStyles.jsx';
import TopBar from './TopBar.jsx';
import StatusBar from './StatusBar.jsx';
import Explorer from './Explorer.jsx';
import People from './People.jsx';
import BottomPanel from './BottomPanel.jsx';
import Preview from './Preview.jsx';
import MarkdownNotes from './MarkdownNotes.jsx';
import Chat from './Chat.jsx';
import CommandPalette from './CommandPalette.jsx';
import Splitter from './Splitter.jsx';
import FileIcon from './FileIcon.jsx';
import { useTheme, useToast } from './context.jsx';
import { usePeers, useYArray, useYMap } from '../hooks/useRoom.js';
import { monaco, monacoThemeFor, getModelForFile } from '../lib/monacoSetup';
import { runJavaScript, runPython, transpileTypeScript } from '../lib/runners';
import { clamp, copyText, downloadText, langFromName, uid } from '../lib/utils';

const MAX_LINES = 400;

export default function Workspace({ roomId, profile, room, status }) {
  const { doc, awareness } = room;
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggle: toggleTheme } = useTheme();
  const peers = usePeers(awareness);

  // ---- shared state (Yjs) ----
  const filesMap = useMemo(() => doc.getMap('files'), [doc]);
  const consoleArr = useMemo(() => doc.getArray('console'), [doc]);
  const chatArr = useMemo(() => doc.getArray('chat'), [doc]);
  const filesSnap = useYMap(filesMap);
  const entries = useYArray(consoleArr);
  const chat = useYArray(chatArr);

  const files = useMemo(
    () => Object.entries(filesSnap)
      .map(([id, v]) => ({ id, name: v.name, order: v.order || 0 }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [filesSnap]
  );
  const fileIds = useMemo(() => files.map((f) => f.id), [files]);

  // ---- local UI state ----
  const [tabs, setTabs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [sideTab, setSideTab] = useState('files');
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState('preview');
  const [rightW, setRightW] = useState(480);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState('console');
  const [bottomH, setBottomH] = useState(230);
  const [palette, setPalette] = useState(false);
  const [following, setFollowing] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [chatSeen, setChatSeen] = useState(0);
  const [problemCount, setProblemCount] = useState(0);

  const editorRef = useRef(null);
  const tabsRef = useRef(tabs);
  const activeRef = useRef(activeId);
  const runningRef = useRef(false);
  tabsRef.current = tabs;
  activeRef.current = activeId;

  const filesById = useMemo(() => Object.fromEntries(files.map((f) => [f.id, f])), [files]);
  const activeFile = activeId ? filesById[activeId] || null : null;
  const me = awareness.clientID;

  // Keep tabs/active consistent with the shared file list.
  useEffect(() => {
    const ids = new Set(fileIds);
    const nextTabs = tabsRef.current.filter((id) => ids.has(id));
    if (!nextTabs.length && files.length) nextTabs.push(files[0].id);
    const nextActive = ids.has(activeRef.current) ? activeRef.current : nextTabs[0] ?? null;
    if (nextActive && !nextTabs.includes(nextActive)) nextTabs.push(nextActive);
    setTabs(nextTabs);
    setActiveId(nextActive);
  }, [files, fileIds]);

  // Problem counter for the active file.
  useEffect(() => {
    const collect = () => {
      const n = monaco.editor.getModelMarkers({}).filter((m) => activeId && m.resource.path.startsWith(`/${activeId}.`) && m.severity >= monaco.MarkerSeverity.Warning).length;
      setProblemCount(n);
    };
    collect();
    const sub = monaco.editor.onDidChangeMarkers(collect);
    return () => sub.dispose();
  }, [activeId]);

  // ---- file operations ----
  const openFile = useCallback((id, fromFollow = false) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActiveId(id);
    if (!fromFollow) setFollowing(null);
  }, []);

  const closeTab = (id) => {
    const idx = tabs.indexOf(id);
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (activeId === id) setActiveId(next[Math.max(0, idx - 1)] ?? null);
  };

  const createFile = useCallback((raw) => {
    const name = raw.trim().replace(/[\\/]/g, '-');
    if (!name) return;
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) return toast(`“${name}” already exists`, 'error');
    const id = `f_${uid()}`;
    doc.transact(() => filesMap.set(id, { name, order: Date.now() }));
    openFile(id);
  }, [files, doc, filesMap, openFile, toast]);

  const renameFile = (id, raw) => {
    const name = raw.trim().replace(/[\\/]/g, '-');
    const cur = filesById[id];
    if (!name || !cur || name === cur.name) return;
    if (files.some((f) => f.id !== id && f.name.toLowerCase() === name.toLowerCase())) return toast(`“${name}” already exists`, 'error');
    filesMap.set(id, { name, order: cur.order });
  };

  const deleteFile = (id) => {
    doc.transact(() => {
      const t = doc.getText(`file:${id}`);
      t.delete(0, t.length);
      filesMap.delete(id);
    });
    toast('File deleted');
  };

  const downloadFile = (f) => downloadText(f.name, doc.getText(`file:${f.id}`).toString());

  // ---- sharing ----
  const copyInvite = useCallback(async () => {
    const ok = await copyText(`${location.origin}/room/${roomId}`);
    toast(ok ? 'Invite link copied' : 'Couldn’t copy. Copy it from the address bar', ok ? 'success' : 'error');
  }, [roomId, toast]);
  const copyRoomId = async () => { await copyText(roomId); toast('Room ID copied', 'success'); };

  // ---- chat ----
  const sendChat = (text) => {
    doc.transact(() => {
      chatArr.push([{ id: uid(), by: me, name: profile.name, color: profile.color, text, ts: Date.now() }]);
      if (chatArr.length > 300) chatArr.delete(0, chatArr.length - 300);
    });
  };
  const chatVisible = rightOpen && rightTab === 'chat';
  useEffect(() => { if (chatVisible) setChatSeen(chat.length); }, [chatVisible, chat.length]);
  const unread = chatVisible ? 0 : chat.slice(chatSeen).filter((m) => m.by !== me).length;

  // ---- running code ----
  const runActive = useCallback(async () => {
    if (runningRef.current) return;
    const file = filesById[activeRef.current];
    if (!file) return toast('Open a file to run it', 'info');
    const lang = langFromName(file.name);
    const code = doc.getText(`file:${file.id}`).toString();

    if (lang === 'html' || lang === 'css') {
      setRightOpen(true);
      setRightTab('preview');
      setPreviewNonce((n) => n + 1);
      return toast('Preview refreshed', 'success');
    }

    runningRef.current = true;
    setRunning(true);
    setBottomOpen(true);
    setBottomTab('console');
    const lines = [];
    const started = performance.now();
    setLive({ file: file.name, lines: [] });
    const onLine = (k, t) => {
      if (lines.length >= MAX_LINES) return;
      const line = { k: k === 'warn' || k === 'error' || k === 'info' ? k : 'log', t: String(t).slice(0, 4000) };
      lines.push(line);
      setLive({ file: file.name, lines: [...lines] });
    };

    let ok = true;
    try {
      if (lang === 'javascript') {
        ok = await runJavaScript(code, onLine);
      } else if (lang === 'typescript') {
        const model = getModelForFile(file.id);
        if (!model) throw new Error('Open the file once before running it.');
        ok = await runJavaScript(await transpileTypeScript(model), onLine);
      } else if (lang === 'python') {
        ok = await runPython(code, onLine);
      } else if (lang === 'json') {
        JSON.parse(code);
        onLine('log', 'Valid JSON ✓');
      } else {
        ok = false;
        onLine('error', `There’s no in-browser runtime for ${file.name}. JavaScript, TypeScript, Python, HTML and CSS can run here.`);
      }
    } catch (err) {
      ok = false;
      onLine('error', err.message || String(err));
    }

    doc.transact(() => {
      consoleArr.push([{
        id: uid(), file: file.name, lang, ok, ts: Date.now(), ms: Math.round(performance.now() - started),
        by: { name: profile.name, color: profile.color }, lines,
      }]);
      if (consoleArr.length > 40) consoleArr.delete(0, consoleArr.length - 40);
    });
    setLive(null);
    runningRef.current = false;
    setRunning(false);
  }, [filesById, doc, consoleArr, profile, toast]);

  const runRef = useRef(runActive);
  runRef.current = runActive;

  // ---- follow mode ----
  useEffect(() => {
    if (following == null) return;
    const target = peers.find((p) => p.clientId === following);
    if (!target) { setFollowing(null); toast('The person you were following left', 'info'); return; }
    const c = target.cursor;
    if (!c || !c.file || !filesById[c.file]) return;
    if (c.file !== activeRef.current) openFile(c.file, true);
    const t = setTimeout(() => editorRef.current?.revealLineInCenterIfOutsideViewport(c.line), 80);
    return () => clearTimeout(t);
  }, [peers, following]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'k') { e.preventDefault(); setPalette((p) => !p); }
      else if (k === 'b') { e.preventDefault(); setSideOpen((s) => !s); }
      else if (k === 'j') { e.preventDefault(); setBottomOpen((b) => !b); }
      else if (k === 'enter') { e.preventDefault(); runRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showRight = (tab) => { setRightOpen(true); setRightTab(tab); };
  const showSide = (tab) => { if (sideOpen && sideTab === tab) setSideOpen(false); else { setSideOpen(true); setSideTab(tab); } };
  const followName = peers.find((p) => p.clientId === following)?.user.name;

  // ---- command palette ----
  const actions = useMemo(() => {
    const list = [
      { id: 'run', group: 'Run', label: 'Run active file', icon: <Play size={15} />, kbd: 'Ctrl ↵', run: () => runRef.current() },
      { id: 'new', group: 'File', label: 'New file…', icon: <FilePlus2 size={15} />, run: () => { setSideOpen(true); setSideTab('files'); const n = window.prompt('File name (e.g. app.js)'); if (n) createFile(n); } },
      { id: 'dl', group: 'File', label: 'Download active file', icon: <Download size={15} />, run: () => activeFile && downloadFile(activeFile) },
      { id: 'prev', group: 'View', label: 'Show live preview', icon: <Eye size={15} />, run: () => showRight('preview') },
      { id: 'notes', group: 'View', label: 'Show shared notes', icon: <NotebookPen size={15} />, run: () => showRight('notes') },
      { id: 'chat', group: 'View', label: 'Show room chat', icon: <MessageSquare size={15} />, run: () => showRight('chat') },
      { id: 'right', group: 'View', label: 'Toggle right panel', icon: <PanelRight size={15} />, run: () => setRightOpen((o) => !o) },
      { id: 'bottom', group: 'View', label: 'Toggle console panel', icon: <PanelBottom size={15} />, kbd: 'Ctrl J', run: () => setBottomOpen((o) => !o) },
      { id: 'side', group: 'View', label: 'Toggle sidebar', icon: <PanelLeft size={15} />, kbd: 'Ctrl B', run: () => setSideOpen((o) => !o) },
      { id: 'people', group: 'View', label: 'Show people', icon: <Users size={15} />, run: () => { setSideOpen(true); setSideTab('people'); } },
      { id: 'theme', group: 'Preferences', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />, run: toggleTheme },
      { id: 'invite', group: 'Room', label: 'Copy invite link', icon: <Link2 size={15} />, run: copyInvite },
      { id: 'leave', group: 'Room', label: 'Leave room', icon: <LogOut size={15} />, run: () => navigate('/') },
    ];
    files.forEach((f) => list.push({ id: `open-${f.id}`, group: 'Go to file', label: f.name, icon: <Code2 size={15} />, run: () => openFile(f.id) }));
    peers.filter((p) => !p.isSelf).forEach((p) => list.push({
      id: `follow-${p.clientId}`, group: 'Collaboration',
      label: following === p.clientId ? `Stop following ${p.user.name}` : `Follow ${p.user.name}`,
      icon: <Radio size={15} />, run: () => setFollowing(following === p.clientId ? null : p.clientId),
    }));
    return list;
  }, [files, peers, following, theme, activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearConsole = () => doc.transact(() => consoleArr.delete(0, consoleArr.length));

  return (
    <div className="ws">
      <TopBar
        roomId={roomId} status={status} peers={peers} theme={theme} onTheme={toggleTheme}
        onRun={runActive} running={running} onShare={copyInvite} onPalette={() => setPalette(true)}
        onPeople={() => { setSideOpen(true); setSideTab('people'); }} onCopyRoom={copyRoomId} following={following}
      />

      <div className="ws-main">
        <nav className="rail">
          <button className={sideOpen && sideTab === 'files' ? 'on' : ''} onClick={() => showSide('files')} title="Explorer"><Files size={19} /></button>
          <button className={sideOpen && sideTab === 'people' ? 'on' : ''} onClick={() => showSide('people')} title="People"><Users size={19} /><i className="badge">{peers.length}</i></button>
          <span className="grow" />
          <button className={bottomOpen ? 'on' : ''} onClick={() => setBottomOpen((b) => !b)} title="Console (Ctrl J)"><Terminal size={19} /></button>
          <button onClick={() => setPalette(true)} title="Command palette (Ctrl K)"><span className="rail-k">⌘K</span></button>
        </nav>

        {sideOpen && (
          <aside className="sidebar">
            {sideTab === 'files' ? (
              <Explorer files={files} activeId={activeId} peers={peers} onOpen={openFile} onCreate={createFile} onRename={renameFile} onDelete={deleteFile} onDownload={downloadFile} />
            ) : (
              <People peers={peers} files={files} following={following} onFollow={setFollowing} onInvite={copyInvite} roomId={roomId} />
            )}
          </aside>
        )}

        <section className="center">
          <div className="tabs">
            {tabs.map((id) => filesById[id] && (
              <div key={id} className={`tab ${id === activeId ? 'on' : ''}`} onClick={() => openFile(id)}>
                <FileIcon name={filesById[id].name} />
                <span>{filesById[id].name}</span>
                <button onClick={(e) => { e.stopPropagation(); closeTab(id); }} aria-label="Close tab"><X size={12} /></button>
              </div>
            ))}
            <button className="tab-add" onClick={() => { setSideOpen(true); setSideTab('files'); const n = window.prompt('File name (e.g. app.js)'); if (n) createFile(n); }} title="New file"><Plus size={14} /></button>
          </div>

          <div className="editor-wrap">
            <CodeEditor
              doc={doc} awareness={awareness} file={activeFile} fileIds={fileIds} theme={monacoThemeFor(theme)}
              onEditor={(e) => { editorRef.current = e; }} onCursor={setCursor} onRun={() => runRef.current()}
            />
            {!activeFile && (
              <div className="editor-empty">
                <Code2 size={34} />
                <h3>No file open</h3>
                <p>Pick a file from the explorer, or create a new one.</p>
                <button className="btn btn-soft" onClick={() => { const n = window.prompt('File name (e.g. app.js)'); if (n) createFile(n); }}><FilePlus2 size={14} /> New file</button>
              </div>
            )}
          </div>

          {bottomOpen && (
            <>
              <Splitter dir="y" onDrag={(d) => setBottomH((h) => clamp(h - d, 120, 520))} />
              <div style={{ height: bottomH, flex: 'none' }}>
                <BottomPanel
                  tab={bottomTab} onTab={setBottomTab} entries={entries} live={live} onClear={clearConsole}
                  activeId={activeId} activeName={activeFile?.name} onClose={() => setBottomOpen(false)} problemCount={problemCount}
                />
              </div>
            </>
          )}
        </section>

        <div style={{ display: rightOpen ? 'contents' : 'none' }}>
          <Splitter dir="x" onDrag={(d) => setRightW((w) => clamp(w - d, 320, 860))} />
          <aside className="right" style={{ width: rightW }}>
            <div className="right-tabs">
              <button className={rightTab === 'preview' ? 'on' : ''} onClick={() => setRightTab('preview')}><Eye size={14} /> Preview</button>
              <button className={rightTab === 'notes' ? 'on' : ''} onClick={() => setRightTab('notes')}><NotebookPen size={14} /> Notes</button>
              <button className={rightTab === 'chat' ? 'on' : ''} onClick={() => setRightTab('chat')}><MessageSquare size={14} /> Chat{unread > 0 && <b>{unread}</b>}</button>
              <span className="grow" />
              <button className="icon-btn sm" onClick={() => setRightOpen(false)} title="Hide panel"><X size={14} /></button>
            </div>
            <div className="right-body">
              <Preview doc={doc} files={files} nonce={previewNonce} hidden={rightTab !== 'preview'} />
              <MarkdownNotes doc={doc} awareness={awareness} theme={monacoThemeFor(theme)} hidden={rightTab !== 'notes'} />
              <Chat items={chat} me={{ id: me }} onSend={sendChat} hidden={rightTab !== 'chat'} />
            </div>
          </aside>
        </div>
        {!rightOpen && (
          <button className="right-reopen" onClick={() => setRightOpen(true)} title="Show preview / notes / chat"><PanelRight size={16} /></button>
        )}
      </div>

      <StatusBar
        status={status} peerCount={peers.length} cursor={cursor} language={activeFile ? langFromName(activeFile.name) : null}
        following={following} followName={followName} onStopFollow={() => setFollowing(null)}
      />
      <CommandPalette open={palette} onClose={() => setPalette(false)} actions={actions} />
      <RemoteCursorStyles peers={peers} />
    </div>
  );
}
