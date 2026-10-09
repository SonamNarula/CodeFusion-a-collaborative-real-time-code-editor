import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import WebSocket from 'ws';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { createServer } from '../src/server.js';

export async function startTestServer(extra = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-test-'));
  const server = createServer({ dataDir, enableLocalExec: true, groqKey: null, ...extra });
  const port = await server.listen(0);
  return { server, port, dataDir, base: `http://127.0.0.1:${port}` };
}

export function connect(port, room) {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(`ws://127.0.0.1:${port}/yjs`, room, doc, { WebSocketPolyfill: WebSocket, disableBc: true });
  return { doc, provider, text: doc.getText('code') };
}

export const until = async (fn, ms = 4000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
};
