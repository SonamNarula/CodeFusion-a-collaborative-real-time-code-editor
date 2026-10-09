const COLORS = ['#e5484d', '#f76b15', '#d6a100', '#30a46c', '#12a594', '#3e63dd', '#8e4ec6', '#d6409f'];
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export const randomId = (len) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => ALPHABET[b % ALPHABET.length]).join('');

export const cleanName = (s) => (s || '').replace(/[^\w .-]/g, '').trim().slice(0, 20);

export const isRoomId = (s) => /^[A-Za-z0-9_-]{4,64}$/.test(s || '');

/** Accepts a bare id or a full invite link. */
export const parseRoomInput = (s) => {
  const m = (s || '').trim().match(/([A-Za-z0-9_-]{4,64})\/?$/);
  return m ? m[1] : '';
};

export function loadUser() {
  let id = localStorage.getItem('cf-uid');
  if (!id) localStorage.setItem('cf-uid', (id = randomId(12)));
  let color = localStorage.getItem('cf-color');
  if (!color) localStorage.setItem('cf-color', (color = COLORS[Math.floor(Math.random() * COLORS.length)]));
  return { id, color, name: cleanName(localStorage.getItem('cf-name')) };
}

export const saveName = (name) => localStorage.setItem('cf-name', cleanName(name));

export function rememberRoom(id, language) {
  const list = JSON.parse(localStorage.getItem('cf-recent') || '[]').filter((r) => r.id !== id);
  list.unshift({ id, language, ts: Date.now() });
  localStorage.setItem('cf-recent', JSON.stringify(list.slice(0, 6)));
}

export const recentRooms = () => JSON.parse(localStorage.getItem('cf-recent') || '[]');
