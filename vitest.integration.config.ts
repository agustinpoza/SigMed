import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: {
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    globalSetup: ["./tests/integration/postgres.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    maxWorkers: 1,
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
