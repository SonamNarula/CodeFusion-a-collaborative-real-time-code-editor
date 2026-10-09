import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (project root). Real environment variables always win.
function loadEnvFile(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || raw.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined && value !== '') process.env[m[1]] = value;
  }
}
loadEnvFile(path.resolve(here, '../../.env'));

export function loadConfig(overrides = {}) {
  const env = process.env;
  const isProd = env.NODE_ENV === 'production';
  return {
    port: Number(env.PORT) || 5050,
    // Comma separated list. Leave empty to allow any origin (fine when client is served by this server).
    clientUrls: env.CLIENT_URL ? env.CLIENT_URL.split(',').map((s) => s.trim()) : null,
    dataDir: path.resolve(env.DATA_DIR || path.join(here, '../data')),
    staticDir: path.resolve(here, '../../client/dist'),
    // Local execution is NOT a sandbox. On by default only outside production.
    enableLocalExec: (env.ENABLE_LOCAL_EXEC ?? (isProd ? 'false' : 'true')) === 'true',
    pistonUrl: env.PISTON_URL ? env.PISTON_URL.replace(/\/$/, '') : null,
    groqKey: env.GROQ_API_KEY || null,
    groqModel: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxLogEvents: 20000,
    ...overrides,
  };
}