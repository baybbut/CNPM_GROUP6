import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      // Admin shares components and image assets with the sibling website.
      fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
