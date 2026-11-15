import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Eye, Pencil } from 'lucide-react';
import { MonacoBinding } from 'y-monaco';
import { monaco } from '../lib/monacoSetup';

export default function MarkdownNotes({ doc, awareness, theme, hidden }) {
  const host = useRef(null);
  const [mode, setMode] = useState('edit');
  const [text, setText] = useState('');
  const ytext = useMemo(() => doc.getText('notes'), [doc]);

  useEffect(() => {
    const model = monaco.editor.createModel('', 'markdown', monaco.Uri.parse('file:///__notes__.md'));
    const editor = monaco.editor.create(host.current, {
      model,
      theme,
      automaticLayout: true,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 14,
      lineHeight: 24,
      wordWrap: 'on',
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      minimap: { enabled: false },
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      scrollbar: { verticalScrollbarSize: 8 },
      lineDecorationsWidth: 18,
      fixedOverflowWidgets: true,
    });
    const binding = new MonacoBinding(ytext, model, new Set([editor]), awareness);
    const sync = () => setText(ytext.toString());
    sync();
    ytext.observe(sync);
    return () => {
      ytext.unobserve(sync);
      binding.destroy();
      editor.dispose();
      model.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytext, awareness]);

  const html = useMemo(() => DOMPurify.sanitize(marked.parse(text, { gfm: true, breaks: true })), [text]);

  return (
    <div className="notes" hidden={hidden}>
      <div className="panel-subbar">
        <span>Shared notepad · markdown</span>
        <div className="seg">
          <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}><Pencil size={12} /> Write</button>
          <button className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}><Eye size={12} /> Preview</button>
        </div>
      </div>
      <div className="notes-body">
        <div ref={host} className="notes-editor" style={{ display: mode === 'edit' ? 'block' : 'none' }} />
        {mode === 'preview' && <article className="md" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
