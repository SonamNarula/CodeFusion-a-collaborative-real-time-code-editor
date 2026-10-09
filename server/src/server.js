import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import utils from 'y-websocket/bin/utils';
import { loadConfig } from './config.js';
import { initPersistence, isValidRoomId } from './persistence.js';
import { runCode, runnableLanguages } from './runner.js';
import { askAI, aiEnabled } from './ai.js';

const { setupWSConnection } = utils;

export function createServer(overrides = {}) {
  const cfg = loadConfig(overrides);
  const store = initPersistence(cfg);
  const app = express();

  app.set('trust proxy', 1);
  app.use(cors({ origin: cfg.clientUrls ?? true }));
  app.use(express.json({ limit: '200kb' }));

  const limiter = (windowMs, max) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });

  app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

  app.get('/api/config', (_req, res) =>
    res.json({ runnable: runnableLanguages(cfg), ai: aiEnabled(cfg) }),
  );

  app.get('/api/rooms/:room/replay', limiter(60_000, 30), (req, res) => {
    if (!isValidRoomId(req.params.room)) return res.status(400).json({ error: 'Invalid room id' });
    res.json({ events: store.readReplay(req.params.room) });
  });

  app.post('/api/run', limiter(60_000, 20), async (req, res) => {
    const { language, code, stdin } = req.body ?? {};
    if (typeof language !== 'string' || typeof code !== 'string' || code.length > 50_000) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    try {
      res.json(await runCode(cfg, { language, code, stdin: typeof stdin === 'string' ? stdin.slice(0, 10_000) : '' }));
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.post('/api/ai', limiter(60_000, 12), async (req, res) => {
    const b = req.body ?? {};
    if (typeof b.code !== 'string') return res.status(400).json({ error: 'Invalid request' });
    try {
      res.json({ text: await askAI(cfg, b) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Serve the built client (single-service deployment)
  if (fs.existsSync(cfg.staticDir)) {
    app.use(express.static(cfg.staticDir));
    app.get('*', (req, res, next) =>
      req.path.startsWith('/api') ? next() : res.sendFile(path.join(cfg.staticDir, 'index.html')),
    );
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const match = pathname.match(/^\/yjs\/([^/]+)$/);
    const origin = req.headers.origin;
    const originOk = !cfg.clientUrls || !origin || cfg.clientUrls.includes(origin);
    if (!match || !isValidRoomId(match[1]) || !originOk) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => setupWSConnection(ws, req, { docName: match[1] }));
  });

  return {
    cfg,
    httpServer,
    listen: (port = cfg.port) => new Promise((resolve) => httpServer.listen(port, () => resolve(httpServer.address().port))),
    close: () =>
      new Promise((resolve) => {
        wss.clients.forEach((c) => c.terminate());
        httpServer.closeAllConnections?.();
        httpServer.close(() => setTimeout(resolve, 150));
      }),
  };
}
