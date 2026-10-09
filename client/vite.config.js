import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = process.env.VITE_PROXY_TARGET || 'http://localhost:5050';

export default defineConfig({
  plugins: [react()],
  // Yjs breaks if two copies end up in the bundle (text and chat stop syncing while presence still works)
  resolve: { dedupe: ['yjs', 'lib0', 'y-protocols'] },
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/yjs': { target: target.replace(/^http/, 'ws'), ws: true },
    },
  },
  build: { chunkSizeWarningLimit: 6000 },
});