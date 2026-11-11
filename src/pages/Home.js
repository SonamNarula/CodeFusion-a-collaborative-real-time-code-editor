import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const api = async (path, options = {}) => {
    const response = await fetch(path, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('codefusion_token') || ''}`, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
};

const Home = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ username: '', password: '', roomId: '' });
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            if (!localStorage.getItem('codefusion_token')) {
                const data = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
                localStorage.setItem('codefusion_token', data.token);
            }
            let roomId = form.roomId.trim();
            if (!roomId) roomId = (await api('/api/rooms', { method: 'POST', body: JSON.stringify({ name: 'CodeFusion room' }) })).room.id;
            await api(`/api/rooms/${roomId}/join`, { method: 'POST' });
            navigate(`/editor/${roomId}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    const logout = () => { localStorage.removeItem('codefusion_token'); setForm({ username: '', password: '', roomId: '' }); };
    const authenticated = Boolean(localStorage.getItem('codefusion_token'));

    return (
        <main className="homePageWrapper">
            <section className="formWrapper">
                <img className="homePageLogo" src="/code-sync.png" alt="CodeFusion logo" />
                <h1>CodeFusion</h1>
                <p className="muted">Collaborative coding, built for focused teams.</p>
                {!authenticated ? (
                    <form className="inputGroup" onSubmit={submit}>
                        <div className="tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div>
                        <input className="inputBox" required minLength="3" maxLength="30" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                        <input className="inputBox" required minLength="8" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        <input className="inputBox" placeholder="Existing room ID (optional)" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} />
                        <button className="btn joinBtn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in & enter' : 'Register & enter'}</button>
                    </form>
                ) : (
                    <form className="inputGroup" onSubmit={submit}>
                        <input className="inputBox" placeholder="Room ID (leave empty to create one)" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} />
                        <button className="btn joinBtn" disabled={busy}>{busy ? 'Please wait…' : 'Enter room'}</button>
                        <button type="button" className="textBtn" onClick={logout}>Sign out</button>
                    </form>
                )}
            </section>
        </main>
    );
};

export default Home;
