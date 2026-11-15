import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { COLLAB_URL } from '../lib/collab';

/** Connects to a room and exposes the shared Y.Doc, awareness and connection state. */
export function useRoom(roomId, profile) {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(COLLAB_URL, roomId, doc);
    const onStatus = (e) => setStatus(e.status);
    const onSync = (s) => setSynced(s);
    provider.on('status', onStatus);
    provider.on('sync', onSync);
    provider.awareness.setLocalStateField('user', { name: profile.name, color: profile.color });
    setRoom({ doc, provider, awareness: provider.awareness });
    return () => {
      provider.off('status', onStatus);
      provider.off('sync', onSync);
      provider.destroy();
      doc.destroy();
      setRoom(null);
      setSynced(false);
      setStatus('connecting');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    room?.awareness.setLocalStateField('user', { name: profile.name, color: profile.color });
  }, [room, profile.name, profile.color]);

  return { room, status, synced };
}

/** Everyone currently in the room (throttled). */
export function usePeers(awareness) {
  const [peers, setPeers] = useState([]);
  useEffect(() => {
    let timer = null;
    const compute = () => {
      const out = [];
      awareness.getStates().forEach((state, clientId) => {
        if (state.user) out.push({ clientId, user: state.user, cursor: state.cursor || null, isSelf: clientId === awareness.clientID });
      });
      out.sort((a, b) => (a.isSelf ? -1 : b.isSelf ? 1 : a.clientId - b.clientId));
      setPeers(out);
    };
    const onChange = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; compute(); }, 120);
    };
    awareness.on('change', onChange);
    compute();
    return () => { awareness.off('change', onChange); clearTimeout(timer); };
  }, [awareness]);
  return peers;
}

export function useYMap(ymap) {
  const [snap, setSnap] = useState(() => ymap.toJSON());
  useEffect(() => {
    const h = () => setSnap(ymap.toJSON());
    h();
    ymap.observeDeep(h);
    return () => ymap.unobserveDeep(h);
  }, [ymap]);
  return snap;
}

export function useYArray(yarr) {
  const [items, setItems] = useState(() => yarr.toArray());
  useEffect(() => {
    const h = () => setItems(yarr.toArray());
    h();
    yarr.observe(h);
    return () => yarr.unobserve(h);
  }, [yarr]);
  return items;
}
