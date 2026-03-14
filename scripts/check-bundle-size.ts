/**
 * Measure dist bundle sizes for each package (raw + gzip).
 * Measures the actual files shipped to npm — no re-bundling.
 *
 * Usage:
 *   npx tsx scripts/check-bundle-size.ts [--json]
 */
import { gzipSync } from "node:zlib";
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonMode = process.argv.includes("--json");

type PackageEntry = {
  name: string;
  file: string;
  rawBytes: number;
  gzipBytes: number;
};

const packages = [
  { name: "@unified-live/core", dir: "packages/core" },
  { name: "@unified-live/youtube", dir: "packages/youtube" },
  { name: "@unified-live/twitch", dir: "packages/twitch" },
  { name: "@unified-live/twitcasting", dir: "packages/twitcasting" },
];

const missing: string[] = [];
const results: PackageEntry[] = [];

for (const pkg of packages) {
  const distDir = join(root, pkg.dir, "dist");

  for (const filename of ["index.mjs", "index.cjs"]) {
    const filePath = join(distDir, filename);

    try {
      statSync(filePath);
    } catch {
      missing.push(`${pkg.name}/${filename}`);
      continue;
    }

    const content = readFileSync(filePath);
    results.push({
      name: pkg.name,
      file: filename,
      rawBytes: content.length,
      gzipBytes: gzipSync(content).length,
    });
  }
}

if (missing.length > 0) {
  console.error(`Missing dist files: ${missing.join(", ")}. Run pnpm build first.`);
  process.exit(1);
}

const formatSize = (bytes: number): string => {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
};

if (jsonMode) {
  const metrics = results
    .filter((r) => r.file === "index.mjs")
    .map((r) => ({
      key: r.name.replace("@unified-live/", ""),
      value: r.gzipBytes,
      unit: "bytes",
    }));
  console.log(JSON.stringify(metrics));
} else {
  console.log("## Bundle Size\n");
  console.log("| Package | File | Size | Gzip |");
  console.log("|---------|------|-----:|-----:|");
  for (const r of results) {
    console.log(
      `| \`${r.name}\` | ${r.file} | ${formatSize(r.rawBytes)} | ${formatSize(r.gzipBytes)} |`,
    );
  }
}
