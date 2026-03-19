import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig({
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
  test: sharedTestConfig,
});
