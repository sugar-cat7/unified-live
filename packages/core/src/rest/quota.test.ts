import { afterEach, describe, expect, it } from "vitest";
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

  afterEach(() => {
    strategy?.[Symbol.dispose]();
  });

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
});
