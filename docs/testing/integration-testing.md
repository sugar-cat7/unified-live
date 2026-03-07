# Integration Testing Implementation Policy

## Purpose

- Guarantee the behavior of multi-module collaboration: client -> plugin -> RestManager -> mock fetch
- Detect boundary mismatches (URL routing, response mapping, error propagation) invisible to unit tests

## Scope

- `packages/youtube/src/__tests__/plugin.test.ts` — Plugin + RestManager wiring
- `packages/youtube/src/__tests__/integration.test.ts` — Client + plugin end-to-end flow
- `packages/core/src/__tests__/rest/manager.test.ts` — RestManager retry, auth, rate limit integration

## Implementation Rules

1. Use real SDK wiring (createClient, createYouTubePlugin, createRestManager)
2. Only mock the fetch boundary with `createMockFetch` helper
3. Enumerate business scenarios with table-driven tests
4. Keep each test independent; do not depend on state from previous cases

## Mocking Policy

- Default: no mocking of SDK internals
- Exception: `fetch` is replaced with a mock that returns recorded API responses
- Pattern: factory function `createMockFetch(responses[])` that replays responses in order

```ts
function createMockFetch(
  responses: Array<{ body: unknown; status?: number; headers?: Record<string, string> }>,
): typeof globalThis.fetch {
  let callIndex = 0;
  return vi.fn(async () => {
    const r = responses[callIndex];
    if (!r)
      throw new Error(
        `createMockFetch: unexpected call #${callIndex} (only ${responses.length} responses defined)`,
      );
    callIndex++;
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json", ...r.headers },
    });
  }) as unknown as typeof globalThis.fetch;
}
```

## File Placement

- `packages/*/src/__tests__/*.test.ts`
- Aligned with the `include` in each package's `vitest.config.ts`

## Execution Commands

- All: `pnpm test`
- Core only: `pnpm --filter @unified-live/core test:run`
- YouTube only: `pnpm --filter @unified-live/youtube test:run`

## References (Primary Sources)

- Vitest `test.each`: https://vitest.dev/api/#test-each
- Vitest Mocking: https://vitest.dev/guide/mocking.html
