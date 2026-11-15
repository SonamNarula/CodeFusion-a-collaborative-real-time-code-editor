import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ThemeCtx = createContext(null);
const ToastCtx = createContext(() => {});

export const useTheme = () => useContext(ThemeCtx);
export const useToast = () => useContext(ToastCtx);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cf_theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);
  const push = useCallback((message, type = 'info') => {
    const id = ++seq.current;
    setItems((list) => [...list.slice(-3), { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);
  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.type] || Info;
          return <div key={t.id} className={`toast ${t.type}`}><I size={16} />{t.message}</div>;
        })}
      </div>
    </ToastCtx.Provider>
  );
}
