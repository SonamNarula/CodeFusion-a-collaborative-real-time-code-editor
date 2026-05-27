import React, { useState } from "react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "#f7df1e" },
  { id: "typescript", label: "TypeScript", icon: "TS", color: "#3178c6" },
  { id: "python", label: "Python", icon: "PY", color: "#3572A5" },
  { id: "cpp", label: "C++", icon: "C+", color: "#f34b7d" },
  { id: "java", label: "Java", icon: "JV", color: "#b07219" },
  { id: "rust", label: "Rust", icon: "RS", color: "#dea584" },
  { id: "go", label: "Go", icon: "GO", color: "#00add8" },
  { id: "html", label: "HTML", icon: "HT", color: "#e34c26" },
];

export default function Header({
  roomId,
  language,
  onLanguageChange,
  onRunCode,
  onLeaveRoom,
  onToggleTheme,
  isDark,
  isConnected,
  userCount,
  isRunning,
}) {
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success(`Room ID copied: ${roomId}`, {
      style: { background: "#111118", color: "#e2e8f0", border: "1px solid #2d2d3d", fontFamily: "JetBrains Mono" },
      iconTheme: { primary: "#00ff88", secondary: "#0a0a0f" },
    });
  };

  return (
    <header className="flex items-center justify-between px-4 h-14 bg-void-900 border-b border-void-700 z-50 shrink-0">
      {/* Left: Logo + Room ID */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neon-green rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,255,136,0.4)]">
            <span className="text-sm">⚡</span>
          </div>
          <span className="font-display font-bold text-white text-sm hidden sm:block">
            Code<span className="text-neon-green">Fusion</span>
          </span>
        </div>

        <div className="h-5 w-px bg-void-600" />

        {/* Room ID chip */}
        <button
          onClick={copyRoomId}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-void-800 border border-void-600
                     hover:border-neon-green/50 hover:bg-void-700 transition-all duration-150 group"
          title="Click to copy Room ID"
        >
          <span className="font-mono text-xs text-slate-500">ROOM</span>
          <span className="font-mono text-xs font-bold text-neon-green tracking-widest">{roomId}</span>
          <svg className="w-3 h-3 text-slate-600 group-hover:text-neon-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Online users badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-void-800 border border-void-600">
          <div className="relative flex">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-neon-green animate-ping-slow opacity-60" />
          </div>
          <span className="font-mono text-xs text-slate-400">{userCount} online</span>
        </div>
      </div>

      {/* Center: Language selector */}
      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-void-800 border border-void-600
                     hover:border-neon-cyan/50 transition-all duration-150 group"
        >
          <span
            className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: currentLang.color + "22", color: currentLang.color }}
          >
            {currentLang.icon}
          </span>
          <span className="font-mono text-xs text-slate-300 hidden sm:block">{currentLang.label}</span>
          <svg className={clsx("w-3 h-3 text-slate-500 transition-transform duration-200", langOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {langOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 py-1 rounded-xl
                          bg-void-800 border border-void-600 shadow-2xl shadow-black/60 z-50 animate-slide-up">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => { onLanguageChange(lang.id); setLangOpen(false); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100",
                  lang.id === language
                    ? "bg-neon-green/10 text-neon-green"
                    : "text-slate-400 hover:bg-void-700 hover:text-slate-200"
                )}
              >
                <span className="font-mono text-xs font-bold w-6 text-center" style={{ color: lang.color }}>
                  {lang.icon}
                </span>
                <span className="font-mono text-xs">{lang.label}</span>
                {lang.id === language && <span className="ml-auto text-neon-green text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Run button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all duration-200",
            isRunning
              ? "bg-neon-green/20 text-neon-green/60 cursor-not-allowed"
              : "bg-neon-green text-void-950 hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] active:scale-95"
          )}
        >
          {isRunning ? (
            <><span className="animate-spin">⟳</span><span className="hidden sm:block">Running</span></>
          ) : (
            <><span>▶</span><span className="hidden sm:block">Run</span></>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-void-800 border border-void-600
                     hover:border-void-500 text-slate-400 hover:text-slate-200 transition-all duration-150"
          title="Toggle theme"
        >
          {isDark ? "☀" : "🌙"}
        </button>

        {/* Connection indicator */}
        <div className={clsx(
          "hidden sm:flex w-8 h-8 items-center justify-center rounded-md border transition-all duration-300",
          isConnected
            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        )} title={isConnected ? "Connected" : "Disconnected"}>
          <span className="text-xs">{isConnected ? "✓" : "✗"}</span>
        </div>

        {/* Leave */}
        <button
          onClick={onLeaveRoom}
          className="btn-danger py-1.5 px-2 sm:px-3"
          title="Leave room"
        >
          <span>⇥</span>
          <span className="hidden sm:block">Leave</span>
        </button>
      </div>
    </header>
  );
}

export { LANGUAGES };
