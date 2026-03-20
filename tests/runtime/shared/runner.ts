import type { PackageResult, PackageVerifier } from "./types.ts";
import { verifyCorePackage } from "./core.ts";
import { verifyTwitchPackage } from "./twitch.ts";
import { verifyYouTubePackage } from "./youtube.ts";
import { verifyTwitCastingPackage } from "./twitcasting.ts";

/**
 * HOW TO ADD A NEW PACKAGE
 * 1. Create shared/<package>.ts with a verify function
 * 2. Add to the verifiers array below
 * 3. Add path alias to tests/runtime/tsconfig.json (type-check: .d.mts)
 * 4. Add import map entry to tests/runtime/deno.json (Deno runtime: .mjs)
 *
 * Node/Bun resolve via pnpm workspace symlinks — no extra config needed.
 * workerd resolves at wrangler bundle time — no extra config needed.
 */
const verifiers: PackageVerifier[] = [
  { packageName: "@unified-live/core", verify: verifyCorePackage },
  { packageName: "@unified-live/twitch", verify: verifyTwitchPackage },
  { packageName: "@unified-live/youtube", verify: verifyYouTubePackage },
  { packageName: "@unified-live/twitcasting", verify: verifyTwitCastingPackage },
];

export const collectResults = async (): Promise<{
  ok: boolean;
  results: PackageResult[];
}> => {
  const results: PackageResult[] = [];

  for (const v of verifiers) {
    try {
      const checks = await v.verify();
      results.push({ packageName: v.packageName, checks });
    } catch (e: unknown) {
      // Catches module-level import failures (before any verify() calls).
      // verify() itself never rejects — it converts errors to VerifyResult.
      const msg = e instanceof Error
        ? `${e.message}${e.stack ? `\n${e.stack}` : ""}`
        : String(e);
      results.push({
        packageName: v.packageName,
        checks: [{ name: "Package load", success: false, error: msg }],
      });
    }
  }

  const ok = results.every((r) => r.checks.every((c) => c.success));
  return { ok, results };
};

export const runAll = async (): Promise<boolean> => {
  const { ok, results } = await collectResults();

  const lines: string[] = [];
  for (const r of results) {
    lines.push(`[${r.packageName}]`);
    for (const c of r.checks) {
      const status = c.success ? "PASS" : "FAIL";
      const detail = c.error ? `: ${c.error}` : "";
      lines.push(`  [${status}] ${c.name}${detail}`);
    }
  }
  console.log(lines.join("\n"));

  return ok;
};
