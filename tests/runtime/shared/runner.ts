import type { PackageResult, PackageVerifier } from "./types.ts";
import { verifyCorePackage } from "./core.ts";
import { verifyTwitchPackage } from "./twitch.ts";
import { verifyYouTubePackage } from "./youtube.ts";
import { verifyTwitCastingPackage } from "./twitcasting.ts";

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
    const checks = await v.verify();
    results.push({ packageName: v.packageName, checks });
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
