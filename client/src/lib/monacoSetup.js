import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

const ts = monaco.languages.typescript;
const compilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  allowNonTsExtensions: true,
  allowJs: true,
  jsx: ts.JsxEmit.React,
  esModuleInterop: true,
};
ts.javascriptDefaults.setCompilerOptions(compilerOptions);
ts.typescriptDefaults.setCompilerOptions(compilerOptions);
ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });

const rules = (dark) => [
  { token: 'comment', foreground: dark ? '5c6585' : '9aa1b8', fontStyle: 'italic' },
  { token: 'keyword', foreground: dark ? 'c792ff' : '7c3aed' },
  { token: 'string', foreground: dark ? '86efac' : '15803d' },
  { token: 'number', foreground: dark ? 'fb923c' : 'c2410c' },
  { token: 'type', foreground: dark ? '5eead4' : '0f766e' },
  { token: 'type.identifier', foreground: dark ? '5eead4' : '0f766e' },
  { token: 'tag', foreground: dark ? 'f472b6' : 'be185d' },
  { token: 'attribute.name', foreground: dark ? 'fbbf24' : 'b45309' },
  { token: 'attribute.value', foreground: dark ? '86efac' : '15803d' },
  { token: 'regexp', foreground: dark ? 'f9a8d4' : 'be185d' },
  { token: 'delimiter', foreground: dark ? '8a92ad' : '6b7390' },
  { token: 'identifier', foreground: dark ? 'e6e9f5' : '1f2540' },
];

monaco.editor.defineTheme('fusion-midnight', {
  base: 'vs-dark',
  inherit: true,
  rules: rules(true),
  colors: {
    'editor.background': '#090a11',
    'editor.foreground': '#d6dbee',
    'editorLineNumber.foreground': '#3f465c',
    'editorLineNumber.activeForeground': '#a79cff',
    'editor.lineHighlightBackground': '#ffffff08',
    'editor.lineHighlightBorder': '#00000000',
    'editorCursor.foreground': '#a79cff',
    'editor.selectionBackground': '#7c6cff44',
    'editor.inactiveSelectionBackground': '#7c6cff22',
    'editorIndentGuide.background1': '#ffffff0d',
    'editorIndentGuide.activeBackground1': '#ffffff25',
    'editorWidget.background': '#11131c',
    'editorWidget.border': '#ffffff14',
    'editorSuggestWidget.background': '#11131c',
    'editorSuggestWidget.border': '#ffffff14',
    'editorSuggestWidget.selectedBackground': '#7c6cff2e',
    'editorHoverWidget.background': '#11131c',
    'editorHoverWidget.border': '#ffffff14',
    'scrollbarSlider.background': '#ffffff14',
    'scrollbarSlider.hoverBackground': '#ffffff24',
    'editorBracketMatch.background': '#7c6cff30',
    'editorBracketMatch.border': '#7c6cff80',
    'editorGutter.background': '#090a11',
  },
});

monaco.editor.defineTheme('fusion-daylight', {
  base: 'vs',
  inherit: true,
  rules: rules(false),
  colors: {
    'editor.background': '#fcfcff',
    'editor.foreground': '#2a3047',
    'editorLineNumber.foreground': '#b4bacd',
    'editorLineNumber.activeForeground': '#6a58f0',
    'editor.lineHighlightBackground': '#6a58f00a',
    'editor.lineHighlightBorder': '#00000000',
    'editorCursor.foreground': '#6a58f0',
    'editor.selectionBackground': '#7c6cff30',
    'editorIndentGuide.background1': '#1a1f3d12',
    'editorWidget.background': '#ffffff',
    'editorWidget.border': '#1a1f3d1a',
    'editorSuggestWidget.selectedBackground': '#7c6cff1f',
    'editorGutter.background': '#fcfcff',
  },
});

export const monacoThemeFor = (uiTheme) => (uiTheme === 'light' ? 'fusion-daylight' : 'fusion-midnight');

/** Find the live Monaco model that belongs to a workspace file id. */
export const getModelForFile = (id) =>
  monaco.editor.getModels().find((m) => m.uri.path.startsWith(`/${id}.`)) || null;

export { monaco };
