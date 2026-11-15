import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icons';

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
            <div className="gridBackdrop" />
            <nav className="landingNav">
                <div className="brand"><span className="brandMark"><Icon name="logo" size={16} /></span><span>Code<span>Fusion</span></span></div>
                <div className="navPill"><span className="liveDot" /> Real-time collaboration</div>
            </nav>
            <section className="hero">
                <div className="heroCopy">
                    <div className="eyebrow"><Icon name="zap" size={12} /> THE COLLABORATIVE IDE</div>
                    <h1>Build together.<br /><em>Ship brilliantly.</em></h1>
                    <p className="heroText">A refined real-time workspace for teams who think, prototype and create at the speed of conversation.</p>
                    <div className="codePreview" aria-hidden="true">
                        <div className="previewBar"><i /><i /><i /><span>main.js</span><b><em className="p1" />Aarav<em className="p2" />Mia</b></div>
                        <pre>
                            <span className="ln">1</span><span className="k">const</span> room = <span className="f">join</span>(<span className="s">'design-sync'</span>);{'\n'}
                            <span className="ln">2</span>room.<span className="f">on</span>(<span className="s">'edit'</span>, (change) =&gt; {'{'}{'\n'}
                            <span className="ln">3</span>{'  '}editor.<span className="f">apply</span>(change); <span className="flag a">Aarav</span>{'\n'}
                            <span className="ln">4</span>{'}'});<span className="caret" /><span className="flag b">Mia</span>
                        </pre>
                    </div>
                    <div className="heroStats">
                        <div><strong>∞</strong><span>Shared rooms</span></div>
                        <div><strong>14</strong><span>Languages</span></div>
                        <div><strong>&lt;50ms</strong><span>Live sync</span></div>
                    </div>
                </div>
                <div className="authCard">
                    <div className="authGlow" />
                    <div className="authContent">
                        <div className="authIcon"><Icon name="logo" size={20} /></div>
                        <h2>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
                        <p>{mode === 'login' ? 'Sign in to continue to your collaborative rooms.' : 'Join in seconds and start coding together.'}</p>
                        <form onSubmit={submit}>
                            <label>Username<input required minLength="3" maxLength="30" value={form.username} onChange={update('username')} placeholder="your handle" autoComplete="username" /></label>
                            <label>Password<input required minLength="8" type="password" value={form.password} onChange={update('password')} placeholder="8+ characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
                            <label>Room ID <small>optional</small><input value={form.roomId} onChange={update('roomId')} placeholder="Leave empty to create a new room" /></label>
                            <button className="primaryButton" disabled={busy}>
                                <span>{busy ? 'Preparing your workspace…' : mode === 'login' ? 'Enter CodeFusion' : 'Create account'}</span>
                                {!busy && <Icon name="arrow" size={15} />}
                            </button>
                        </form>
                        <button type="button" className="switchAuth" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? 'New to CodeFusion? Create an account' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </section>
            <footer className="landingFooter"><span>CodeFusion</span><span>Designed for deep work and fast feedback</span><span><Icon name="shield" size={12} /> Secure by default</span></footer>
        </main>
    );
};

export default Home;
