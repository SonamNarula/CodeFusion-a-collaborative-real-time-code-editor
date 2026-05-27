/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        void: {
          950: "#05050a",
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#22222e",
          500: "#2d2d3d",
        },
        neon: {
          green: "#00ff88",
          cyan: "#00e5ff",
          purple: "#bf5af2",
          orange: "#ff6b35",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        glow: {
          from: { textShadow: "0 0 10px #00ff88, 0 0 20px #00ff88" },
          to: { textShadow: "0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88" },
        },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
