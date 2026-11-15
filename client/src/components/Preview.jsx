import React, { useEffect, useRef, useState } from 'react';
import { Globe, Monitor, RefreshCw, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { buildPreview } from '../lib/preview';

const DEVICES = [
  { id: 'desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', icon: Tablet, width: 768 },
  { id: 'mobile', icon: Smartphone, width: 390 },
];

export default function Preview({ doc, files, nonce, hidden }) {
  const [srcDoc, setSrcDoc] = useState('');
  const [hasEntry, setHasEntry] = useState(true);
  const [device, setDevice] = useState('desktop');
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const iframeRef = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const build = (force = false) => {
    const html = buildPreview(filesRef.current, (id) => doc.getText(`file:${id}`).toString());
    setHasEntry(html !== null);
    setSrcDoc((prev) => (html === null ? '' : force && prev === html ? html + ' ' : prev === html ? prev : html));
  };

  useEffect(() => {
    let timer;
    build();
    const onUpdate = () => { clearTimeout(timer); timer = setTimeout(build, 450); };
    doc.on('update', onUpdate);
    return () => { doc.off('update', onUpdate); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, files]);

  useEffect(() => { if (nonce) { setLogs([]); build(true); } }, [nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLogs([]); }, [srcDoc]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.source !== iframeRef.current?.contentWindow || !e.data?.__cfPreview) return;
      setLogs((l) => [...l.slice(-49), { type: e.data.type, text: String(e.data.text).slice(0, 500) }]);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dev = DEVICES.find((d) => d.id === device);
  const errors = logs.filter((l) => l.type === 'error').length;

  return (
    <div className="preview" hidden={hidden}>
      <div className="panel-subbar">
        <div className="seg">
          {DEVICES.map((d) => (
            <button key={d.id} className={device === d.id ? 'on' : ''} onClick={() => setDevice(d.id)} title={d.id}><d.icon size={13} /></button>
          ))}
        </div>
        <span className="url"><Globe size={12} /> localhost / preview</span>
        <button className="icon-btn sm" onClick={() => build(true)} title="Refresh preview"><RefreshCw size={13} /></button>
      </div>
      <div className="preview-stage">
        {hasEntry ? (
          <iframe
            ref={iframeRef}
            title="Live preview"
            className="preview-frame"
            style={{ width: dev.width, maxWidth: '100%' }}
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
            srcDoc={srcDoc}
          />
        ) : (
          <div className="empty"><Globe size={26} /><b>No HTML file yet</b><span>Create an <code>index.html</code> to see a live preview here.</span></div>
        )}
      </div>
      <div className={`preview-console ${open ? 'open' : ''}`}>
        <button className="pc-head" onClick={() => setOpen((o) => !o)}>
          Preview console
          {logs.length > 0 && <b className={errors ? 'err' : ''}>{logs.length}</b>}
          <span className="grow" />
          {open && logs.length > 0 && <span className="clear" onClick={(e) => { e.stopPropagation(); setLogs([]); }}><Trash2 size={12} /></span>}
        </button>
        {open && (
          <div className="pc-body">
            {logs.length === 0 && <div className="muted">Nothing logged yet.</div>}
            {logs.map((l, i) => <div key={i} className={`pc-line ${l.type}`}>{l.text}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
