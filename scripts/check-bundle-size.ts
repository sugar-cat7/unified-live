/**
 * Measure minified + gzipped bundle size for each package using esbuild.
 * Outputs JSON for octocov custom metrics and a human-readable table.
 *
 * Usage:
 *   npx tsx scripts/check-bundle-size.ts [--json]
 */
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonMode = process.argv.includes("--json");

type PackageEntry = {
  name: string;
  entryPoint: string;
  rawBytes: number;
  minifiedBytes: number;
  gzipBytes: number;
};

const packages = [
  { name: "@unified-live/core", dir: "packages/core" },
  { name: "@unified-live/youtube", dir: "packages/youtube" },
  { name: "@unified-live/twitch", dir: "packages/twitch" },
  { name: "@unified-live/twitcasting", dir: "packages/twitcasting" },
];

const results: PackageEntry[] = [];

for (const pkg of packages) {
  const distEntry = join(root, pkg.dir, "dist", "index.mjs");

  try {
    statSync(distEntry);
  } catch {
    console.error(`Skipping ${pkg.name}: dist/index.mjs not found`);
    continue;
  }

  const rawBytes = statSync(distEntry).size;

  const tmpDir = mkdtempSync(join(tmpdir(), "bundle-check-"));
  const outFile = join(tmpDir, "bundle.min.mjs");

  try {
    execFileSync(
      "npx",
      [
        "esbuild",
        distEntry,
        "--bundle",
        "--minify",
        "--format=esm",
        `--outfile=${outFile}`,
        "--external:@opentelemetry/*",
        "--external:zod",
        "--external:@unified-live/*",
      ],
      { cwd: root, stdio: "pipe" },
    );

    const minifiedBytes = statSync(outFile).size;
    const minifiedContent = readFileSync(outFile);
    const gzipBytes = gzipSync(minifiedContent).length;

    results.push({
      name: pkg.name,
      entryPoint: "dist/index.mjs",
      rawBytes,
      minifiedBytes,
      gzipBytes,
    });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

const formatSize = (bytes: number): string => {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
};

if (jsonMode) {
  const metrics = results.map((r) => ({
    key: r.name.replace("@unified-live/", ""),
    value: r.gzipBytes,
    unit: "bytes",
  }));
  console.log(JSON.stringify(metrics));
} else {
  console.log("## Bundle Size\n");
  console.log("| Package | Raw | Minified | Gzip |");
  console.log("|---------|----:|---------:|-----:|");
  for (const r of results) {
    console.log(
      `| \`${r.name}\` | ${formatSize(r.rawBytes)} | ${formatSize(r.minifiedBytes)} | ${formatSize(r.gzipBytes)} |`,
    );
  }
}
