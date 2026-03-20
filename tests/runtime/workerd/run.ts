import { collectResults } from "../shared/runner.ts";

export default {
  async fetch(): Promise<Response> {
    const { ok, results } = await collectResults();
    return Response.json({ ok, results }, { status: ok ? 200 : 500 });
  },
};
