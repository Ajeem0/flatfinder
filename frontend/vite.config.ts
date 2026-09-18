import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ["VITE_", "API_", "GOOGLE_", "MSG91_"],
  server: {
    port: 5173,
  },
  build: {
    sourcemap: false,
  },
});
