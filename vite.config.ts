import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const rawBase = (env.VITE_BASE_PATH ?? "/").trim();
  const normalizedBase = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  const base = command === "serve" ? "/" : normalizedBase;

  const isBuild = command === "build";

  return {
    base,
    plugins: [react()],
    esbuild: {
      drop: isBuild ? ["console", "debugger"] : [],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://3.37.163.222:8080",
          changeOrigin: true,
          secure: false,
          // /api/auth/refresh  ->  /auth/refresh 로 백엔드에 전달
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              // dev 서버 콘솔에 경로와 Host 찍히게
              console.log(
                "[proxyReq]",
                req.method,
                req.url,
                "->",
                options.target + (proxyReq as any).path
              );
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log(
                "[proxyRes]",
                req.method,
                req.url,
                proxyRes.statusCode
              );
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
