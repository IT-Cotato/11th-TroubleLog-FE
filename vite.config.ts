import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const rawBase = (env.VITE_BASE_PATH ?? "/").trim();
  const normalizedBase = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  const base = command === "serve" ? "/" : normalizedBase;

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
