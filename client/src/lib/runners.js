/* In-browser code execution: JavaScript (sandboxed iframe), TypeScript (Monaco emit), Python (Pyodide worker). */
import { monaco } from './monacoSetup';

const JS_BOOT = `<!doctype html><html><body><script>
(function () {
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.stack || (v.name + ': ' + v.message);
    if (typeof v === 'function') return String(v);
    if (typeof v === 'undefined') return 'undefined';
    if (typeof v === 'bigint' || typeof v === 'symbol') return String(v);
    try {
      var seen = [];
      return JSON.stringify(v, function (k, x) {
        if (typeof x === 'object' && x !== null) { if (seen.indexOf(x) > -1) return '[Circular]'; seen.push(x); }
        if (typeof x === 'function') return '[Function]';
        if (typeof x === 'bigint') return String(x) + 'n';
        return x;
      }, 2);
    } catch (e) { return String(v); }
  }
  function send(type, args) {
    parent.postMessage({ __cf: true, type: type, text: [].map.call(args, fmt).join(' ') }, '*');
  }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (k) {
    console[k] = function () { send(k === 'debug' ? 'log' : k, arguments); };
  });
  window.addEventListener('error', function (e) { send('error', [e.error || e.message]); });
  window.addEventListener('unhandledrejection', function (e) { send('error', [e.reason || 'Unhandled promise rejection']); });
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.__cfRun) return;
    var AsyncFn = Object.getPrototypeOf(async function () {}).constructor, fn;
    try { fn = new AsyncFn(e.data.code); } catch (err) { send('error', [err]); send('done', []); return; }
    fn().then(function () { send('done', []); }, function (err) { send('error', [err]); send('done', []); });
  });
})();
</script></body></html>`;

export function runJavaScript(code, onLine, { timeout = 10000, grace = 700 } = {}) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    let finished = false;
    let ok = true;
    let timer;
    let graceTimer;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      window.removeEventListener('message', onMsg);
      iframe.remove();
      resolve(result);
    };
    const onMsg = (e) => {
      if (e.source !== iframe.contentWindow || !e.data || !e.data.__cf) return;
      const { type, text } = e.data;
      if (type === 'done') {
        graceTimer = setTimeout(() => finish(ok), grace); // let timers / async logs flush
        return;
      }
      if (type === 'error') ok = false;
      onLine(type, text);
    };

    window.addEventListener('message', onMsg);
    iframe.srcdoc = JS_BOOT;
    iframe.onload = () => iframe.contentWindow.postMessage({ __cfRun: true, code }, '*');
    document.body.appendChild(iframe);
    timer = setTimeout(() => {
      onLine('error', `Execution timed out after ${timeout / 1000}s`);
      finish(false);
    }, timeout);
  });
}

export async function transpileTypeScript(model) {
  const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
  const client = await getWorker(model.uri);
  const out = await client.getEmitOutput(model.uri.toString());
  const file = out.outputFiles.find((f) => /\.js$/.test(f.name)) || out.outputFiles[0];
  if (!file) throw new Error('TypeScript compiler returned no output.');
  return file.text;
}

const PY_WORKER = `
let pyodide = null;
self.onmessage = async (e) => {
  const post = (type, text) => self.postMessage({ type, text });
  try {
    if (!pyodide) {
      post('info', 'Loading Python runtime (first run only)...');
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
      pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
    }
    pyodide.setStdout({ batched: (s) => post('log', s) });
    pyodide.setStderr({ batched: (s) => post('error', s) });
    await pyodide.runPythonAsync(e.data.code);
  } catch (err) {
    post('error', String((err && err.message) || err));
  }
  post('done', '');
};
`;

let pyWorker = null;

export function runPython(code, onLine, { timeout = 90000 } = {}) {
  return new Promise((resolve) => {
    if (!pyWorker) {
      pyWorker = new Worker(URL.createObjectURL(new Blob([PY_WORKER], { type: 'text/javascript' })));
    }
    const worker = pyWorker;
    let ok = true;
    const reset = () => { worker.terminate(); if (pyWorker === worker) pyWorker = null; };
    const timer = setTimeout(() => {
      onLine('error', `Execution timed out after ${timeout / 1000}s`);
      reset();
      resolve(false);
    }, timeout);
    worker.onmessage = (e) => {
      const { type, text } = e.data;
      if (type === 'done') { clearTimeout(timer); resolve(ok); return; }
      if (type === 'error') ok = false;
      onLine(type, text);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      onLine('error', e.message || 'The Python runtime failed to start. Check your internet connection.');
      reset();
      resolve(false);
    };
    worker.postMessage({ code });
  });
}
