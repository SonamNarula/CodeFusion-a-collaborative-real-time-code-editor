// Runs JavaScript in a throwaway Web Worker: no server needed, killed after the time limit.
const WORKER_SRC = `
const fmt = (a) => { if (typeof a === 'string') return a; try { return typeof a === 'function' || a === undefined ? String(a) : JSON.stringify(a, null, 2); } catch { return String(a); } };
const send = (type) => (...a) => postMessage({ type, text: a.map(fmt).join(' ') });
console.log = console.info = console.debug = send('out');
console.warn = console.error = send('err');
onmessage = async (e) => {
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    await new AsyncFunction(e.data)();
    postMessage({ type: 'done', code: 0 });
  } catch (err) {
    postMessage({ type: 'err', text: String((err && err.stack) || err) });
    postMessage({ type: 'done', code: 1 });
  }
};`;

export function runJS(code, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const out = [];
    const err = [];
    let timer;
    const finish = (exit) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ stdout: out.join('\n').slice(0, 65536), stderr: err.join('\n').slice(0, 65536), code: exit });
    };
    timer = setTimeout(() => {
      err.push(`Stopped: exceeded ${timeoutMs / 1000}s time limit`);
      finish(124);
    }, timeoutMs);
    worker.onmessage = ({ data }) => {
      if (data.type === 'out') out.push(data.text);
      else if (data.type === 'err') err.push(data.text);
      else finish(data.code);
    };
    worker.onerror = (e) => { err.push(e.message); finish(1); };
    worker.postMessage(code);
  });
}
