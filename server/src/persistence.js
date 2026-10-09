import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import utils from 'y-websocket/bin/utils';

// y-websocket's server utils load the CommonJS build of Yjs. Use the same instance here,
// otherwise two copies of Yjs end up in one process and constructor checks break.
const Y = createRequire(import.meta.url)('yjs');

const { setPersistence } = utils;

export const isValidRoomId = (id) => /^[A-Za-z0-9_-]{4,64}$/.test(id || '');

const countLines = (file) => {
  try {
    return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
};

/**
 * Two files per room:
 *   <room>.ydoc  latest compacted snapshot (loaded when the first user joins)
 *   <room>.log   append-only JSONL of timestamped Yjs updates (powers session replay)
 */
export function initPersistence({ dataDir, maxLogEvents }) {
  fs.mkdirSync(dataDir, { recursive: true });
  const snapFile = (room) => path.join(dataDir, `${room}.ydoc`);
  const logFile = (room) => path.join(dataDir, `${room}.log`);
  const counts = new Map();

  setPersistence({
    bindState: async (room, ydoc) => {
      try {
        Y.applyUpdate(ydoc, new Uint8Array(fs.readFileSync(snapFile(room))));
      } catch {
        /* new room */
      }
      if (!counts.has(room)) counts.set(room, countLines(logFile(room)));

      let timer = null;
      const save = () => {
        timer = null;
        fs.writeFile(snapFile(room), Buffer.from(Y.encodeStateAsUpdate(ydoc)), () => {});
      };

      ydoc.on('update', (update) => {
        const n = counts.get(room);
        if (n < maxLogEvents) {
          counts.set(room, n + 1);
          try {
            const line = JSON.stringify({ t: Date.now(), u: Buffer.from(update).toString('base64') });
            fs.appendFileSync(logFile(room), line + '\n');
          } catch {
            /* log is best-effort */
          }
        }
        if (!timer) timer = setTimeout(save, 1000);
      });
      ydoc.on('destroy', () => timer && clearTimeout(timer));
    },
    writeState: async (room, ydoc) => {
      fs.writeFileSync(snapFile(room), Buffer.from(Y.encodeStateAsUpdate(ydoc)));
    },
  });

  return {
    readReplay(room) {
      try {
        return fs
          .readFileSync(logFile(room), 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((l) => JSON.parse(l));
      } catch {
        return [];
      }
    },
  };
}
