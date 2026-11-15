'use strict';
// Starter workspace every new room begins with.

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hello, CodeFusion</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="card">
    <span class="badge">Live preview</span>
    <h1>Build together, <em>in real time.</em></h1>
    <p>Edit this file, style.css or script.js. Everyone in the room sees every keystroke instantly.</p>
    <button id="spark">Make it sparkle</button>
    <p id="count">Clicks: 0</p>
  </main>
  <script src="script.js"></script>
</body>
</html>
`;

const styleCss = `:root { color-scheme: dark; }
* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #eef0f8;
  background:
    radial-gradient(900px 500px at 20% 0%, #3b2fb8 0%, transparent 60%),
    radial-gradient(800px 500px at 90% 100%, #0e7490 0%, transparent 55%),
    #07080d;
}

.card {
  width: min(440px, 88vw);
  padding: 36px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8);
}

.badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #c4bcff;
  background: rgba(139, 124, 255, 0.16);
}

h1 { margin: 18px 0 10px; font-size: 34px; line-height: 1.1; letter-spacing: -0.03em; }
h1 em {
  font-style: normal;
  background: linear-gradient(90deg, #a99eff, #22d3ee);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

p { margin: 0 0 18px; color: #a3a9bd; line-height: 1.6; }

button {
  padding: 12px 20px;
  border: 0;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #8b7cff, #c084fc);
  transition: transform 0.2s;
}
button:hover { transform: translateY(-2px); }

.dot {
  position: fixed;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  pointer-events: none;
  animation: pop 0.9s ease-out forwards;
}
@keyframes pop { to { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; } }
`;

const scriptJs = `// Welcome to CodeFusion
// Everything you type is synced live with your teammates.
// Press Ctrl/Cmd + Enter to run this file.

const colors = ['#8b7cff', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
let clicks = 0;

function sparkle(x, y) {
  for (let i = 0; i < 14; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    dot.style.background = colors[i % colors.length];
    dot.style.setProperty('--x', (Math.random() - 0.5) * 220 + 'px');
    dot.style.setProperty('--y', (Math.random() - 0.5) * 220 + 'px');
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 900);
  }
}

const button = document.getElementById('spark');
const counter = document.getElementById('count');

if (button && counter) {
  button.addEventListener('click', (event) => {
    clicks += 1;
    counter.textContent = 'Clicks: ' + clicks;
    sparkle(event.clientX, event.clientY);
  });
}

console.log('Hello from CodeFusion');
console.log({ room: 'live', collaborators: 'unlimited', fun: true });
`;

const mainPy = `# Press Ctrl/Cmd + Enter. Python runs right in your browser.

def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print("Fibonacci, brought to you by CodeFusion")
print(list(fibonacci(12)))
`;

const notes = `# Team notes

A shared scratchpad. Everyone in the room edits it live, and it supports **markdown**.

- [ ] Invite a teammate with the **Share** button
- [ ] Try the live preview on the right
- [ ] Follow a collaborator from the People panel
- [ ] Hit **Ctrl/Cmd + K** for the command palette

> Ideas, TODOs and meeting notes all live here.
`;

module.exports = {
  files: [
    { id: 'f_index', name: 'index.html', text: indexHtml },
    { id: 'f_style', name: 'style.css', text: styleCss },
    { id: 'f_script', name: 'script.js', text: scriptJs },
    { id: 'f_main', name: 'main.py', text: mainPy },
  ],
  notes,
};
