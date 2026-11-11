import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/shell/shell';
import ACTIONS from '../Actions';

const modes = {
    javascript: 'javascript',
    typescript: { name: 'javascript', typescript: true },
    python: 'python',
    java: 'text/x-java',
    cpp: 'text/x-c++src',
    csharp: 'text/x-csharp',
    go: 'text/x-go',
    rust: 'text/x-rustsrc',
    html: 'xml',
    css: 'css',
    json: { name: 'javascript', json: true },
    sql: 'sql',
    markdown: 'markdown',
    shell: 'shell',
};

const Editor = ({ socketRef, roomId, language, initialCode, theme, onCodeChange }) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const applyingRemote = useRef(false);
    useEffect(() => {
        if (editorRef.current || !textareaRef.current) return undefined;
        const editor = CodeMirror.fromTextArea(textareaRef.current, {
            mode: modes[language] || modes.javascript,
            theme,
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 4,
            tabSize: 4,
            autofocus: true,
        });
        editorRef.current = editor;
        editor.setValue(initialCode || '');
        editor.refresh();
        editor.on('change', (instance, changes) => {
            const code = instance.getValue();
            onCodeChange(code);
            if (changes.origin !== 'setValue' && !applyingRemote.current) {
                socketRef.current?.emit(ACTIONS.CODE_CHANGE, { roomId, code });
            }
        });
        requestAnimationFrame(() => editor.refresh());
        return () => {
            editor.toTextArea();
            editorRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (!editorRef.current || !initialCode || editorRef.current.getValue()) return;
        editorRef.current.setValue(initialCode);
        onCodeChange(initialCode);
    }, [initialCode, onCodeChange]);
    useEffect(() => {
        if (editorRef.current) editorRef.current.setOption('mode', modes[language] || modes.javascript);
    }, [language]);
    useEffect(() => {
        if (editorRef.current) editorRef.current.setOption('theme', theme);
    }, [theme]);
    useEffect(() => {
        const socket = socketRef.current;
        const receive = ({ code }) => {
            if (typeof code !== 'string' || !editorRef.current) return;
            applyingRemote.current = true;
            editorRef.current.setValue(code);
            applyingRemote.current = false;
            onCodeChange(code);
        };
        socket?.on(ACTIONS.CODE_CHANGE, receive);
        socket?.on(ACTIONS.SYNC_CODE, ({ code }) => receive({ code: code || '' }));
        return () => {
            socket?.off(ACTIONS.CODE_CHANGE, receive);
            socket?.off(ACTIONS.SYNC_CODE);
        };
    }, [socketRef.current]);
    return <textarea ref={textareaRef} id="realtimeEditor" defaultValue={initialCode || ''} />;
};

export default Editor;
