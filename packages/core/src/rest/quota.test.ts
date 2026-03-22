import { describe, expect, it, vi } from "vitest";
import { QuotaExhaustedError } from "../errors";
import { createQuotaBudgetStrategy } from "./quota";
import type { RestRequest } from "./types";

const makeReq = (bucketId?: string): RestRequest => ({
  method: "GET",
  path: "/test",
  bucketId,
});

describe("createQuotaBudgetStrategy", () => {
  let strategy: ReturnType<typeof createQuotaBudgetStrategy>;

  it("deducts cost per bucketId", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 100,
      costMap: { "search:list": 100, "videos:list": 1 },
      platform: "youtube",
    });

    const handle = await strategy.acquire(makeReq("videos:list"));
    handle.complete(new Headers());

    const status = strategy.getStatus();
    expect(status.remaining).toBe(99);
    expect(status.limit).toBe(100);
  });

  it("uses defaultCost for unknown bucketId", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 100,
      costMap: {},
      defaultCost: 5,
      platform: "youtube",
    });

    await strategy.acquire(makeReq("unknown:endpoint"));
    expect(strategy.getStatus().remaining).toBe(95);
  });

  it("throws QuotaExhaustedError when quota exceeded", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 10,
      costMap: { "search:list": 100 },
      platform: "youtube",
    });

    await expect(strategy.acquire(makeReq("search:list"))).rejects.toThrow(QuotaExhaustedError);
  });

  it("includes details in QuotaExhaustedError", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 10,
      costMap: { "search:list": 100 },
      platform: "youtube",
    });

    try {
      await strategy.acquire(makeReq("search:list"));
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(QuotaExhaustedError);
      const err = e as QuotaExhaustedError;
      expect(err.details.consumed).toBe(0);
      expect(err.details.limit).toBe(10);
      expect(err.details.requestedCost).toBe(100);
      expect(err.details.resetsAt).toBeInstanceOf(Date);
    }
  });

  it("release returns consumed quota", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 10,
      costMap: { "videos:list": 5 },
      platform: "youtube",
    });

    const handle = await strategy.acquire(makeReq("videos:list"));
    expect(strategy.getStatus().remaining).toBe(5);

    handle.release();
    expect(strategy.getStatus().remaining).toBe(10);
  });

  it("allows multiple requests within budget", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 10,
      costMap: { "videos:list": 1 },
      platform: "youtube",
    });

    for (let i = 0; i < 10; i++) {
      await strategy.acquire(makeReq("videos:list"));
    }
    expect(strategy.getStatus().remaining).toBe(0);

    await expect(strategy.acquire(makeReq("videos:list"))).rejects.toThrow(QuotaExhaustedError);
  });

  it("queued is always 0 (no queuing for quota)", () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 100,
      costMap: {},
      platform: "youtube",
    });
    expect(strategy.getStatus().queued).toBe(0);
  });

  it("throws at exactly dailyLimit boundary", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 5,
      costMap: { "videos:list": 5 },
      platform: "youtube",
    });

    // Exactly at limit — should succeed
    const handle = await strategy.acquire(makeReq("videos:list"));
    handle.complete(new Headers());
    expect(strategy.getStatus().remaining).toBe(0);

    // One more unit should fail
    await expect(strategy.acquire(makeReq("videos:list"))).rejects.toThrow(QuotaExhaustedError);
  });

  it("uses defaultCost when bucketId is undefined", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 100,
      costMap: { "videos:list": 10 },
      defaultCost: 3,
      platform: "youtube",
    });

    await strategy.acquire(makeReq()); // no bucketId
    expect(strategy.getStatus().remaining).toBe(97); // 100 - 3
  });

  it("release does not go below zero consumed", async () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 10,
      costMap: { "videos:list": 5 },
      platform: "youtube",
    });

    const handle = await strategy.acquire(makeReq("videos:list"));
    handle.release();
    handle.release(); // Double release
    expect(strategy.getStatus().remaining).toBe(10); // Clamped at 0 consumed
  });

  it("resetsAt is a Date roughly within 24h of now", () => {
    strategy = createQuotaBudgetStrategy({
      dailyLimit: 100,
      costMap: {},
      platform: "youtube",
    });

    const status = strategy.getStatus();
    expect(status.resetsAt).toBeInstanceOf(Date);
    // Verify it's a reasonable timestamp (within 25h of now in either direction)
    // The exact value depends on the current time relative to PT midnight,
    // and CI timezone can cause edge cases near the boundary.
    const diffMs = Math.abs(status.resetsAt.getTime() - Date.now());
    expect(diffMs).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });

  it("uses defaults for dailyLimit, defaultCost, and platform when not provided", async () => {
    strategy = createQuotaBudgetStrategy({
      costMap: {},
    });

    // Default dailyLimit = 10000, defaultCost = 1, platform = "unknown"
    const handle = await strategy.acquire(makeReq("anything"));
    handle.complete(new Headers());
    const status = strategy.getStatus();
    expect(status.remaining).toBe(9999); // 10000 - 1
    expect(status.limit).toBe(10000);
  });

  it("handles missing DateTimeFormat parts by falling back to 0", () => {
    const spy = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue([]);
    try {
      strategy = createQuotaBudgetStrategy({
        dailyLimit: 100,
        costMap: {},
        platform: "test",
      });
      expect(strategy.getStatus().resetsAt).toBeInstanceOf(Date);
    } finally {
      spy.mockRestore();
    }
  });

  it("throws on negative cost map values", () => {
    expect(() =>
      createQuotaBudgetStrategy({
        dailyLimit: 100,
        costMap: { "search:list": -1 },
        platform: "youtube",
      }),
    ).toThrow("negative cost");
  });

  it("lazy resets quota when past reset time", async () => {
    vi.useFakeTimers();
    try {
      strategy = createQuotaBudgetStrategy({
        dailyLimit: 10,
        costMap: { "videos:list": 5 },
        platform: "youtube",
      });

      // Consume some quota
      await strategy.acquire(makeReq("videos:list"));
      expect(strategy.getStatus().remaining).toBe(5);

      // Advance time past the reset time (25 hours to ensure crossing midnight PT)
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Next acquire should trigger lazy reset — quota restored
      await strategy.acquire(makeReq("videos:list"));
      expect(strategy.getStatus().remaining).toBe(5); // 10 - 5 after reset + new acquire
    } finally {
      vi.useRealTimers();
    }
  });
});
