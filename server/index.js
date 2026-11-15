'use strict';
/**
 * CodeFusion server
 *  - Yjs sync + awareness over WebSockets  (ws://host/collab/<roomId>)
 *  - Per-room persistence to ./data/<roomId>.ydoc
 *  - Serves the built client in production
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const seed = require('./seed');

const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ROOM_RE = /^[a-zA-Z0-9_-]{3,64}$/;
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;
const SAVE_DEBOUNCE_MS = 800;
const EVICT_AFTER_MS = 60000;

fs.mkdirSync(DATA_DIR, { recursive: true });

const rooms = new Map();

const send = (ws, buf) => {
  if (ws.readyState === 1) ws.send(buf, (err) => err && ws.close());
};

class Room {
  constructor(id) {
    this.id = id;
    this.file = path.join(DATA_DIR, `${id}.ydoc`);
    this.doc = new Y.Doc({ gc: true });
    this.conns = new Map(); // ws -> Set<awareness client ids>
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.awareness.setLocalState(null);
    this.saveTimer = null;
    this.evictTimer = null;

    if (fs.existsSync(this.file)) {
      try {
        Y.applyUpdate(this.doc, new Uint8Array(fs.readFileSync(this.file)));
      } catch (err) {
        console.error(`[${id}] failed to load snapshot`, err);
      }
    } else {
      this.seed();
      this.saveNow();
    }

    this.doc.on('update', (update) => {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MSG_SYNC);
      syncProtocol.writeUpdate(enc, update);
      const buf = encoding.toUint8Array(enc);
      this.conns.forEach((_, ws) => send(ws, buf));
      this.scheduleSave();
    });

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      if (origin && this.conns.has(origin)) {
        const ids = this.conns.get(origin);
        added.forEach((c) => ids.add(c));
        removed.forEach((c) => ids.delete(c));
      }
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        enc,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, added.concat(updated, removed))
      );
      const buf = encoding.toUint8Array(enc);
      this.conns.forEach((_, ws) => send(ws, buf));
    });
  }

  seed() {
    this.doc.transact(() => {
      const files = this.doc.getMap('files');
      seed.files.forEach((f, i) => {
        files.set(f.id, { name: f.name, order: i + 1 });
        this.doc.getText(`file:${f.id}`).insert(0, f.text);
      });
      this.doc.getText('notes').insert(0, seed.notes);
      this.doc.getMap('meta').set('createdAt', Date.now());
    });
  }

  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), SAVE_DEBOUNCE_MS);
  }

  saveNow() {
    clearTimeout(this.saveTimer);
    const tmp = `${this.file}.tmp`;
    try {
      fs.writeFileSync(tmp, Buffer.from(Y.encodeStateAsUpdate(this.doc)));
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error(`[${this.id}] save failed`, err);
    }
  }

  destroy() {
    this.saveNow();
    this.awareness.destroy();
    this.doc.destroy();
    rooms.delete(this.id);
  }
}

function getRoom(id) {
  let room = rooms.get(id);
  if (!room) {
    room = new Room(id);
    rooms.set(id, room);
  }
  clearTimeout(room.evictTimer);
  return room;
}

function onConnection(ws, roomId) {
  const room = getRoom(roomId);
  room.conns.set(ws, new Set());
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const type = decoding.readVarUint(decoder);
      if (type === MSG_SYNC) {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MSG_SYNC);
        syncProtocol.readSyncMessage(decoder, enc, room.doc, ws);
        if (encoding.length(enc) > 1) send(ws, encoding.toUint8Array(enc));
      } else if (type === MSG_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), ws);
      }
    } catch (err) {
      console.error(`[${roomId}] bad message`, err.message);
    }
  });

  const cleanup = () => {
    const ids = room.conns.get(ws);
    if (!ids) return;
    room.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(ids), null);
    if (room.conns.size === 0) {
      room.saveNow();
      room.evictTimer = setTimeout(() => room.conns.size === 0 && room.destroy(), EVICT_AFTER_MS);
    }
  };
  ws.on('close', cleanup);
  ws.on('error', cleanup);

  // Kick off sync: send step 1 + current awareness states.
  const enc = encoding.createEncoder();
  encoding.writeVarUint(enc, MSG_SYNC);
  syncProtocol.writeSyncStep1(enc, room.doc);
  send(ws, encoding.toUint8Array(enc));

  const states = room.awareness.getStates();
  if (states.size > 0) {
    const aEnc = encoding.createEncoder();
    encoding.writeVarUint(aEnc, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      aEnc,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys()))
    );
    send(ws, encoding.toUint8Array(aEnc));
  }
}

const app = express();
app.disable('x-powered-by');
app.get('/api/health', (_req, res) => res.json({ ok: true, rooms: rooms.size, uptime: process.uptime() }));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 * 1024 });

server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const match = pathname.match(/^\/collab\/([^/]+)$/);
  const roomId = match && decodeURIComponent(match[1]);
  if (!roomId || !ROOM_RE.test(roomId)) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, roomId));
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

const shutdown = () => {
  rooms.forEach((room) => room.saveNow());
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Start with another port, e.g.  PORT=4001 npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => console.log(`CodeFusion server ready  ->  http://localhost:${PORT}`));
