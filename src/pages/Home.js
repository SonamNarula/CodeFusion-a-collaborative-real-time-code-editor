import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const api = async (path, options = {}) => {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('codefusion_token') || ''}`,
            ...options.headers,
        },
    });
    const data = await response.json();
    if (response.status === 401) {
        localStorage.removeItem('codefusion_token');
        throw new Error('Your session expired. Please sign in again.');
    }
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
            const token = localStorage.getItem('codefusion_token');
            if (!token) {
                const data = await api(`/api/auth/${mode}`, {
                    method: 'POST',
                    body: JSON.stringify(form),
                });
                localStorage.setItem('codefusion_token', data.token);
            }
            let roomId = form.roomId.trim();
            if (!roomId) {
                roomId = (await api('/api/rooms', {
                    method: 'POST',
                    body: JSON.stringify({ name: 'CodeFusion workspace' }),
                })).room.id;
            }
            await api(`/api/rooms/${roomId}/join`, { method: 'POST' });
            navigate(`/editor/${roomId}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

    return (
        <main className="landing">
            <div className="aurora auroraOne" />
            <div className="aurora auroraTwo" />
            <nav className="landingNav">
                <div className="brand"><span className="brandMark">⌘</span><span>Code<span>Fusion</span></span></div>
                <div className="navPill"><span className="liveDot" /> Live collaboration, reimagined</div>
            </nav>
            <section className="hero">
                <div className="heroCopy">
                    <div className="eyebrow"><span className="sparkle">✦</span> THE MODERN COLLABORATIVE IDE</div>
                    <h1>Build together.<br /><em>Ship brilliantly.</em></h1>
                    <p className="heroText">A beautiful real-time workspace for teams who think, prototype, and create at the speed of conversation.</p>
                    <div className="heroStats">
                        <div><strong>∞</strong><span>Shared rooms</span></div>
                        <div><strong>10+</strong><span>Editor languages</span></div>
                        <div><strong>1</strong><span>Shared source of truth</span></div>
                    </div>
                </div>
                <div className="authCard">
                    <div className="windowControls"><i /><i /><i /><span>Welcome to CodeFusion</span></div>
                    <div className="authContent">
                        <div className="authIcon">⌘</div>
                        <h2>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
                        <p>Sign in to continue to your collaborative rooms.</p>
                        <form onSubmit={submit}>
                            <label>Username<input required minLength="3" maxLength="30" value={form.username} onChange={update('username')} placeholder="your handle" /></label>
                            <label>Password<input required minLength="8" type="password" value={form.password} onChange={update('password')} placeholder="8+ characters" /></label>
                            <label>Room ID <small>optional</small><input value={form.roomId} onChange={update('roomId')} placeholder="Leave empty to create a room" /></label>
                            <button className="primaryButton" disabled={busy}>{busy ? 'Preparing your workspace…' : mode === 'login' ? 'Enter CodeFusion  →' : 'Create account  →'}</button>
                        </form>
                        <button className="switchAuth" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? 'New to CodeFusion? Create an account' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </section>
            <footer className="landingFooter"><span>CodeFusion</span><span>Designed for deep work and fast feedback</span><span>Secure by default · Built for teams</span></footer>
        </main>
    );
};

export default Home;
