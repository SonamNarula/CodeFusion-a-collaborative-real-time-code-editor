export default function OutputPanel({ result, running, stdin, onStdin, onClear, showStdin }) {
  return (
    <section className="output panel" aria-label="Output">
      <div className="output-head">
        <strong>Output</strong>
        {result && (
          <span className="muted small">
            run by {result.by} · {result.lang} · {result.ms} ms · exit {result.code}
          </span>
        )}
        <div className="spacer" />
        {result && <button className="btn small" onClick={onClear}>Clear</button>}
      </div>
      {showStdin && (
        <textarea className="stdin mono" rows={2} value={stdin} onChange={(e) => onStdin(e.target.value)} placeholder="Program input (stdin)" aria-label="Program input" />
      )}
      <div className="output-body mono">
        {running && <span className="muted">Running…</span>}
        {!running && !result && <span className="muted">Run the code to see output here. Everyone in the room sees it.</span>}
        {!running && result?.stdout && <pre>{result.stdout}</pre>}
        {!running && result?.stderr && <pre className="err">{result.stderr}</pre>}
        {!running && result && !result.stdout && !result.stderr && <span className="muted">Finished with no output.</span>}
      </div>
    </section>
  );
}
