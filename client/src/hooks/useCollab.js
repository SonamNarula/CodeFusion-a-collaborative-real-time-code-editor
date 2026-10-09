import { useEffect, useReducer, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { wsBase } from '../lib/api.js';

/**
 * One Y.Doc per room. Shared types:
 *   code  Y.Text   the file
 *   meta  Y.Map    language, host, locked, timer, initialized, aiBusy
 *   chat  Y.Array  chat + AI messages
 *   run   Y.Map    last execution result (everyone sees the same output)
 * IndexedDB keeps a local copy so edits made offline merge on reconnect.
 */
export function useCollab(roomId, user) {
  const [collab, setCollab] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(`${wsBase()}/yjs`, roomId, ydoc);
    const idb = new IndexeddbPersistence(`cf-${roomId}`, ydoc);
    provider.awareness.setLocalStateField('user', { id: user.id, name: user.name, color: user.color });
    const onStatus = ({ status: s }) => setStatus(s);
    provider.on('status', onStatus);
    setCollab({
      ydoc, provider, awareness: provider.awareness,
      code: ydoc.getText('code'), meta: ydoc.getMap('meta'), chat: ydoc.getArray('chat'), run: ydoc.getMap('run'),
    });
    return () => {
      provider.off('status', onStatus);
      provider.destroy();
      idb.destroy();
      ydoc.destroy();
      setCollab(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user.id]);

  return { collab, status };
}

/** Re-render whenever a shared Y type changes. */
export function useYObserve(ytype) {
  const [, bump] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    if (!ytype) return undefined;
    ytype.observe(bump);
    return () => ytype.unobserve(bump);
  }, [ytype]);
}

/** Live list of connected people (one entry per user, even with several tabs). */
export function usePeers(awareness) {
  const [peers, setPeers] = useState([]);
  useEffect(() => {
    if (!awareness) return undefined;
    const update = () => {
      const byUser = new Map();
      awareness.getStates().forEach((s, clientId) => {
        if (s.user?.id) byUser.set(s.user.id, { clientId, ...s });
      });
      setPeers([...byUser.values()]);
    };
    update();
    awareness.on('change', update);
    return () => awareness.off('change', update);
  }, [awareness]);
  return peers;
}
