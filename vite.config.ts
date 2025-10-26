import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
    },
    resolve: {
      alias: {
        src: resolve(__dirname, "src"),
        "@": resolve(__dirname, "./src"),
        "@components": resolve(__dirname, "src/components"),
        "@schemas": resolve(__dirname, "src/schemas"),
      },
    },
  };
});
