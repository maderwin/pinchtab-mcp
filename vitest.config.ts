import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      // index.ts is the MCP server entry point — integration code, covered by E2E
      exclude: ["src/__tests__/**", "src/index.ts", "rolldown.config.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    exclude: ["src/__tests__/e2e/**"],
    include: ["src/__tests__/**/*.test.ts"],
    testTimeout: 10_000,
  },
});
