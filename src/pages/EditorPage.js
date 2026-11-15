import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import Icon from '../components/Icons';
import { initSocket } from '../socket';

const starterCode = `// Welcome to CodeFusion
// Edit this file with your team in real time.

const greeting = 'Hello from CodeFusion';
console.log(greeting);
`;

const EditorPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const [room, setRoom] = useState(null);
    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [connected, setConnected] = useState(false);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState('');
    const [activePanel, setActivePanel] = useState('output');
    const [theme, setTheme] = useState(() => localStorage.getItem('codefusion_theme') || 'fusion');

    useEffect(() => {
        const load = async () => {
            const response = await fetch(`/api/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('codefusion_token')}` },
            });
            if (!response.ok) return navigate('/');
            const data = await response.json();
            const savedCode = typeof data.room.code === 'string' ? data.room.code : '';
            const initialCode = savedCode.trim() ? savedCode : starterCode;
            setRoom({ ...data.room, code: initialCode });
            codeRef.current = initialCode;
            setLanguage(data.room.language);
            socketRef.current = initSocket();
            socketRef.current.on('connect', () => {
                setConnected(true);
                socketRef.current.emit(ACTIONS.JOIN, { roomId });
            });
            socketRef.current.on('disconnect', () => setConnected(false));
            socketRef.current.on(ACTIONS.JOINED, ({ clients: members }) => setClients(members));
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                toast(`${username} left the workspace`);
            });
            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language: next }) => setLanguage(next));
            socketRef.current.on(ACTIONS.ERROR, ({ message }) => { toast.error(message); navigate('/'); });
        };
        load().catch(() => navigate('/'));
        return () => socketRef.current?.disconnect();
    }, [roomId, navigate]);

    const changeLanguage = (next) => {
        setLanguage(next);
        socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: next });
    };
    const changeTheme = (next) => {
        setTheme(next);
        localStorage.setItem('codefusion_theme', next);
    };

    const runCode = () => {
        if (language !== 'javascript' && language !== 'json') {
            setOutput(`${language.toUpperCase()} execution is not enabled yet.\nYour code is safely synchronized and ready to run in a backend sandbox.`);
            setActivePanel('output');
            return;
        }
        setRunning(true);
        setOutput('');
        const logs = [];
        const originalLog = console.log;
        try {
            console.log = (...args) => logs.push(args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
            if (language === 'json') JSON.parse(codeRef.current || '{}');
            else Function(`"use strict";\n${codeRef.current || ''}`)();
            setOutput(logs.length ? logs.join('\n') : '✓ Executed successfully with no console output.');
        } catch (error) {
            setOutput(`✕ ${error.name}: ${error.message}`);
        } finally {
            console.log = originalLog;
            setRunning(false);
            setActivePanel('output');
        }
    };

    const copyRoomId = async () => { await navigator.clipboard.writeText(roomId); toast.success('Room ID copied'); };
    if (!room) return <div className="loading"><span className="loader" />Opening workspace…</div>;
    const isLight = theme === 'eclipse' || theme === 'solarized light' || theme === 'fusion-light';
    const langBadge = language === 'javascript' ? 'JS' : language.slice(0, 2).toUpperCase();
    const outputState = /^✕/.test(output) ? 'error' : output ? 'ok' : '';
    return (
        <div className={`ideShell ${isLight ? 'light' : 'dark'}`}>
            <header className="ideTopbar">
                <div className="brand"><span className="brandMark"><Icon name="logo" size={14} /></span><span>Code<span>Fusion</span></span></div>
                <div className="crumbs"><span>Workspaces</span><b>/</b><strong>{room.name}</strong></div>
                <div className="topActions">
                    <span className={connected ? 'connection online' : 'connection'}><i />{connected ? 'Synced' : 'Reconnecting…'}</span>
                    <div className="presenceStack" title={`${clients.length} online`}>
                        {clients.slice(0, 4).map((c) => <span key={c.socketId} className="stackAvatar">{c.username.slice(0, 1).toUpperCase()}</span>)}
                        {clients.length > 4 && <span className="stackAvatar more">+{clients.length - 4}</span>}
                    </div>
                    <label className="themePicker" title="Change editor theme"><Icon name="palette" size={14} />
                        <select value={theme} onChange={(e) => changeTheme(e.target.value)} aria-label="Theme">
                            <option value="fusion">CodeFusion Midnight</option>
                            <option value="fusion-light">CodeFusion Daylight</option>
                            <option value="dracula">Dracula</option>
                            <option value="monokai">Monokai</option>
                            <option value="material">Material</option>
                            <option value="solarized dark">Solarized Dark</option>
                            <option value="eclipse">Eclipse Light</option>
                            <option value="solarized light">Solarized Light</option>
                        </select>
                    </label>
                    <button className="shareButton" title="Copy room ID" onClick={copyRoomId}><Icon name="link" size={14} />Share</button>
                </div>
            </header>
            <div className="ideBody">
                <aside className="activityBar">
                    <button className="activityActive" title="Explorer"><Icon name="files" size={19} /></button>
                    <button title="Collaborators"><Icon name="users" size={19} /></button>
                    <button title="Source control"><Icon name="branch" size={19} /></button>
                    <div className="activityBottom"><button title="Settings"><Icon name="settings" size={19} /></button></div>
                </aside>
                <aside className="workspaceSidebar">
                    <div className="sidebarHeading"><span>EXPLORER</span><button title="New file"><Icon name="plus" size={14} /></button></div>
                    <div className="workspaceTitle"><Icon name="chevron" size={12} /> {room.name}</div>
                    <div className="fileRow activeFile"><span className="fileIcon">{langBadge}</span> main.{language === 'javascript' ? 'js' : language} <span className="fileDot" /></div>
                    <div className="sidebarSection">
                        <div className="sidebarHeading"><span>COLLABORATORS <b>{clients.length}</b></span></div>
                        <div className="collaborators">{clients.map((client) => <Client key={client.socketId} username={client.username} />)}</div>
                    </div>
                    <div className="sidebarBottom">
                        <div className="roomCode"><span>ROOM ID</span><button onClick={copyRoomId}>{roomId.slice(0, 8)}… <Icon name="copy" size={12} /></button></div>
                        <button className="leaveWorkspace" onClick={() => navigate('/')}><Icon name="logout" size={14} />Leave workspace</button>
                    </div>
                </aside>
                <main className="editorMain">
                    <div className="editorTabs">
                        <div className="editorTab"><span className="fileIcon">{langBadge}</span> main.{language === 'javascript' ? 'js' : language}<button title="Close"><Icon name="x" size={12} /></button></div>
                        <div className="editorTabSpacer" />
                        <span className="saveStatus"><Icon name="check" size={12} /> All changes saved</span>
                    </div>
                    <div className="editorToolbar">
                        <div className="languageSelect">
                            <span className="languageBadge">{langBadge}</span>
                            <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
                                <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="csharp">C#</option><option value="go">Go</option><option value="rust">Rust</option><option value="html">HTML</option><option value="css">CSS</option><option value="json">JSON</option><option value="sql">SQL</option><option value="markdown">Markdown</option><option value="shell">Shell</option>
                            </select>
                        </div>
                        <div className="toolbarActions">
                            <button className="runButton" onClick={runCode} disabled={running}><Icon name="play" size={12} />{running ? 'Running…' : 'Run code'}</button>
                        </div>
                    </div>
                    <div className="editorCanvas"><Editor socketRef={socketRef} roomId={roomId} language={language} theme={theme} initialCode={room.code} onCodeChange={(code) => { codeRef.current = code; }} /></div>
                    <section className="outputPanel">
                        <div className="outputTabs">
                            <button className={activePanel === 'output' ? 'selected' : ''} onClick={() => setActivePanel('output')}><Icon name="terminal" size={13} />OUTPUT</button>
                            <button className={activePanel === 'problems' ? 'selected' : ''} onClick={() => setActivePanel('problems')}>PROBLEMS <b>0</b></button>
                            <span />
                            <button className="clearButton" onClick={() => setOutput('')}>Clear</button>
                        </div>
                        {activePanel === 'output' ? <pre className={`outputText ${outputState}`}>{output || 'Run your code to see output here.'}</pre> : <div className="emptyPanel">No problems detected.</div>}
                    </section>
                </main>
            </div>
            <footer className="ideStatusbar"><span><Icon name="branch" size={11} /> main</span><span>UTF-8</span><span>{language}</span><span>Spaces: 4</span><span className="statusSpacer" /><span className={connected ? 'syncOn' : ''}>{connected ? '● Live sync' : '○ Offline'}</span><span>CodeFusion Cloud</span></footer>
        </div>
    );
};

export default EditorPage;
