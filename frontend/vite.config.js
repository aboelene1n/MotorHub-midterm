import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const target = env.VITE_API_URL?.startsWith("http")
    ? new URL(env.VITE_API_URL).origin
    : "http://localhost:5000";
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { "/api": { target }, "/uploads": { target } },
    },
    preview: { proxy: { "/api": { target }, "/uploads": { target } } },
  };
});
