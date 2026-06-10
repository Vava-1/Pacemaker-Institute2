import devServer from "@hono/vite-dev-server";
import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";

export default defineConfig({
  root: "frontend",
  plugins: [
    devServer({ entry: "backend/api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    inspectAttr(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
      "@api": path.resolve(__dirname, "./backend/api"),
      "@db": path.resolve(__dirname, "./backend/db"),
      "@contracts": path.resolve(__dirname, "./contracts"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  envDir: path.resolve(__dirname),
  envPrefix: "VITE_",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "lucide-react",
          ],
          charts: ["recharts"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: "esbuild",
  },
});
