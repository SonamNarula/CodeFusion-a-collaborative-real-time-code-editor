import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { startTestServer, connect, until } from './helpers.js';

const ctx = await startTestServer();
const clients = [];
after(async () => {
  clients.forEach((c) => c.provider.destroy());
  await ctx.server.close();
  // y-websocket keeps a few module-level timers alive; end the test process explicitly.
  setTimeout(() => process.exit(0), 100).unref();
});

const hasBin = (b) => { try { execSync(`command -v ${b}`, { stdio: 'ignore' }); return true; } catch { return false; } };

test('health and config endpoints', async () => {
  assert.equal((await (await fetch(`${ctx.base}/api/health`)).json()).ok, true);
  const cfg = await (await fetch(`${ctx.base}/api/config`)).json();
  assert.ok(Array.isArray(cfg.runnable));
  assert.equal(cfg.ai, false);
});

test('two clients converge after concurrent edits (CRDT)', async () => {
  const a = connect(ctx.port, 'room-converge');
  const b = connect(ctx.port, 'room-converge');
  clients.push(a, b);
  await until(() => a.provider.synced && b.provider.synced);

  a.text.insert(0, 'hello');
  await until(() => b.text.toString() === 'hello');

  // Concurrent edits at the same position, neither side sees the other first
  a.provider.disconnect();
  b.provider.disconnect();
  a.text.insert(5, ' from A');
  b.text.insert(5, ' from B');
  a.provider.connect();
  b.provider.connect();

  assert.ok(await until(() => a.text.toString() === b.text.toString() && a.text.length > 15));
  const merged = a.text.toString();
  assert.ok(merged.includes('from A') && merged.includes('from B'), merged);
});

test('late joiner receives existing document', async () => {
  const a = connect(ctx.port, 'room-late');
  clients.push(a);
  await until(() => a.provider.synced);
  a.text.insert(0, 'persisted?');
  await new Promise((r) => setTimeout(r, 100));
  const late = connect(ctx.port, 'room-late');
  clients.push(late);
  assert.ok(await until(() => late.text.toString() === 'persisted?'));
});

test('replay log records timestamped updates', async () => {
  const a = connect(ctx.port, 'room-replay');
  clients.push(a);
  await until(() => a.provider.synced);
  a.text.insert(0, 'one');
  a.text.insert(3, ' two');
  await new Promise((r) => setTimeout(r, 200));
  const { events } = await (await fetch(`${ctx.base}/api/rooms/room-replay/replay`)).json();
  assert.ok(events.length >= 2);
  assert.ok(events.every((e) => typeof e.t === 'number' && typeof e.u === 'string'));
});

test('invalid room ids are rejected', async () => {
  const res = await fetch(`${ctx.base}/api/rooms/..%2Fetc/replay`);
  assert.equal(res.status, 400);
  const bad = connect(ctx.port, 'x');
  clients.push(bad);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(bad.provider.synced, false);
});

test('code runner: python output, stdin and time limit', { skip: !hasBin('python3') }, async () => {
  const post = (body) => fetch(`${ctx.base}/api/run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
  const ok = await post({ language: 'python', code: 'print(int(input())*2)', stdin: '21' });
  assert.equal(ok.stdout.trim(), '42');
  assert.equal(ok.code, 0);
  const loop = await post({ language: 'python', code: 'while True: pass' });
  assert.equal(loop.code, 124);
});

test('run endpoint rejects unsupported language and AI reports not configured', async () => {
  const r = await fetch(`${ctx.base}/api/run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'cobol', code: 'x' }) });
  assert.equal(r.status, 400);
  const ai = await fetch(`${ctx.base}/api/ai`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'explain', code: 'x' }) });
  assert.equal(ai.status, 503);
});

test('rooms survive a server restart (snapshot persistence)', async () => {
  const first = await startTestServer();
  const a = connect(first.port, 'room-restart');
  await until(() => a.provider.synced);
  a.text.insert(0, 'still here after restart');
  await new Promise((r) => setTimeout(r, 1300)); // snapshot debounce is 1s
  a.provider.destroy();
  await new Promise((r) => setTimeout(r, 200));
  await first.server.close();

  const second = await startTestServer({ dataDir: first.dataDir });
  const b = connect(second.port, 'room-restart');
  assert.ok(await until(() => b.text.toString() === 'still here after restart'));
  b.provider.destroy();
  await second.server.close();
});
