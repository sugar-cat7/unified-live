import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", "test/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "domain/**/*.ts",
        "pkg/**/*.ts",
        "usecase/**/*.ts",
        "infra/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
  },
});
