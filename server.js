const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'codefusion.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'javascript', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS room_members (
    room_id TEXT NOT NULL, user_id TEXT NOT NULL, joined_at TEXT NOT NULL,
    PRIMARY KEY(room_id, user_id), FOREIGN KEY(room_id) REFERENCES rooms(id), FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN, credentials: true } });
app.use(express.json({ limit: '256kb' }));

const now = () => new Date().toISOString();
const sign = (user) => jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
const userFromToken = (token) => {
  const payload = jwt.verify(token, JWT_SECRET);
  return db.prepare('SELECT id, username FROM users WHERE id = ?').get(payload.sub);
};
const auth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const user = userFromToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid authentication token' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};
const publicUser = ({ id, username }) => ({ id, username });

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!/^[a-zA-Z0-9_ -]{3,30}$/.test(username) || password.length < 8) {
    return res.status(400).json({ error: 'Username must be 3-30 characters and password at least 8 characters' });
  }
  try {
    const user = { id: crypto.randomUUID(), username };
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(user.id, user.username, bcrypt.hashSync(password, 12), now());
    return res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch {
    return res.status(409).json({ error: 'Username is already taken' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(String(req.body.username || '').trim());
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  return res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.post('/api/rooms', auth, (req, res) => {
  const id = crypto.randomUUID();
  const timestamp = now();
  db.prepare('INSERT INTO rooms (id, owner_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, String(req.body.name || 'Untitled room').trim().slice(0, 80) || 'Untitled room', timestamp, timestamp);
  db.prepare('INSERT INTO room_members VALUES (?, ?, ?)').run(id, req.user.id, timestamp);
  return res.status(201).json({ room: db.prepare('SELECT id, name, code, language FROM rooms WHERE id = ?').get(id) });
});

app.get('/api/rooms/:id', auth, (req, res) => {
  const room = db.prepare('SELECT id, name, code, language, owner_id AS ownerId FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json({ room });
});

app.post('/api/rooms/:id/join', auth, (req, res) => {
  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  db.prepare('INSERT OR IGNORE INTO room_members VALUES (?, ?, ?)').run(req.params.id, req.user.id, now());
  return res.json({ ok: true });
});

app.patch('/api/rooms/:id', auth, (req, res) => {
  const member = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Join the room before editing it' });
  const code = typeof req.body.code === 'string' ? req.body.code : undefined;
  const language = typeof req.body.language === 'string' ? req.body.language.slice(0, 30) : undefined;
  if (code !== undefined && code.length > 200000) return res.status(413).json({ error: 'Code is too large' });
  db.prepare('UPDATE rooms SET code = COALESCE(?, code), language = COALESCE(?, language), updated_at = ? WHERE id = ?')
    .run(code, language, now(), req.params.id);
  return res.json({ ok: true });
});

const socketUsers = new Map();
const roomClients = (roomId) => Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
  socketId, username: socketUsers.get(socketId)?.username,
}));

io.use((socket, next) => {
  try {
    const user = userFromToken(socket.handshake.auth?.token);
    if (!user) return next(new Error('Authentication required'));
    socket.user = user;
    return next();
  } catch {
    return next(new Error('Invalid authentication token'));
  }
});

io.on('connection', (socket) => {
  socketUsers.set(socket.id, socket.user);
  socket.on(ACTIONS.JOIN, ({ roomId }) => {
    const member = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, socket.user.id);
    if (!member) return socket.emit(ACTIONS.ERROR, { message: 'You do not have access to this room' });
    socket.join(roomId);
    socket.data.roomId = roomId;
    io.to(roomId).emit(ACTIONS.JOINED, { clients: roomClients(roomId), username: socket.user.username, socketId: socket.id });
    const room = db.prepare('SELECT code, language FROM rooms WHERE id = ?').get(roomId);
    socket.emit(ACTIONS.SYNC_CODE, room);
  });
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    if (socket.data.roomId !== roomId || typeof code !== 'string' || code.length > 200000) return;
    db.prepare('UPDATE rooms SET code = ?, updated_at = ? WHERE id = ?').run(code, now(), roomId);
    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    if (socket.data.roomId !== roomId || typeof language !== 'string') return;
    db.prepare('UPDATE rooms SET language = ?, updated_at = ? WHERE id = ?').run(language.slice(0, 30), now(), roomId);
    socket.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
  });
  socket.on('disconnecting', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit(ACTIONS.DISCONNECTED, { socketId: socket.id, username: socket.user.username });
    socketUsers.delete(socket.id);
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
}

server.listen(PORT, () => console.log(`CodeFusion listening on port ${PORT}`));
