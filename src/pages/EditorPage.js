import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';

const EditorPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const [room, setRoom] = useState(null);
    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const load = async () => {
            const response = await fetch(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('codefusion_token')}` } });
            if (!response.ok) return navigate('/');
            const data = await response.json();
            setRoom(data.room); codeRef.current = data.room.code; setLanguage(data.room.language);
            socketRef.current = initSocket();
            socketRef.current.on('connect', () => { setConnected(true); socketRef.current.emit(ACTIONS.JOIN, { roomId }); });
            socketRef.current.on('disconnect', () => setConnected(false));
            socketRef.current.on(ACTIONS.JOINED, ({ clients: members }) => setClients(members));
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => { setClients((prev) => prev.filter((client) => client.socketId !== socketId)); toast(`${username} left the room`); });
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
    const copyRoomId = async () => { await navigator.clipboard.writeText(roomId); toast.success('Room ID copied'); };
    if (!room) return <div className="loading">Loading room…</div>;
    return (
        <div className="mainWrap">
            <aside className="aside">
                <div className="asideInner">
                    <img className="logoImage" src="/code-sync.png" alt="CodeFusion" />
                    <div className="roomHeader"><h2>{room.name}</h2><span className={connected ? 'status online' : 'status'}>{connected ? 'Connected' : 'Reconnecting'}</span></div>
                    <label className="fieldLabel" htmlFor="language">Language</label>
                    <select id="language" className="inputBox" value={language} onChange={(e) => changeLanguage(e.target.value)}><option value="javascript">JavaScript</option><option value="python">Python</option><option value="html">HTML</option><option value="json">JSON</option></select>
                    <h3>Participants ({clients.length})</h3>
                    <div className="clientsList">{clients.map((client) => <Client key={client.socketId} username={client.username} />)}</div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>Copy room ID</button>
                <button className="btn leaveBtn" onClick={() => navigate('/')}>Leave room</button>
            </aside>
            <section className="editorWrap"><Editor socketRef={socketRef} roomId={roomId} language={language} initialCode={room.code} onCodeChange={(code) => { codeRef.current = code; }} /></section>
        </div>
    );
};

export default EditorPage;
