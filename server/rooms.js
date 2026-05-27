// Room state manager
const rooms = new Map();

function createRoom(roomId, language = "javascript") {
  const room = {
    id: roomId,
    code: getDefaultCode(language),
    language,
    users: new Map(),
    output: "",
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
}

function addUser(roomId, socketId, username) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const user = { id: socketId, username, joinedAt: Date.now(), isTyping: false };
  room.users.set(socketId, user);
  return user;
}

function removeUser(socketId) {
  let removedFrom = null;
  for (const [roomId, room] of rooms) {
    if (room.users.has(socketId)) {
      room.users.delete(socketId);
      removedFrom = roomId;
      if (room.users.size === 0) {
        // Keep empty rooms for 10 minutes before cleanup
        setTimeout(() => {
          if (rooms.get(roomId)?.users.size === 0) deleteRoom(roomId);
        }, 10 * 60 * 1000);
      }
      break;
    }
  }
  return removedFrom;
}

function updateCode(roomId, code) {
  const room = rooms.get(roomId);
  if (room) room.code = code;
}

function updateLanguage(roomId, language) {
  const room = rooms.get(roomId);
  if (room) {
    room.language = language;
    room.code = getDefaultCode(language);
  }
}

function setTyping(roomId, socketId, isTyping) {
  const room = rooms.get(roomId);
  if (room?.users.has(socketId)) {
    room.users.get(socketId).isTyping = isTyping;
  }
}

function getRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

function getDefaultCode(language) {
  const defaults = {
    javascript: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

function greet(name) {
  return \`Hello, \${name}! Welcome to CodeFusion.\`;
}

console.log(greet("World"));
`,
    python: `# Welcome to CodeFusion ⚡
# Start coding together in real-time!

def greet(name):
    return f"Hello, {name}! Welcome to CodeFusion."

print(greet("World"))
`,
    typescript: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

interface Greeter {
  name: string;
}

function greet({ name }: Greeter): string {
  return \`Hello, \${name}! Welcome to CodeFusion.\`;
}

console.log(greet({ name: "World" }));
`,
    cpp: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "! Welcome to CodeFusion.";
}

int main() {
    std::cout << greet("World") << std::endl;
    return 0;
}
`,
    java: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

public class Main {
    public static String greet(String name) {
        return "Hello, " + name + "! Welcome to CodeFusion.";
    }

    public static void main(String[] args) {
        System.out.println(greet("World"));
    }
}
`,
    rust: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to CodeFusion.", name)
}

fn main() {
    println!("{}", greet("World"));
}
`,
    go: `// Welcome to CodeFusion ⚡
// Start coding together in real-time!

package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s! Welcome to CodeFusion.", name)
}

func main() {
    fmt.Println(greet("World"))
}
`,
    html: `<!-- Welcome to CodeFusion ⚡ -->
<!-- Start coding together in real-time! -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodeFusion</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #0a0a0f; color: #e2e8f0; }
    h1 { color: #00ff88; }
  </style>
</head>
<body>
  <h1>Hello, World! Welcome to CodeFusion.</h1>
</body>
</html>
`,
  };
  return defaults[language] || defaults.javascript;
}

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  removeUser,
  updateCode,
  updateLanguage,
  setTyping,
  getRoomUsers,
  getDefaultCode,
};
