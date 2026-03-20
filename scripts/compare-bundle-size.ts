/**
 * Compare current bundle sizes against a baseline and output a Markdown table.
 *
 * Usage:
 *   npx tsx scripts/compare-bundle-size.ts [baseline.json]
 *
 * If baseline.json is missing or unreadable, falls back to showing current sizes only.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = process.argv[2] || join(root, "bundle-size-baseline.json");

type Metric = { key: string; value: number; unit: string };

const packages = [
  { name: "@unified-live/core", dir: "packages/core" },
  { name: "@unified-live/youtube", dir: "packages/youtube" },
  { name: "@unified-live/twitch", dir: "packages/twitch" },
  { name: "@unified-live/twitcasting", dir: "packages/twitcasting" },
];

const formatSize = (bytes: number): string => {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatDiff = (diff: number): string => {
  if (diff === 0) return "±0";
  const sign = diff > 0 ? "+" : "";
  if (Math.abs(diff) >= 1024) return `${sign}${(diff / 1024).toFixed(1)} KB`;
  return `${sign}${diff} B`;
};

const diffIcon = (diff: number): string => {
  if (diff === 0) return "";
  if (diff > 0) return " :chart_with_upwards_trend:";
  return " :chart_with_downwards_trend:";
};

// Read current sizes
const current: Metric[] = [];
for (const pkg of packages) {
  const filePath = join(root, pkg.dir, "dist", "index.mjs");
  try {
    const content = readFileSync(filePath);
    current.push({
      key: pkg.name.replace("@unified-live/", ""),
      value: gzipSync(content).length,
      unit: "bytes",
    });
  } catch {
    // skip missing
  }
}

// Read baseline
let baseline: Metric[] = [];
try {
  baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
} catch {
  // no baseline available
}

const baselineMap = new Map(baseline.map((m) => [m.key, m.value]));

// Output markdown
console.log("## Bundle Size\n");
console.log("| Package | Gzip (current) | Gzip (main) | Diff |");
console.log("|---------|---------------:|------------:|-----:|");

for (const entry of current) {
  const base = baselineMap.get(entry.key);
  const diff = base != null ? entry.value - base : 0;
  const baseStr = base != null ? formatSize(base) : "—";
  const diffStr = base != null ? `${formatDiff(diff)}${diffIcon(diff)}` : "new";
  console.log(
    `| \`@unified-live/${entry.key}\` | ${formatSize(entry.value)} | ${baseStr} | ${diffStr} |`,
  );
}
