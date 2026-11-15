export const COLLAB_URL =
  import.meta.env.VITE_COLLAB_URL ||
  (import.meta.env.DEV
    ? `ws://${location.hostname}:3001/collab`
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/collab`);
