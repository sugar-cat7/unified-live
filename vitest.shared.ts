import type { UserConfig } from "vitest/config";

export const sharedTestConfig: UserConfig["test"] = {
  globals: false,
  environment: "node",
  coverage: {
    provider: "v8",
    include: ["src/**/*.ts"],
    exclude: ["src/**/*.test.ts", "src/index.ts"],
    reporter: ["text", "lcov"],
    reportsDirectory: "coverage",
  },
};
