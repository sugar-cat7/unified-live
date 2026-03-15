import { Content, type LiveStream, NotFoundError, QuotaExhaustedError } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createYouTubePlugin } from "./plugin";

const createMockFetch = (
  responses: Array<{
    body: unknown;
    status?: number;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch => {
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
};

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

const sampleChannelItem = {
  id: "UC123",
  snippet: {
    title: "Test Channel",
    thumbnails: {
      high: {
        url: "https://yt3.ggpht.com/avatar.jpg",
        width: 800,
        height: 800,
      },
    },
    customUrl: "@testchannel",
  },
  contentDetails: {
    relatedPlaylists: { uploads: "UU123" },
  },
};

describe("createYouTubePlugin", () => {
  let plugin: ReturnType<typeof createYouTubePlugin>;

  afterEach(() => {
    plugin?.dispose();
  });

  it("reports correct capabilities", () => {
    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: createMockFetch([]) });
    expect(plugin.capabilities).toEqual({
      supportsLiveStreams: true,
      supportsArchiveResolution: true,
      authModel: "apiKey",
      rateLimitModel: "quota",
    });
  });

  it("throws on empty API key", () => {
    expect(() => createYouTubePlugin({ apiKey: "", fetch: createMockFetch([]) })).toThrow(
      "API key is required",
    );
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
    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
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

    const resolved = plugin.match("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
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

  it("getContent throws NotFoundError when video not found", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    await expect(plugin.getContent("nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("getChannel returns a channel by @handle", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleChannelItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const channel = await plugin.getChannel("@testchannel");

    expect(channel.id).toBe("UC123");
    expect(channel.platform).toBe("youtube");
    expect(channel.name).toBe("Test Channel");

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("forHandle=%40testchannel");
  });

  it("getChannel by UC-ID uses id param", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleChannelItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    await plugin.getChannel("UC123");

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("id=UC123");
  });

  it("getChannel throws NotFoundError when channel not found", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    await expect(plugin.getChannel("@nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("getLiveStreams returns live streams from search + video pipeline", async () => {
    const fetchFn = createMockFetch([
      // search.list response
      {
        body: {
          items: [{ id: { videoId: "liveId1" } }],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
      // videos.list response
      {
        body: {
          items: [sampleLiveItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const streams = await plugin.getLiveStreams("UC123");

    expect(streams).toHaveLength(1);
    expect(streams[0]?.type).toBe("live");
  });

  it("getVideos returns paginated video list", async () => {
    const fetchFn = createMockFetch([
      // channels.list response (for uploads playlist ID)
      {
        body: {
          items: [sampleChannelItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
      // playlistItems.list response
      {
        body: {
          items: [{ snippet: { resourceId: { videoId: "dQw4w9WgXcQ" } } }],
          pageInfo: { totalResults: 100, resultsPerPage: 50 },
          nextPageToken: "CDIQAA",
        },
      },
      // videos.list response
      {
        body: {
          items: [sampleVideoItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const page = await plugin.getVideos("UC123");

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.type).toBe("video");
    expect(page.cursor).toBe("CDIQAA");
    expect(page.total).toBe(100);
    expect(page.hasMore).toBe(true);
  });

  it("getVideos throws NotFoundError when channel not found", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    await expect(plugin.getVideos("UC_nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("resolveUrl delegates to match", () => {
    plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch([]),
    });

    expect(plugin.resolveUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      type: "content",
      id: "dQw4w9WgXcQ",
    });
    expect(plugin.resolveUrl("https://example.com/foo")).toBeNull();
  });

  it("resolveArchive returns Video when broadcast has ended", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleVideoItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const live: LiveStream = {
      id: "dQw4w9WgXcQ",
      platform: "youtube",
      type: "live",
      title: "Live Stream",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: {
        url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        width: 480,
        height: 360,
      },
      channel: {
        id: "UC123",
        name: "Test Channel",
        url: "https://www.youtube.com/channel/UC123",
      },
      viewerCount: 0,
      startedAt: new Date("2024-01-01T12:00:00Z"),
      raw: {},
    };
    const archive = await plugin.resolveArchive?.(live);

    expect(archive).not.toBeNull();
    expect(archive?.type).toBe("video");
    expect(archive?.id).toBe("dQw4w9WgXcQ");
  });

  it("resolveArchive returns null when still live", async () => {
    const fetchFn = createMockFetch([
      {
        body: {
          items: [sampleLiveItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const live: LiveStream = {
      id: "dQw4w9WgXcQ",
      platform: "youtube",
      type: "live",
      title: "Live Stream",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: {
        url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        width: 480,
        height: 360,
      },
      channel: {
        id: "UC123",
        name: "Test Channel",
        url: "https://www.youtube.com/channel/UC123",
      },
      viewerCount: 1500,
      startedAt: new Date("2024-01-01T12:00:00Z"),
      raw: {},
    };
    const archive = await plugin.resolveArchive?.(live);

    expect(archive).toBeNull();
  });

  it("getVideos returns empty page for channel with no uploads", async () => {
    const fetchFn = createMockFetch([
      // channels.list response
      {
        body: {
          items: [sampleChannelItem],
          pageInfo: { totalResults: 1, resultsPerPage: 5 },
        },
      },
      // playlistItems.list response (empty)
      {
        body: {
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 50 },
        },
      },
    ]);

    plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    const page = await plugin.getVideos("UC123");

    expect(page.items).toEqual([]);
    expect(page.cursor).toBeUndefined();
    expect(page.hasMore).toBe(false);
  });

  it("handles 403 rateLimitExceeded by retrying", async () => {
    const fetchFn = createMockFetch([
      {
        status: 403,
        body: {
          error: {
            errors: [{ reason: "rateLimitExceeded" }],
          },
        },
        headers: { "Retry-After": "0" },
      },
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
    expect(fetchFn).toHaveBeenCalledTimes(2);
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

    await expect(plugin.getContent("dQw4w9WgXcQ")).rejects.toThrow(QuotaExhaustedError);
  });

  it("dispose releases resources", () => {
    plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch([]),
    });
    expect(() => plugin.dispose()).not.toThrow();
  });
});
