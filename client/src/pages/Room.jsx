import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, WifiOff } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import Workspace from '../components/Workspace.jsx';
import { useRoom } from '../hooks/useRoom.js';
import { PALETTE, ROOM_RE, getProfile, saveProfile } from '../lib/utils';

function NameGate({ roomId, onDone }) {
  const [name, setName] = useState('');
  const [color] = useState(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onDone(saveProfile({ name, color }));
  };
  return (
    <div className="gate">
      <div className="bg-aurora a1" /><div className="bg-aurora a2" /><div className="bg-grid" />
      <form className="gate-card" onSubmit={submit}>
        <Logo />
        <h2>You’ve been invited</h2>
        <p>Join <code>{roomId}</code> and start coding together.</p>
        <div className="field-row">
          <Avatar name={name || '?'} color={color} size={38} />
          <input autoFocus value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
        </div>
        <button className="btn btn-primary btn-xl" disabled={!name.trim()}>Join room <ArrowRight size={16} /></button>
      </form>
    </div>
  );
}

function RoomLoader({ roomId, status, timedOut }) {
  const navigate = useNavigate();
  return (
    <div className="gate">
      <div className="bg-aurora a1" /><div className="bg-aurora a2" /><div className="bg-grid" />
      <div className="gate-card center">
        <Logo />
        {timedOut && status !== 'connected' ? (
          <>
            <span className="gate-icon bad"><WifiOff size={22} /></span>
            <h2>Can’t reach the server</h2>
            <p>Make sure the backend is running (<code>npm run dev</code> in the project root), then retry.</p>
            <div className="row">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
              <button className="btn btn-ghost" onClick={() => navigate('/')}>Back home</button>
            </div>
          </>
        ) : (
          <>
            <span className="loader" />
            <h2>Opening workspace…</h2>
            <p><code>{roomId}</code></p>
          </>
        )}
      </div>
    </div>
  );
}

function RoomInner({ roomId, profile }) {
  const { room, status, synced } = useRoom(roomId, profile);
  const [timedOut, setTimedOut] = useState(false);
  const [ready, setReady] = useState(false);

  // Once the first sync lands, keep the workspace mounted even if the socket drops and reconnects.
  useEffect(() => { if (synced) setReady(true); }, [synced]);

  useEffect(() => {
    document.title = `${roomId} · CodeFusion`;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => { clearTimeout(t); document.title = 'CodeFusion — Code together, in real time'; };
  }, [roomId]);

  if (!room || !ready) {
    return <RoomLoader roomId={roomId} status={status} timedOut={timedOut} />;
  }
  return <Workspace roomId={roomId} profile={profile} room={room} status={status} />;
}

export default function Room() {
  const { roomId } = useParams();
  const [profile, setProfile] = useState(getProfile());
  if (!ROOM_RE.test(roomId)) return <Navigate to="/" replace />;
  if (!profile) return <NameGate roomId={roomId} onDone={setProfile} />;
  return <RoomInner key={roomId} roomId={roomId} profile={profile} />;
}
