import { describe, expect, it } from "vitest";
import { createYouTubeQuotaStrategy, YOUTUBE_COST_MAP } from "./quota";

describe("YOUTUBE_COST_MAP", () => {
  it.each([
    { bucketId: "videos:list", cost: 1 },
    { bucketId: "channels:list", cost: 1 },
    { bucketId: "search:list", cost: 100 },
    { bucketId: "playlistItems:list", cost: 1 },
  ])("maps $bucketId to cost $cost", ({ bucketId, cost }) => {
    expect(YOUTUBE_COST_MAP[bucketId]).toBe(cost);
  });
});

describe("createYouTubeQuotaStrategy", () => {
  it("creates a strategy with default daily limit", () => {
    const strategy = createYouTubeQuotaStrategy();
    const status = strategy.getStatus();
    expect(status.limit).toBe(10_000);
    expect(status.remaining).toBe(10_000);
    strategy.dispose();
  });

  it("creates a strategy with custom daily limit", () => {
    const strategy = createYouTubeQuotaStrategy(5000);
    const status = strategy.getStatus();
    expect(status.limit).toBe(5000);
    expect(status.remaining).toBe(5000);
    strategy.dispose();
  });

  it("tracks quota consumption via acquire", async () => {
    const strategy = createYouTubeQuotaStrategy(10_000);
    const handle = await strategy.acquire({
      method: "GET",
      path: "/search",
      bucketId: "search:list",
    });
    handle.complete(new Headers());

    const status = strategy.getStatus();
    expect(status.remaining).toBe(9_900); // 10000 - 100
    strategy.dispose();
  });
});
