import { runAll } from "../shared/runner.ts";

const ok = await runAll();
if (!ok) Deno.exit(1);
