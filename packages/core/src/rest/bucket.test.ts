import { describe, expect, it, vi } from "vitest";
import { RateLimitError } from "../errors";
import { createTokenBucketStrategy } from "./bucket";
import type { RateLimitInfo, RestRequest } from "./types";

const makeReq = (): RestRequest => ({
  method: "GET",
  path: "/test",
});

const noopParseHeaders = (): RateLimitInfo | undefined => undefined;

describe("createTokenBucketStrategy", () => {
  it("allows requests within token limit", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 3, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    for (let i = 0; i < 3; i++) {
      const handle = await strategy.acquire(makeReq());
      handle.complete(new Headers());
    }

    expect(strategy.getStatus().remaining).toBe(0);
    expect(strategy.getStatus().limit).toBe(3);
  });

  it("rejects with RateLimitError when tokens exhausted", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    await strategy.acquire(makeReq());
    await expect(strategy.acquire(makeReq())).rejects.toThrow(RateLimitError);
  });

  it("includes retryAfter in RateLimitError", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    await strategy.acquire(makeReq());
    try {
      await strategy.acquire(makeReq());
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const err = e as RateLimitError;
      expect(err.retryAfter).toBeGreaterThan(0);
      expect(err.retryAfter).toBeLessThanOrEqual(60);
    }
  });

  it("refills tokens after perMs elapsed", async () => {
    vi.useFakeTimers();
    try {
      const strategy = createTokenBucketStrategy({
        global: { requests: 1, perMs: 1000 },
        parseHeaders: noopParseHeaders,
        platform: "test",
      });

      await strategy.acquire(makeReq());
      await expect(strategy.acquire(makeReq())).rejects.toThrow(RateLimitError);

      vi.advanceTimersByTime(1000);

      const handle = await strategy.acquire(makeReq());
      handle.complete(new Headers());
      expect(strategy.getStatus().remaining).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("release returns a token", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    const handle = await strategy.acquire(makeReq());
    expect(strategy.getStatus().remaining).toBe(0);

    handle.release();
    expect(strategy.getStatus().remaining).toBe(1);
  });

  it("release does not exceed limit", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 1, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    const handle = await strategy.acquire(makeReq());
    handle.release();
    handle.release();
    expect(strategy.getStatus().remaining).toBe(1);
  });

  it("updates remaining from response headers", async () => {
    const strategy = createTokenBucketStrategy({
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
      platform: "test",
    });

    const handle = await strategy.acquire(makeReq());
    const headers = new Headers();
    headers.set("Ratelimit-Remaining", "42");
    handle.complete(headers);

    expect(strategy.getStatus().remaining).toBe(42);
  });

  it("handles concurrent acquire() calls correctly", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 3, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });

    const handles = await Promise.all([
      strategy.acquire(makeReq()),
      strategy.acquire(makeReq()),
      strategy.acquire(makeReq()),
    ]);

    expect(handles).toHaveLength(3);
    expect(strategy.getStatus().remaining).toBe(0);
  });

  it("queued is always 0 (no queuing)", () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 10, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });
    expect(strategy.getStatus().queued).toBe(0);
  });

  it("ignores parseHeaders returning undefined", async () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 5, perMs: 60_000 },
      parseHeaders: () => undefined,
      platform: "test",
    });

    const handle = await strategy.acquire(makeReq());
    handle.complete(new Headers());
    expect(strategy.getStatus().remaining).toBe(4);
  });
});
