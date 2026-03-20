import { collectResults } from "../shared/runner.ts";

export default {
  fetch: async (): Promise<Response> => {
    try {
      const { ok, results } = await collectResults();
      return Response.json({ ok, results }, { status: ok ? 200 : 500 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ ok: false, results: [], error: message }, { status: 500 });
    }
  },
};
