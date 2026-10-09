// Measures end-to-end propagation latency (keystroke -> every other client) on this machine.
// Usage: npm run bench   (CLIENTS=20 EDITS=200 npm run bench)
import { startTestServer, connect, until } from './helpers.js';

const N = Number(process.env.CLIENTS) || 10;
const EDITS = Number(process.env.EDITS) || 100;
const { server, port } = await startTestServer();
const room = 'bench-room';
const clients = Array.from({ length: N }, () => connect(port, room));
await until(() => clients.every((c) => c.provider.synced), 10000);

const sender = clients[0];
const latencies = [];
for (let i = 0; i < EDITS; i++) {
  const marker = `#${i};`;
  const t0 = performance.now();
  sender.text.insert(sender.text.length, marker);
  await until(() => clients.slice(1).every((c) => c.text.toString().endsWith(marker)), 2000);
  latencies.push(performance.now() - t0);
}
latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))].toFixed(1);
console.log(`${N} clients, ${EDITS} edits -> all clients updated`);
console.log(`p50 ${pct(50)} ms | p95 ${pct(95)} ms | max ${latencies[latencies.length - 1].toFixed(1)} ms (polling granularity ~20 ms)`);
clients.forEach((c) => c.provider.destroy());
await server.close();
process.exit(0);
