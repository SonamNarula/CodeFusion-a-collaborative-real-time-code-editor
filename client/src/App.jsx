import React, { useState, useEffect, useCallback, useRef } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useSocket } from "./hooks/useSocket";
import { useTheme } from "./hooks/useTheme";
import HomePage from "./pages/HomePage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import OutputPanel from "./components/OutputPanel";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const TOAST_STYLE = {
  style: {
    background: "#111118",
    color: "#e2e8f0",
    border: "1px solid #2d2d3d",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "12px",
  },
  iconTheme: { primary: "#00ff88", secondary: "#0a0a0f" },
};

export default function App() {
  const { socket, isConnected, emit, on } = useSocket();
  const { theme, toggle: toggleTheme, isDark } = useTheme();

  const [view, setView] = useState("home"); // "home" | "editor"
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState(null);
  const [currentSocketId, setCurrentSocketId] = useState(null);

  // Typing debounce
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Track socket id
  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => setCurrentSocketId(socket.id);
    socket.on("connect", handleConnect);
    if (socket.connected) setCurrentSocketId(socket.id);
    return () => socket.off("connect", handleConnect);
  }, [socket]);

  // ── Socket event listeners ──────────────────────────────────────────────

  useEffect(() => {
    const unsubRoom = on("room-state", ({ code, language, users }) => {
      setCode(code);
      setLanguage(language);
      setUsers(users);
    });

    const unsubJoin = on("user-joined", ({ user, users }) => {
      setUsers(users);
      toast(`${user.username} joined the room`, { ...TOAST_STYLE, icon: "👋" });
    });

    const unsubLeft = on("user-left", ({ username: name, users }) => {
      setUsers(users);
      setTypingUsers((prev) => prev.filter((t) => t.username !== name));
      toast(`${name} left the room`, { ...TOAST_STYLE, icon: "🚪" });
    });

    const unsubCode = on("code-update", ({ code: newCode, senderId }) => {
      setCode(newCode);
    });

    const unsubLang = on("language-update", ({ language: lang, code: newCode, changedBy }) => {
      setLanguage(lang);
      if (newCode) setCode(newCode);
      toast(`${changedBy} switched to ${lang}`, { ...TOAST_STYLE, icon: "💬" });
    });

    const unsubTyping = on("user-typing", ({ userId, username: name, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          const exists = prev.find((t) => t.userId === userId);
          if (!exists) return [...prev, { userId, username: name }];
          return prev;
        }
        return prev.filter((t) => t.userId !== userId);
      });
    });

    const unsubOutput = on("code-output", ({ output: out, isError }) => {
      setOutput(out);
      setIsRunning(false);
    });

    return () => {
      unsubRoom?.();
      unsubJoin?.();
      unsubLeft?.();
      unsubCode?.();
      unsubLang?.();
      unsubTyping?.();
      unsubOutput?.();
    };
  }, [on]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const createRoom = useCallback(
    async (uname) => {
      try {
        const res = await fetch(`${SERVER_URL}/api/room/create`);
        const { roomId: id } = await res.json();
        setUsername(uname);
        setRoomId(id);
        emit("join-room", { roomId: id, username: uname });
        setView("editor");
        toast(`Room ${id} created!`, { ...TOAST_STYLE, icon: "🚀" });
      } catch {
        toast.error("Failed to create room. Is the server running?", TOAST_STYLE);
      }
    },
    [emit]
  );

  const joinRoom = useCallback(
    async (id, uname) => {
      setUsername(uname);
      setRoomId(id);
      emit("join-room", { roomId: id, username: uname });
      setView("editor");
      toast(`Joined room ${id}`, { ...TOAST_STYLE, icon: "🔗" });
    },
    [emit]
  );

  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);
      emit("code-change", { roomId, code: newCode });

      // Typing indicator logic
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        emit("typing-start", { roomId });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        emit("typing-stop", { roomId });
      }, 1500);
    },
    [emit, roomId]
  );

  const handleLanguageChange = useCallback(
    (lang) => {
      setLanguage(lang);
      emit("language-change", { roomId, language: lang });
    },
    [emit, roomId]
  );

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    setOutput("");
    emit("run-code", { roomId, code, language });
    // Fallback timeout
    setTimeout(() => setIsRunning(false), 8000);
  }, [emit, roomId, code, language]);

  const handleLeave = useCallback(() => {
    setView("home");
    setRoomId("");
    setCode("");
    setUsers([]);
    setTypingUsers([]);
    setOutput("");
    toast("Left the room", { ...TOAST_STYLE, icon: "👋" });
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  if (view === "home") {
    return (
      <>
        <Toaster position="bottom-right" />
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isConnected={isConnected}
        />
      </>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? "dark" : "light"}`}>
      <Toaster position="bottom-right" />

      <Header
        roomId={roomId}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onLeaveRoom={handleLeave}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        isConnected={isConnected}
        userCount={users.length}
        isRunning={isRunning}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main editor area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            onCursorChange={setCursorPos}
            isDark={isDark}
          />

          <OutputPanel
            output={output}
            isRunning={isRunning}
            onClear={() => setOutput("")}
            cursorPos={cursorPos}
            language={language}
          />
        </div>

        {/* Sidebar toggle button (mobile) */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-5 h-12
                     bg-void-800 border border-void-600 border-r-0 rounded-l-md
                     flex items-center justify-center
                     text-slate-500 hover:text-neon-green
                     transition-all duration-200 xl:hidden"
          style={{ right: sidebarOpen ? "16rem" : "0" }}
        >
          <span className="text-[10px]">{sidebarOpen ? "›" : "‹"}</span>
        </button>

        {/* Sidebar */}
        <div
          className={`transition-all duration-300 overflow-hidden shrink-0 ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <Sidebar
            users={users}
            typingUsers={typingUsers}
            currentUserId={currentSocketId}
            roomId={roomId}
          />
        </div>
      </div>
    </div>
  );
}
