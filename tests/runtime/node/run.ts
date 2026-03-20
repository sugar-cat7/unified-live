import { runAll } from "../shared/runner.ts";

const ok = await runAll();
if (!ok) process.exitCode = 1;
