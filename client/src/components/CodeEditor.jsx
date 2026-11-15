import React, { memo, useEffect, useRef } from 'react';
import { MonacoBinding } from 'y-monaco';
import { monaco } from '../lib/monacoSetup';
import { extOf, langFromName } from '../lib/utils';

/**
 * One Monaco editor; one model + Yjs binding per workspace file.
 * Remote cursors are rendered by y-monaco and styled in <RemoteCursorStyles />.
 */
function CodeEditor({ doc, awareness, file, fileIds, theme, onEditor, onCursor, onRun }) {
  const host = useRef(null);
  const editorRef = useRef(null);
  const entries = useRef(new Map()); // fileId -> { key, model, binding }
  const cb = useRef({});
  cb.current = { onCursor, onRun, fileId: file?.id };

  useEffect(() => {
    const editor = monaco.editor.create(host.current, {
      theme,
      model: null,
      automaticLayout: true,
      fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
      fontSize: 13.5,
      lineHeight: 22,
      fontLigatures: true,
      minimap: { enabled: false },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      roundedSelection: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      lineNumbersMinChars: 3,
      tabSize: 2,
      mouseWheelZoom: true,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      fixedOverflowWidgets: true,
    });
    editorRef.current = editor;
    onEditor?.(editor);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => cb.current.onRun?.());
    const sub = editor.onDidChangeCursorPosition((e) => {
      const { lineNumber: line, column } = e.position;
      cb.current.onCursor?.({ line, column });
      awareness.setLocalStateField('cursor', { file: cb.current.fileId, line, column });
    });

    return () => {
      sub.dispose();
      entries.current.forEach((en) => { en.binding.destroy(); en.model.dispose(); });
      entries.current.clear();
      editor.dispose();
      editorRef.current = null;
      onEditor?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, awareness]);

  // Show the active file (create its model + Yjs binding on first open).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!file) { editor.setModel(null); return; }

    const key = `${file.id}.${extOf(file.name) || 'txt'}`;
    let en = entries.current.get(file.id);
    if (en && en.key !== key) {
      if (editor.getModel() === en.model) editor.setModel(null);
      en.binding.destroy();
      en.model.dispose();
      entries.current.delete(file.id);
      en = null;
    }
    if (!en) {
      const uri = monaco.Uri.parse(`file:///${key}`);
      const model = monaco.editor.getModel(uri) || monaco.editor.createModel('', langFromName(file.name), uri);
      const binding = new MonacoBinding(doc.getText(`file:${file.id}`), model, new Set([editor]), awareness);
      en = { key, model, binding };
      entries.current.set(file.id, en);
    }
    editor.setModel(en.model);
    const p = editor.getPosition() || { lineNumber: 1, column: 1 };
    awareness.setLocalStateField('cursor', { file: file.id, line: p.lineNumber, column: p.column });
  }, [file?.id, file?.name, doc, awareness]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop models for files that were deleted.
  const idsKey = fileIds.join('|');
  useEffect(() => {
    const editor = editorRef.current;
    entries.current.forEach((en, id) => {
      if (fileIds.includes(id)) return;
      if (editor && editor.getModel() === en.model) editor.setModel(null);
      en.binding.destroy();
      en.model.dispose();
      entries.current.delete(id);
    });
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { monaco.editor.setTheme(theme); }, [theme]);

  return <div ref={host} className="monaco-host" />;
}

export default memo(CodeEditor);
