# ⚡ CodeFusion — Real-Time Collaborative Code Editor

<div align="center">

![CodeFusion Banner](https://img.shields.io/badge/CodeFusion-Real--Time%20Collaborative%20Editor-6366f1?style=for-the-badge&logo=visual-studio-code&logoColor=white)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco-Editor-007ACC?style=flat-square&logo=visual-studio-code)](https://microsoft.github.io/monaco-editor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A production-grade, real-time collaborative coding platform built for developers.**  
Code together, anywhere, instantly — like Google Docs but for code.

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📸 Preview

> Dark mode, Monaco editor, multi-user cursors, live sync — all in one clean UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔴 **Real-Time Sync** | Code changes propagate to all users in a room within milliseconds via WebSockets |
| 🏠 **Room System** | Create or join private coding rooms using a unique Room ID |
| 🌐 **Multi-Language** | Support for JavaScript, Python, C++, Java, Go, TypeScript, and more |
| ⌨️ **Typing Indicators** | See who is actively typing in real time |
| ▶️ **Run Code** | Execute code and see output directly in the browser |
| 📋 **Copy Room ID** | One-click room ID sharing for easy onboarding |
| 🌙 **Dark / Light Mode** | Toggle between themes; preference saved to localStorage |
| 📱 **Responsive UI** | Fully functional across desktop, tablet, and mobile viewports |

---

## 🏗️ Architecture & Tech Stack

```
CodeFusion/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── CodeEditor.jsx        # Monaco Editor wrapper
│   │   │   │   ├── LanguageSelector.jsx  # Language dropdown
│   │   │   │   └── OutputPanel.jsx       # Code execution output
│   │   │   ├── Room/
│   │   │   │   ├── RoomLobby.jsx         # Create/Join room UI
│   │   │   │   ├── RoomHeader.jsx        # Room ID + participants
│   │   │   │   └── ParticipantList.jsx   # Active users sidebar
│   │   │   └── UI/
│   │   │       ├── ThemeToggle.jsx
│   │   │       └── Toast.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js              # Socket.io connection logic
│   │   │   ├── useEditor.js              # Editor state management
│   │   │   └── useRoom.js                # Room join/create logic
│   │   ├── context/
│   │   │   ├── SocketContext.jsx         # Global socket provider
│   │   │   └── ThemeContext.jsx          # Theme state provider
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # Landing/lobby page
│   │   │   └── EditorPage.jsx            # Main editor workspace
│   │   ├── utils/
│   │   │   └── socketEvents.js           # Event name constants
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                     # Node.js + Express Backend
    ├── src/
    │   ├── socket/
    │   │   ├── roomHandler.js            # Room create/join/leave events
    │   │   └── codeHandler.js            # Code sync & typing events
    │   ├── utils/
    │   │   └── roomManager.js            # In-memory room state
    │   └── index.js                      # Express + Socket.io setup
    └── package.json
```

### Frontend
- **React 18** — UI with hooks-based architecture
- **Monaco Editor** — VS Code's editor engine embedded in browser
- **Tailwind CSS** — Utility-first styling with custom dark/light themes
- **Socket.io Client** — Real-time bidirectional communication
- **React Router v6** — Client-side routing between lobby and editor

### Backend
- **Node.js + Express** — HTTP server and REST endpoints
- **Socket.io** — WebSocket management, room namespacing, event broadcasting
- **In-memory Room Store** — Lightweight Map-based room/user state

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/codefusion.git
cd codefusion

# 2. Install server dependencies
cd server
npm install

# 3. Install client dependencies
cd ../client
npm install
```

### Environment Variables

**Server** — create `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client** — create `client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```

### Run Locally

```bash
# Terminal 1 — Start server
cd server
npm run dev

# Terminal 2 — Start client
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔌 Socket Events Reference

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | Client → Server | `{ username }` | Create a new room |
| `room:join` | Client → Server | `{ roomId, username }` | Join existing room |
| `room:leave` | Client → Server | `{ roomId }` | Leave room |
| `code:change` | Client → Server | `{ roomId, code }` | Broadcast code delta |
| `code:sync` | Server → Client | `{ code }` | Initial code on join |
| `typing:start` | Client → Server | `{ roomId, username }` | User started typing |
| `typing:stop` | Client → Server | `{ roomId, username }` | User stopped typing |
| `user:joined` | Server → Client | `{ username, users[] }` | Notify room of new user |
| `user:left` | Server → Client | `{ username, users[] }` | Notify room user left |

---

## 🌐 Deployment Guide

### Deploy Backend — Railway / Render

```bash
# Build command
npm install

# Start command  
node src/index.js

# Environment Variables on platform:
PORT=5000
CLIENT_URL=https://your-frontend.vercel.app
```

### Deploy Frontend — Vercel

```bash
# Build command
npm run build

# Output directory
dist

# Environment Variable:
VITE_SERVER_URL=https://your-backend.railway.app
```

> ⚠️ **Important**: Update CORS origin in server `index.js` to match your deployed frontend URL.

### Docker (Optional)

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]
```

---

## 📄 Resume-Ready Description

> **CodeFusion** — Real-Time Collaborative Code Editor  
> Built a full-stack collaborative coding platform using **React**, **Node.js**, **Socket.io**, and **Monaco Editor**. Implemented WebSocket-based real-time code synchronization across multiple clients within shared rooms, with typing indicators, multi-language support, and a code execution engine. Designed a scalable room management system using server-side Maps and Socket.io namespacing. Deployed with Vercel (frontend) and Railway (backend) with environment-based configuration.

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/AmazingFeature`
3. Commit your changes: `git commit -m 'feat: add AmazingFeature'`
4. Push to the branch: `git push origin feat/AmazingFeature`
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
Built with ❤️ by <strong>Your Name</strong> · <a href="https://github.com/yourusername">GitHub</a> · <a href="https://linkedin.com/in/yourprofile">LinkedIn</a>
</div>
