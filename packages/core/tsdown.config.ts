import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  deps: {
    neverBundle: ["@opentelemetry/api"],
  },
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
});
