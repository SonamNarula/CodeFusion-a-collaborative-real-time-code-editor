const BASE = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '');

export const apiUrl = (p) => `${BASE}${p}`;
export const wsBase = () =>
  BASE ? BASE.replace(/^http/, 'ws') : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;

async function post(path, body) {
  const res = await fetch(apiUrl(path), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getConfig = () => fetch(apiUrl('/api/config')).then((r) => r.json()).catch(() => ({ runnable: [], ai: false }));
export const runRemote = (language, code, stdin) => post('/api/run', { language, code, stdin });
export const askAI = (payload) => post('/api/ai', payload);
export const getReplay = (room) =>
  fetch(apiUrl(`/api/rooms/${room}/replay`)).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Replay unavailable'))));
