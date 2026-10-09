import '../monaco-setup.js';
import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';

const safeName = (s) => String(s || '').replace(/[^\w .-]/g, '').slice(0, 20);
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#888888');

// y-monaco tags every remote selection/caret with the peer's client id; style each one per person.
function cursorCss(awareness) {
  let css = '';
  awareness.getStates().forEach((s, id) => {
    if (id === awareness.clientID || !s.user) return;
    const c = safeColor(s.user.color);
    css +=
      `.yRemoteSelection-${id}{background:${c}38}` +
      `.yRemoteSelectionHead-${id}{border-color:${c}}` +
      `.yRemoteSelectionHead-${id}::after{content:"${safeName(s.user.name)}";background:${c}}\n`;
  });
  return css;
}

function defineThemes(monaco) {
  monaco.editor.defineTheme('cf-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#0e1013' } });
  monaco.editor.defineTheme('cf-light', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ffffff' } });
}

export default function CodeEditor({ collab, language, readOnly, theme, followId, onRun }) {
  const cleanup = useRef(null);
  const followRef = useRef(followId);
  const runRef = useRef(onRun);
  followRef.current = followId;
  runRef.current = onRun;

  useEffect(() => () => cleanup.current?.(), []);

  const handleMount = (editor, monaco) => {
    cleanup.current?.(); // React StrictMode can mount twice in dev
    const { code, awareness } = collab;
    const binding = new MonacoBinding(code, editor.getModel(), new Set([editor]), awareness);

    let cursorTimer = null;
    const cursorSub = editor.onDidChangeCursorPosition(() => {
      if (cursorTimer) return;
      cursorTimer = setTimeout(() => {
        cursorTimer = null;
        const p = editor.getPosition();
        if (p) awareness.setLocalStateField('cursor', { line: p.lineNumber, column: p.column });
      }, 150);
    });

    let typingTimer;
    const typingSub = editor.onDidChangeModelContent(() => {
      awareness.setLocalStateField('typing', true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => awareness.setLocalStateField('typing', false), 1200);
    });

    editor.addAction({
      id: 'cf-run',
      label: 'Run code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => runRef.current?.(),
    });

    const style = document.createElement('style');
    document.head.appendChild(style);
    const refresh = () => {
      style.textContent = cursorCss(awareness);
      const target = followRef.current;
      if (!target) return;
      awareness.getStates().forEach((s) => {
        if (s.user?.id === target && s.cursor) {
          editor.revealPositionInCenterIfOutsideViewport({ lineNumber: s.cursor.line, column: s.cursor.column });
        }
      });
    };
    awareness.on('change', refresh);
    refresh();

    cleanup.current = () => {
      awareness.off('change', refresh);
      clearTimeout(cursorTimer);
      clearTimeout(typingTimer);
      cursorSub.dispose();
      typingSub.dispose();
      style.remove();
      binding.destroy();
      cleanup.current = null;
    };
  };

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme === 'dark' ? 'cf-dark' : 'cf-light'}
      beforeMount={defineThemes}
      onMount={handleMount}
      loading={<div className="splash">Loading editor…</div>}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Cascadia Code", ui-monospace, Menlo, Consolas, monospace',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 14 },
        smoothScrolling: true,
        renderLineHighlight: 'gutter',
        tabSize: 2,
      }}
    />
  );
}
