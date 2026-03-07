# Unit Testing Implementation Policy

## Purpose

- Guarantee the behavior of pure functions, Zod schemas, mappers, and utility modules at high speed
- Keep specification granularity small and run the shortest TDD feedback loop

## Scope

- Zod schema validation (`packages/core/src/types.ts`)
- Error class hierarchy (`packages/core/src/errors.ts`)
- Rate limit strategies (`packages/core/src/rest/bucket.ts`, `quota.ts`)
- Auth providers (`packages/core/src/auth/static.ts`)
- Platform mappers (`packages/youtube/src/mapper.ts`)
- URL parsers (`packages/youtube/src/urls.ts`)

## Implementation Rules

1. Follow one test, one behavior
2. Use `it.each` / `test.each` table-driven tests as the standard
3. Proceed through `Red -> Green -> Refactor` one case at a time
4. Verify input/output contracts, not implementation details (private functions, internal state)

## Mocking Policy

- Default: no mocking
- Allowed: only fix non-deterministic elements such as time (`vi.useFakeTimers`) and random numbers with minimal stubs
- Prohibited: coupling to implementation details through excessive mocking of internal modules

## Table-Driven Basic Pattern

```ts
import { describe, expect, it } from "vitest";

describe("matchYouTubeUrl", () => {
  const cases = [
    { name: "watch URL", input: "https://www.youtube.com/watch?v=abc", expected: { platform: "youtube", type: "content", id: "abc" } },
    { name: "short URL", input: "https://youtu.be/abc", expected: { platform: "youtube", type: "content", id: "abc" } },
    { name: "non-YouTube", input: "https://twitch.tv/user", expected: null },
  ];

  it.each(cases)("$name", ({ input, expected }) => {
    expect(matchYouTubeUrl(input)).toEqual(expected);
  });
});
```

## Execution Commands

- All: `pnpm test`
- Core only: `pnpm --filter @unified-live/core test:run`
- YouTube only: `pnpm --filter @unified-live/youtube test:run`

## References (Primary Sources)

- Vitest `test.each`: https://vitest.dev/api/#test-each
- Vitest Mocking (caution on excessive mocking): https://vitest.dev/guide/mocking.html
