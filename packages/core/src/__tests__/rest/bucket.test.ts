import { afterEach, describe, expect, it } from "vitest";
import { createTokenBucketStrategy } from "../../rest/bucket";
import type { RateLimitInfo, RestRequest } from "../../rest/types";

const makeReq = (): RestRequest => ({
  method: "GET",
  path: "/test",
});

const noopParseHeaders = (): RateLimitInfo | undefined => undefined;

describe("createTokenBucketStrategy", () => {
  let strategy: ReturnType<typeof createTokenBucketStrategy>;

  afterEach(() => {
    strategy?.dispose();
  });

  it("allows requests within token limit", async () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 3, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
    });

    for (let i = 0; i < 3; i++) {
      const handle = await strategy.acquire(makeReq());
      handle.complete(new Headers());
    }

    expect(strategy.getStatus().remaining).toBe(0);
    expect(strategy.getStatus().limit).toBe(3);
  });

  it("release returns a token", async () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
    });

    const handle = await strategy.acquire(makeReq());
    expect(strategy.getStatus().remaining).toBe(0);

    handle.release();
    expect(strategy.getStatus().remaining).toBe(1);
  });

  it("release does not exceed limit", async () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
    });

    const handle = await strategy.acquire(makeReq());
    handle.release();
    handle.release(); // Double release
    expect(strategy.getStatus().remaining).toBe(1);
  });

  it("updates remaining from response headers", async () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 100, perMs: 60_000 },
      parseHeaders: (headers) => {
        const remaining = headers.get("Ratelimit-Remaining");
        if (remaining === null) return undefined;
        return {
          limit: 100,
          remaining: Number.parseInt(remaining, 10),
          resetsAt: new Date(Date.now() + 60_000),
        };
      },
    });

    const handle = await strategy.acquire(makeReq());

    const headers = new Headers();
    headers.set("Ratelimit-Remaining", "42");
    handle.complete(headers);

    expect(strategy.getStatus().remaining).toBe(42);
  });

  it("dispose clears timers", () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 10, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
    });

    // Should not throw
    strategy.dispose();
  });

  it("getStatus reports correct queued count", async () => {
    strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 100 },
      parseHeaders: noopParseHeaders,
    });

    // Consume the only token
    await strategy.acquire(makeReq());
    expect(strategy.getStatus().remaining).toBe(0);

    // Start an acquire that will wait — don't await it
    const pendingPromise = strategy.acquire(makeReq());
    // Give microtask a chance to run
    await new Promise((r) => setTimeout(r, 10));
    expect(strategy.getStatus().queued).toBe(1);

    // Wait for refill to resolve it
    const handle = await pendingPromise;
    handle.complete(new Headers());
    expect(strategy.getStatus().queued).toBe(0);
  });
});
