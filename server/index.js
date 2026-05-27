const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
  createRoom,
  getRoom,
  addUser,
  removeUser,
  updateCode,
  updateLanguage,
  setTyping,
  getRoomUsers,
} = require("./rooms");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// ─── REST API ──────────────────────────────────────────────────────────────

// Generate new room ID
app.get("/api/room/create", (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  res.json({ roomId });
});

// Check if room exists
app.get("/api/room/:roomId", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    roomId: room.id,
    language: room.language,
    userCount: room.users.size,
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join a room
  socket.on("join-room", ({ roomId, username }) => {
    let room = getRoom(roomId);
    if (!room) room = createRoom(roomId);

    socket.join(roomId);
    const user = addUser(roomId, socket.id, username);

    // Send current room state to the joining user
    socket.emit("room-state", {
      code: room.code,
      language: room.language,
      users: getRoomUsers(roomId),
    });

    // Notify others in the room
    socket.to(roomId).emit("user-joined", {
      user,
      users: getRoomUsers(roomId),
    });

    console.log(`👤 ${username} joined room ${roomId}`);
    socket.data.roomId = roomId;
    socket.data.username = username;
  });

  // Code change
  socket.on("code-change", ({ roomId, code }) => {
    updateCode(roomId, code);
    socket.to(roomId).emit("code-update", { code, senderId: socket.id });
  });

  // Language change
  socket.on("language-change", ({ roomId, language }) => {
    updateLanguage(roomId, language);
    const room = getRoom(roomId);
    io.to(roomId).emit("language-update", {
      language,
      code: room?.code,
      changedBy: socket.data.username,
    });
  });

  // Typing indicators
  socket.on("typing-start", ({ roomId }) => {
    setTyping(roomId, socket.id, true);
    socket.to(roomId).emit("user-typing", {
      userId: socket.id,
      username: socket.data.username,
      isTyping: true,
    });
  });

  socket.on("typing-stop", ({ roomId }) => {
    setTyping(roomId, socket.id, false);
    socket.to(roomId).emit("user-typing", {
      userId: socket.id,
      username: socket.data.username,
      isTyping: false,
    });
  });

  // Run code (simulated output — in production, use Judge0 or Piston API)
  socket.on("run-code", ({ roomId, code, language }) => {
    socket.emit("code-output", {
      output: `▶ Running ${language}...\n\n[Output simulation]\nCode executed successfully.\nNote: Connect Judge0 or Piston API for live execution.\n\nLines: ${code.split("\n").length} | Chars: ${code.length}`,
      isError: false,
    });
  });

  // Cursor position
  socket.on("cursor-move", ({ roomId, position }) => {
    socket.to(roomId).emit("cursor-update", {
      userId: socket.id,
      username: socket.data.username,
      position,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const roomId = removeUser(socket.id);
    if (roomId) {
      io.to(roomId).emit("user-left", {
        userId: socket.id,
        username: socket.data.username,
        users: getRoomUsers(roomId),
      });
      console.log(`👋 ${socket.data.username} left room ${roomId}`);
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── START SERVER ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     CodeFusion Server ⚡              ║
  ║     Running on port ${PORT}              ║
  ╚═══════════════════════════════════════╝
  `);
});
