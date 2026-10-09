import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const OUTPUT_CAP = 64 * 1024;
const TIMEOUT_MS = 5000;

const LOCAL = {
  python: { file: 'main.py', run: ['python3', ['main.py']] },
  c: { file: 'main.c', compile: ['gcc', ['main.c', '-O2', '-o', 'main']], run: ['./main', []] },
  cpp: { file: 'main.cpp', compile: ['g++', ['main.cpp', '-O2', '-std=c++17', '-o', 'main']], run: ['./main', []] },
};

const PISTON = {
  python: 'python', c: 'c', cpp: 'c++', java: 'java', go: 'go', rust: 'rust', typescript: 'typescript',
};

export function runnableLanguages(cfg) {
  if (cfg.pistonUrl) return Object.keys(PISTON);
  if (cfg.enableLocalExec) return Object.keys(LOCAL);
  return [];
}

function exec(cmd, args, { cwd, stdin = '', timeoutMs = TIMEOUT_MS }) {
  return new Promise((resolve) => {
    let out = '';
    let err = '';
    let timedOut = false;
    const child = spawn(cmd, args, { cwd, env: { PATH: process.env.PATH, HOME: cwd }, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (d) => { if (out.length < OUTPUT_CAP) out += d; });
    child.stderr.on('data', (d) => { if (err.length < OUTPUT_CAP) err += d; });
    child.stdin.on('error', () => {});
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ stdout: out, stderr: e.code === 'ENOENT' ? `'${cmd}' is not installed on the server` : e.message, code: 127 });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) err += `\nProcess killed: exceeded ${timeoutMs / 1000}s time limit`;
      resolve({ stdout: out, stderr: err, code: timedOut ? 124 : code });
    });
    child.stdin.end(stdin);
  });
}

async function runLocal(language, code, stdin) {
  const spec = LOCAL[language];
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cf-'));
  try {
    await fs.writeFile(path.join(dir, spec.file), code);
    if (spec.compile) {
      const c = await exec(spec.compile[0], spec.compile[1], { cwd: dir, timeoutMs: 15000 });
      if (c.code !== 0) return { stdout: '', stderr: (c.stderr || c.stdout).split(dir).join('.'), code: c.code };
    }
    const r = await exec(spec.run[0], spec.run[1], { cwd: dir, stdin });
    return { ...r, stderr: r.stderr.split(dir).join('.') };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runPiston(url, language, code, stdin) {
  const res = await fetch(`${url}/api/v2/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      language: PISTON[language], version: '*', files: [{ content: code }], stdin, run_timeout: TIMEOUT_MS,
    }),
  });
  if (!res.ok) throw new Error(`Execution service returned ${res.status}`);
  const data = await res.json();
  const compileErr = data.compile && data.compile.code !== 0 ? data.compile.output : '';
  return {
    stdout: data.run?.stdout ?? '',
    stderr: compileErr || data.run?.stderr || '',
    code: data.run?.code ?? 1,
  };
}

export async function runCode(cfg, { language, code, stdin = '' }) {
  if (!runnableLanguages(cfg).includes(language)) {
    throw Object.assign(new Error(`Running ${language} is not enabled on this server`), { status: 400 });
  }
  return cfg.pistonUrl ? runPiston(cfg.pistonUrl, language, code, stdin) : runLocal(language, code, stdin);
}
