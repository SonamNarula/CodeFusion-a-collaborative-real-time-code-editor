import React, { useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";

const MONACO_THEME_DARK = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "4a5568", fontStyle: "italic" },
    { token: "keyword", foreground: "00ff88" },
    { token: "string", foreground: "ffd60a" },
    { token: "number", foreground: "ff6b35" },
    { token: "type", foreground: "00e5ff" },
    { token: "function", foreground: "bf5af2" },
    { token: "variable", foreground: "e2e8f0" },
    { token: "operator", foreground: "ff375f" },
    { token: "delimiter", foreground: "64748b" },
  ],
  colors: {
    "editor.background": "#0a0a0f",
    "editor.foreground": "#e2e8f0",
    "editor.lineHighlightBackground": "#111118",
    "editor.selectionBackground": "#00ff8822",
    "editor.inactiveSelectionBackground": "#00ff8811",
    "editorLineNumber.foreground": "#2d2d3d",
    "editorLineNumber.activeForeground": "#00ff88",
    "editorCursor.foreground": "#00ff88",
    "editor.findMatchBackground": "#ffd60a33",
    "editorBracketMatch.background": "#00ff8822",
    "editorBracketMatch.border": "#00ff8866",
    "editorGutter.background": "#0a0a0f",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#2d2d3d88",
    "scrollbarSlider.hoverBackground": "#00ff8833",
    "editorWidget.background": "#111118",
    "editorWidget.border": "#2d2d3d",
    "input.background": "#0a0a0f",
    "input.border": "#2d2d3d",
    "focusBorder": "#00ff88",
  },
};

const MONACO_THEME_LIGHT = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "94a3b8", fontStyle: "italic" },
    { token: "keyword", foreground: "059669" },
    { token: "string", foreground: "d97706" },
  ],
  colors: {
    "editor.background": "#f8fafc",
    "editor.lineHighlightBackground": "#f1f5f9",
    "editorLineNumber.foreground": "#94a3b8",
    "editorLineNumber.activeForeground": "#059669",
    "editorCursor.foreground": "#059669",
  },
};

const LANGUAGE_MAP = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  cpp: "cpp",
  java: "java",
  rust: "rust",
  go: "go",
  html: "html",
};

export default function CodeEditor({ code, language, onChange, onCursorChange, isDark }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      monaco.editor.defineTheme("codefusion-dark", MONACO_THEME_DARK);
      monaco.editor.defineTheme("codefusion-light", MONACO_THEME_LIGHT);
      monaco.editor.setTheme(isDark ? "codefusion-dark" : "codefusion-light");

      // Cursor position tracking
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.({ line: e.position.lineNumber, col: e.position.column });
      });

      editor.focus();
    },
    [isDark, onCursorChange]
  );

  const handleChange = useCallback(
    (value) => {
      onChange(value || "");
    },
    [onChange]
  );

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language] || "javascript"}
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={isDark ? "codefusion-dark" : "codefusion-light"}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          lineNumbers: "on",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "phase",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "line",
          padding: { top: 16, bottom: 16 },
          suggest: { preview: true },
          quickSuggestions: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          renderWhitespace: "selection",
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-void-950">
            <div className="text-center">
              <div className="text-2xl mb-3 animate-pulse-slow">⚡</div>
              <p className="font-mono text-xs text-slate-600">Loading editor...</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
