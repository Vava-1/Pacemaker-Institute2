import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "frontend/src"),
      "@api": path.resolve(templateRoot, "backend/api"),
      "@db": path.resolve(templateRoot, "backend/db"),
      "@contracts": path.resolve(templateRoot, "contracts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["frontend/tests/**/*.test.ts", "frontend/tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules",
        "frontend/tests",
        "**/*.d.ts",
        "**/*.config.*",
        "backend/db/migrations",
        "backend/db/seed.ts",
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
    setupFiles: ["./frontend/tests/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
