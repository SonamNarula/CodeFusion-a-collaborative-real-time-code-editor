export const PALETTE = ['#8b7cff', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#60a5fa', '#c084fc', '#f87171', '#2dd4bf'];
const ADJ = ['swift', 'lucid', 'amber', 'cosmic', 'velvet', 'neon', 'silent', 'lunar', 'crimson', 'arctic', 'golden', 'electric'];
const NOUN = ['orbit', 'falcon', 'harbor', 'prism', 'comet', 'ember', 'summit', 'cipher', 'nebula', 'vector', 'pixel', 'meadow'];

export const ROOM_RE = /^[a-zA-Z0-9_-]{3,64}$/;
export const HEX_RE = /^#[0-9a-f]{6}$/i;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const randomRoomId = () => `${pick(ADJ)}-${pick(NOUN)}-${Math.floor(100 + Math.random() * 900)}`;
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Accepts a plain code or a full invite link. */
export function normalizeRoomInput(value) {
  const text = (value || '').trim();
  const match = text.match(/room\/([a-zA-Z0-9_-]{3,64})/);
  return match ? match[1] : text.replace(/\s+/g, '-');
}

export function getProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem('cf_profile') || 'null');
    if (raw && raw.name) return { name: String(raw.name).slice(0, 24), color: HEX_RE.test(raw.color) ? raw.color : pick(PALETTE) };
  } catch (e) { /* ignore */ }
  return null;
}
export function saveProfile(profile) {
  const next = { name: profile.name.trim().slice(0, 24), color: profile.color || pick(PALETTE) };
  try { localStorage.setItem('cf_profile', JSON.stringify(next)); } catch (e) { /* ignore */ }
  return next;
}

export const initials = (name = '?') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
};

export const extOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

const LANGS = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', py: 'python', html: 'html', htm: 'html', css: 'css',
  json: 'json', md: 'markdown', java: 'java', cpp: 'cpp', cc: 'cpp', c: 'c', go: 'go',
  rs: 'rust', sql: 'sql', sh: 'shell', yml: 'yaml', yaml: 'yaml', xml: 'xml', txt: 'plaintext',
};
export const langFromName = (name) => LANGS[extOf(name)] || 'plaintext';

export const LANG_LABEL = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', html: 'HTML', css: 'CSS',
  json: 'JSON', markdown: 'Markdown', java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust',
  sql: 'SQL', shell: 'Shell', yaml: 'YAML', xml: 'XML', plaintext: 'Plain text',
};

export const FILE_BADGE = {
  js: ['JS', '#fbbf24'], jsx: ['JSX', '#22d3ee'], mjs: ['JS', '#fbbf24'], ts: ['TS', '#60a5fa'], tsx: ['TSX', '#60a5fa'],
  py: ['PY', '#34d399'], html: ['HTML', '#fb923c'], htm: ['HTML', '#fb923c'], css: ['CSS', '#c084fc'], json: ['{}', '#fbbf24'],
  md: ['MD', '#a3a9bd'], java: ['JV', '#f87171'], cpp: ['C++', '#60a5fa'], c: ['C', '#60a5fa'], go: ['GO', '#2dd4bf'],
  rs: ['RS', '#fb923c'], sql: ['SQL', '#f472b6'], sh: ['SH', '#34d399'],
};

export const timeOf = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
