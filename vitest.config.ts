import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@api": path.resolve(templateRoot, "api"),
      "@db": path.resolve(templateRoot, "db"),
      "@contracts": path.resolve(templateRoot, "contracts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules",
        "tests",
        "**/*.d.ts",
        "**/*.config.*",
        "db/migrations",
        "db/seed.ts",
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
