import React, { useEffect, useRef } from "react";
import { clsx } from "clsx";

export default function OutputPanel({ output, isRunning, onClear, cursorPos, language }) {
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-64 bg-void-950 border-t border-void-700 flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-void-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">Terminal Output</span>
          {isRunning && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="font-mono text-xs text-neon-green">Running...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Cursor position */}
          {cursorPos && (
            <span className="font-mono text-[10px] text-slate-600">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          )}
          <span className="font-mono text-[10px] text-slate-600 uppercase">{language}</span>

          {output && (
            <button
              onClick={onClear}
              className="font-mono text-[10px] text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Output content */}
      <div
        ref={outputRef}
        className={clsx(
          "flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed",
          "text-slate-300 bg-void-950"
        )}
      >
        {!output && !isRunning ? (
          <div className="flex items-center gap-2 text-slate-700">
            <span>▶</span>
            <span className="text-xs">Press Run to execute code...</span>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words text-xs leading-6">
            {output && output.split("\n").map((line, i) => {
              const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("exception");
              const isSuccess = line.includes("✓") || line.includes("successfully");
              const isPrompt = line.startsWith("▶");

              return (
                <span
                  key={i}
                  className={clsx(
                    "block",
                    isError && "text-red-400",
                    isSuccess && "text-neon-green",
                    isPrompt && "text-neon-cyan"
                  )}
                >
                  {line || "\u00A0"}
                </span>
              );
            })}
            {isRunning && (
              <span className="inline-flex items-center gap-1 text-neon-green">
                <span className="animate-blink">█</span>
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
