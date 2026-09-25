// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to Flask backend during development
    proxy: {
      "/api": {
        target:       "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir:    "dist",
    emptyOutDir: true,
  },
});
