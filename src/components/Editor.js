import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/xml/xml';
import ACTIONS from '../Actions';

const modes = { javascript: 'javascript', python: 'python', html: 'xml', json: { name: 'javascript', json: true } };

const Editor = ({ socketRef, roomId, language, initialCode, onCodeChange }) => {
    const editorRef = useRef(null);
    const applyingRemote = useRef(false);
    useEffect(() => {
        editorRef.current = CodeMirror.fromTextArea(document.getElementById('realtimeEditor'), { mode: modes[language] || modes.javascript, theme: 'dracula', lineNumbers: true, lineWrapping: true });
        editorRef.current.setValue(initialCode || '');
        editorRef.current.on('change', (instance, changes) => {
            const code = instance.getValue();
            onCodeChange(code);
            if (changes.origin !== 'setValue' && !applyingRemote.current) socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
        });
        return () => editorRef.current?.toTextArea();
    }, []);
    useEffect(() => {
        if (editorRef.current) editorRef.current.setOption('mode', modes[language] || modes.javascript);
    }, [language]);
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
        socket?.on(ACTIONS.SYNC_CODE, ({ code, language: serverLanguage }) => {
            receive({ code: code || '' });
            if (serverLanguage) onCodeChange(code || '');
        });
        return () => socket?.off(ACTIONS.CODE_CHANGE, receive);
    }, [socketRef.current]);
    return <textarea id="realtimeEditor" />;
};

export default Editor;
