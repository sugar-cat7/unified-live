import { Content, QuotaExhaustedError } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createYouTubePlugin } from "../plugin.js";

function createMockFetch(
  responses: Array<{
    body: unknown;
    status?: number;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch {
  let callIndex = 0;
  return vi.fn(async () => {
    const r = responses[callIndex] ?? responses.at(-1);
    if (!r) throw new Error("No mock response configured");
    callIndex++;
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json", ...r.headers },
    });
  }) as unknown as typeof globalThis.fetch;
}

const sampleVideoItem = {
  id: "dQw4w9WgXcQ",
  snippet: {
    title: "Test Video",
    channelId: "UC123",
    channelTitle: "Test Channel",
    thumbnails: {
      high: {
        url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        width: 480,
        height: 360,
      },
    },
    liveBroadcastContent: "none",
    publishedAt: "2024-01-01T00:00:00Z",
  },
  contentDetails: { duration: "PT10M" },
  statistics: { viewCount: "5000" },
};

const sampleLiveItem = {
  ...sampleVideoItem,
  snippet: {
    ...sampleVideoItem.snippet,
    liveBroadcastContent: "live",
  },
  liveStreamingDetails: {
    actualStartTime: "2024-01-01T12:00:00Z",
    concurrentViewers: "1500",
  },
};

describe("createYouTubePlugin", () => {
  let plugin: ReturnType<typeof createYouTubePlugin>;

  afterEach(() => {
    plugin?.dispose();
  });

  it("getContent returns a Video for a regular video", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleVideoItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const content = await plugin.getContent("dQw4w9WgXcQ");

    expect(content.type).toBe("video");
    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(Content.isVideo(content)).toBe(true);

    // Verify API key was injected as query param
    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as string;
    expect(calledUrl).toContain("key=test-key");
  });

  it("getContent returns a LiveStream for a live broadcast", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleLiveItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const content = await plugin.getContent("dQw4w9WgXcQ");

    expect(content.type).toBe("live");
    expect(Content.isLive(content)).toBe(true);
    if (Content.isLive(content)) {
      expect(content.viewerCount).toBe(1500);
    }
  });

  it("match returns ResolvedUrl for YouTube URLs", () => {
    plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch([]),
    });

    const resolved = plugin.match(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(resolved).toEqual({
      platform: "youtube",
      type: "content",
      id: "dQw4w9WgXcQ",
    });
  });

  it("match returns null for non-YouTube URLs", () => {
    plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch([]),
    });

    const resolved = plugin.match("https://twitch.tv/streamer");
    expect(resolved).toBeNull();
  });

  it("getLiveStreams returns empty array when no live streams", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const streams = await plugin.getLiveStreams("UC123");
    expect(streams).toEqual([]);
  });

  it("handles 403 quotaExceeded by throwing QuotaExhaustedError", async () => {
    const fetchFn = createMockFetch([
      {
        status: 403,
        body: {
          error: {
            errors: [{ reason: "quotaExceeded" }],
          },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });

    await expect(plugin.getContent("dQw4w9WgXcQ")).rejects.toThrow(
      QuotaExhaustedError,
    );
  });

  it("dispose releases resources", () => {
    plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch([]),
    });
    expect(() => plugin.dispose()).not.toThrow();
  });
});
