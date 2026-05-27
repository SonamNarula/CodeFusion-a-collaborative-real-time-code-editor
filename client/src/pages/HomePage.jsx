import React, { useState } from "react";
import { clsx } from "clsx";

const ADJECTIVES = ["Blazing", "Fluid", "Quantum", "Neural", "Atomic"];
const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];

export default function HomePage({ onCreateRoom, onJoinRoom, isConnected }) {
  const [joinId, setJoinId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState(null); // "create" | "join"
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!username.trim()) { setError("Enter a username"); return; }
    setError("");
    onCreateRoom(username.trim());
  };

  const handleJoin = async () => {
    if (!username.trim()) { setError("Enter a username"); return; }
    if (!joinId.trim()) { setError("Enter a Room ID"); return; }
    setError("");
    onJoinRoom(joinId.trim().toUpperCase(), username.trim());
  };

  return (
    <div className="min-h-screen bg-void-950 bg-grid flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/3 rounded-full blur-3xl pointer-events-none" />

      {/* Connection status */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <div className={clsx("w-2 h-2 rounded-full", isConnected ? "bg-neon-green shadow-[0_0_6px_rgba(0,255,136,0.8)]" : "bg-red-500")} />
        <span className="font-mono text-xs text-slate-500">
          {isConnected ? "SERVER ONLINE" : "CONNECTING..."}
        </span>
      </div>

      {/* Logo + Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="absolute inset-0 w-12 h-12 bg-neon-green rounded-xl blur-md opacity-40 animate-ping-slow" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
            Code<span className="text-neon-green">Fusion</span>
          </h1>
        </div>

        <p className="font-display text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
          {randomAdj} real-time<br />
          <span className="text-gradient">collaborative coding</span>
        </p>

        <p className="font-body text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
          Create a room, share the ID, and code together instantly.
          No sign-up. No friction. Just pure collaboration.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["Monaco Editor", "8 Languages", "Live Sync", "Typing Indicators", "Code Runner"].map((f) => (
            <span key={f} className="lang-badge">{f}</span>
          ))}
        </div>
      </div>

      {/* Action Card */}
      <div className="w-full max-w-md animate-slide-up">
        <div className="glass-card p-8 shadow-2xl shadow-black/50">
          {/* Username always shown */}
          <div className="mb-5">
            <label className="block font-mono text-xs text-slate-500 uppercase tracking-widest mb-2">
              Your Username
            </label>
            <input
              className="input-field"
              placeholder="e.g. linus_torvalds"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (mode === "join") handleJoin();
                  else if (mode === "create") handleCreate();
                }
              }}
            />
          </div>

          {/* Mode selector */}
          {!mode && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("create")}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-void-600
                           hover:border-neon-green hover:bg-neon-green/5 transition-all duration-200 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🆕</span>
                <span className="font-mono text-sm font-semibold text-white">Create Room</span>
                <span className="font-body text-xs text-slate-500">Start a new session</span>
              </button>
              <button
                onClick={() => setMode("join")}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-void-600
                           hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all duration-200 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🔗</span>
                <span className="font-mono text-sm font-semibold text-white">Join Room</span>
                <span className="font-body text-xs text-slate-500">Enter a room ID</span>
              </button>
            </div>
          )}

          {/* Create mode */}
          {mode === "create" && (
            <div className="animate-slide-up space-y-4">
              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className="btn-neon w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>⚡</span>
                Create Room
              </button>
              <button onClick={() => setMode(null)} className="btn-ghost w-full justify-center">
                ← Back
              </button>
            </div>
          )}

          {/* Join mode */}
          {mode === "join" && (
            <div className="animate-slide-up space-y-4">
              <div>
                <label className="block font-mono text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Room ID
                </label>
                <input
                  className="input-field uppercase tracking-widest"
                  placeholder="e.g. A1B2C3D4"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  maxLength={8}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!isConnected}
                className="w-full justify-center py-3 font-mono text-sm font-semibold
                           bg-neon-cyan text-void-950 rounded-md
                           hover:shadow-[0_0_20px_rgba(0,229,255,0.5)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 active:scale-95
                           inline-flex items-center gap-2"
              >
                <span>🔗</span>
                Join Room
              </button>
              <button onClick={() => setMode(null)} className="btn-ghost w-full justify-center">
                ← Back
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 font-mono text-xs text-red-400 text-center animate-fade-in">
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center font-mono text-xs text-slate-600 mt-4">
          Open source · No account needed · Built with Socket.io + Monaco
        </p>
      </div>
    </div>
  );
}
