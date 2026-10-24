import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The backend dev server (uvicorn, CLAUDE.md): the SPA and the API share one origin, as behind
// Caddy in production. Origin stays http://127.0.0.1:5173 (no changeOrigin).
const proxy = { "/api": "http://127.0.0.1:8000" };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Loopback only, like the dev database (T-003, AC-10).
  server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true, proxy },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
