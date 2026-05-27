import React from "react";
import { clsx } from "clsx";

const AVATAR_COLORS = [
  "#00ff88", "#00e5ff", "#bf5af2", "#ff6b35", "#ffd60a",
  "#ff375f", "#30d158", "#64d2ff", "#ff9f0a", "#bf5af2",
];

function getColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username) {
  return username.slice(0, 2).toUpperCase();
}

export default function Sidebar({ users = [], typingUsers = [], currentUserId, roomId }) {
  return (
    <aside className="w-64 bg-void-900 border-l border-void-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-void-700">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Collaborators
          </h2>
          <span className="font-mono text-xs text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full border border-neon-green/20">
            {users.length}
          </span>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-mono text-xs text-slate-600">No users yet</p>
          </div>
        ) : (
          users.map((user) => {
            const color = getColor(user.username);
            const isTyping = typingUsers.some((t) => t.userId === user.id);
            const isYou = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isYou ? "bg-void-700/50" : "hover:bg-void-800"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-void-950"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(user.username)}
                  </div>
                  {/* Online pulse */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon-green border-2 border-void-900" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-200 truncate">{user.username}</span>
                    {isYou && (
                      <span className="font-mono text-[10px] text-slate-500 bg-void-700 px-1.5 py-px rounded shrink-0">
                        you
                      </span>
                    )}
                  </div>

                  {/* Typing indicator */}
                  {isTyping ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[10px] text-neon-cyan">typing</span>
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="typing-dot w-1 h-1 rounded-full bg-neon-cyan"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-slate-600">idle</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Room info panel */}
      <div className="p-4 border-t border-void-700 space-y-3">
        <div>
          <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-1">Session</p>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-void-800 border border-void-600">
            <span className="font-mono text-xs font-bold text-neon-green tracking-widest flex-1">{roomId}</span>
            <button
              onClick={() => navigator.clipboard.writeText(roomId)}
              className="text-slate-500 hover:text-neon-green transition-colors"
              title="Copy Room ID"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-600">Share room ID to invite</span>
        </div>
      </div>
    </aside>
  );
}
