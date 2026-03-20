import { runAll } from "../shared/runner.ts";

const ok = await runAll();
// Deno has no process.exitCode; Deno.exit() is the only way to set exit code.
if (!ok) Deno.exit(1);
