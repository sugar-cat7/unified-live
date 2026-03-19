import type { TracerProvider } from "@opentelemetry/api";
import { describe, expect, it, vi } from "vitest";
import { UnifiedClient } from "./client";
import { NotFoundError, PlatformNotFoundError, RateLimitError, ValidationError } from "./errors";
import type { PlatformPlugin } from "./plugin";
import type { BatchResult, Channel, Content, Page } from "./types";

const mockContent: Content = {
  id: "test-id",
  platform: "test",
  title: "Test Content",
  description: "Test Content",
  tags: [],
  url: "https://test.com/watch?v=test-id",
  thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
  channel: { id: "ch1", name: "Channel", url: "https://test.com/channel/ch1" },
  type: "video",
  duration: 3600,
  viewCount: 1000,
  publishedAt: new Date("2024-01-01"),
  raw: {},
};

const mockCapabilities = {
  supportsLiveStreams: true,
  supportsArchiveResolution: false,
  authModel: "apiKey" as const,
  rateLimitModel: "tokenBucket" as const,
  supportsBatchContent: false,
  supportsBatchLiveStreams: false,
  supportsSearch: false,
  supportsClips: false,
};

const createMockPlugin = (name: string): PlatformPlugin => {
  const pluginContent: Content = {
    ...mockContent,
    platform: name,
    url: `https://${name}.com/watch?v=test-id`,
    channel: { ...mockContent.channel, url: `https://${name}.com/channel/ch1` },
  };

  const mockChannel: Channel = {
    id: "ch1",
    platform: name,
    name: "Test Channel",
    url: `https://${name}.com/channel/ch1`,
  };

  const matchUrl = (url: string) =>
    url.includes(name) ? { platform: name, type: "content" as const, id: "test-id" } : null;

  return {
    name,
    rest: {} as PlatformPlugin["rest"],
    capabilities: mockCapabilities,
    match: vi.fn(matchUrl),
    getContent: vi.fn(async () => pluginContent),
    getChannel: vi.fn(async () => mockChannel),
    getLiveStreams: vi.fn(async () => []),
    getVideos: vi.fn(async () => ({ items: [], cursor: undefined, hasMore: false })),
    [Symbol.dispose]: vi.fn(),
  };
};

describe("UnifiedClient.create", () => {
  it("lists registered platforms", () => {
    const plugin = createMockPlugin("test-platform");
    const client = UnifiedClient.create({ plugins: [plugin] });

    expect(client.platforms()).toEqual(["test-platform"]);
    client[Symbol.dispose]();
  });

  it("registers plugins via options", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    expect(client.platform("youtube")).toBe(plugin);
    client[Symbol.dispose]();
  });

  it("registers plugins via register()", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create();
    client.register(plugin);

    expect(client.platform("youtube")).toBe(plugin);
    client[Symbol.dispose]();
  });

  it("throws PlatformNotFoundError for unknown platform", () => {
    const client = UnifiedClient.create();
    expect(() => client.platform("unknown")).toThrow(PlatformNotFoundError);
    client[Symbol.dispose]();
  });

  it("matches URL to correct plugin", () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const resolved = client.match("https://youtube.com/watch?v=abc");
    expect(resolved).toEqual({
      platform: "youtube",
      type: "content",
      id: "test-id",
    });

    const resolved2 = client.match("https://twitch.tv/streamer");
    expect(resolved2).toEqual({
      platform: "twitch",
      type: "content",
      id: "test-id",
    });

    const resolved3 = client.match("https://example.com/foo");
    expect(resolved3).toBeNull();

    client[Symbol.dispose]();
  });

  it.each([
    {
      method: "getContentById" as const,
      args: ["youtube", "abc123"],
      pluginMethod: "getContent" as const,
      pluginArgs: ["abc123"],
      assertion: (result: Content) => expect(result.platform).toBe("youtube"),
    },
    {
      method: "getLiveStreams" as const,
      args: ["youtube", "ch1"],
      pluginMethod: "getLiveStreams" as const,
      pluginArgs: ["ch1"],
      assertion: (result: unknown) => expect(result).toEqual([]),
    },
    {
      method: "getVideos" as const,
      args: ["youtube", "ch1", "cursor1"],
      pluginMethod: "getVideos" as const,
      pluginArgs: ["ch1", "cursor1", undefined],
      assertion: (result: { items: unknown[] }) => expect(result.items).toEqual([]),
    },
    {
      method: "getChannel" as const,
      args: ["youtube", "ch1"],
      pluginMethod: "getChannel" as const,
      pluginArgs: ["ch1"],
      assertion: (result: Channel) => expect(result.name).toBe("Test Channel"),
    },
  ])(
    "$method delegates to plugin.$pluginMethod",
    async ({ method, args, pluginMethod, pluginArgs, assertion }) => {
      const plugin = createMockPlugin("youtube");
      const client = UnifiedClient.create({ plugins: [plugin] });

      const result = await (client[method] as Function)(...args);
      expect(plugin[pluginMethod]).toHaveBeenCalledWith(...pluginArgs);
      assertion(result);

      client[Symbol.dispose]();
    },
  );

  it("getContent routes URL to correct plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContent("https://youtube.com/watch?v=abc");
    expect(content.platform).toBe("youtube");
    expect(plugin.getContent).toHaveBeenCalledWith("test-id");

    client[Symbol.dispose]();
  });

  it("getContent throws ValidationError on empty URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.getContent("")).rejects.toThrow(ValidationError);
    await expect(client.getContent("")).rejects.toThrow("URL must be a non-empty string");

    client[Symbol.dispose]();
  });

  it("getContent throws ValidationError for malformed URL", async () => {
    const client = UnifiedClient.create();
    await expect(client.getContent("not-a-url")).rejects.toThrow(ValidationError);
    client[Symbol.dispose]();
  });

  it("getContent throws ValidationError for unmatched URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.getContent("https://unknown.com/video/123")).rejects.toThrow(
      ValidationError,
    );
    await expect(client.getContent("https://unknown.com/video/123")).rejects.toThrow(
      "No registered plugin matches URL",
    );

    client[Symbol.dispose]();
  });

  it("[Symbol.dispose] calls [Symbol.dispose] on all plugins and clears registry", () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    client[Symbol.dispose]();

    expect(yt[Symbol.dispose]).toHaveBeenCalledTimes(1);
    expect(tw[Symbol.dispose]).toHaveBeenCalledTimes(1);

    // After [Symbol.dispose], plugins are cleared
    expect(() => client.platform("youtube")).toThrow(PlatformNotFoundError);
  });
});

describe("UnifiedClient.is", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string", "hello"],
    ["number", 42],
    ["empty object", {}],
  ])("returns false for %s", (_, value) => {
    expect(UnifiedClient.is(value)).toBe(false);
  });

  it("returns false for partial object", () => {
    expect(UnifiedClient.is({ register: () => {}, getContent: () => {} })).toBe(false);
  });

  it("returns true for a created UnifiedClient", () => {
    const client = UnifiedClient.create();
    expect(UnifiedClient.is(client)).toBe(true);
    client[Symbol.dispose]();
  });
});

describe("UnifiedClient cross-plugin routing", () => {
  it("routes URLs to the correct plugin among multiple registrations", () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const tc = createMockPlugin("twitcasting");
    const client = UnifiedClient.create({ plugins: [yt, tw, tc] });

    // YouTube URL matches youtube plugin
    const ytRes = client.match("https://youtube.com/watch?v=abc");
    expect(ytRes?.platform).toBe("youtube");

    // Twitch URL matches twitch plugin
    const twRes = client.match("https://twitch.tv/streamer");
    expect(twRes?.platform).toBe("twitch");

    // TwitCasting URL matches twitcasting plugin
    const tcRes = client.match("https://twitcasting.tv/user123");
    expect(tcRes?.platform).toBe("twitcasting");

    // Unknown URL returns null
    expect(client.match("https://vimeo.com/12345")).toBeNull();

    client[Symbol.dispose]();
  });

  it("register overwrites existing plugin with same name", () => {
    const original = createMockPlugin("youtube");
    const replacement = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [original] });

    client.register(replacement);

    // Should use the replacement, not the original
    expect(client.platform("youtube")).toBe(replacement);
    expect(client.platforms()).toEqual(["youtube"]);

    client[Symbol.dispose]();
  });

  it("plugins are iterated in registration order for URL matching", () => {
    // Create two plugins that match the same URL
    const first = createMockPlugin("first");
    const second = createMockPlugin("second");

    // Both match URLs containing their name, but "first" also matches "second" since
    // createMockPlugin matches if url.includes(name)
    const client = UnifiedClient.create({ plugins: [first, second] });

    // A URL containing "first" should match "first" plugin
    const result = client.match("https://first.example.com/video");
    expect(result?.platform).toBe("first");

    client[Symbol.dispose]();
  });

  it("concurrent API calls to different plugins do not interfere", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const [ytContent, twContent] = await Promise.all([
      client.getContentById("youtube", "v1"),
      client.getContentById("twitch", "v2"),
    ]);

    expect(ytContent.platform).toBe("youtube");
    expect(twContent.platform).toBe("twitch");
    expect(yt.getContent).toHaveBeenCalledWith("v1");
    expect(tw.getContent).toHaveBeenCalledWith("v2");

    client[Symbol.dispose]();
  });
});

describe("UnifiedClient batch operations", () => {
  it("getContents returns empty BatchResult for empty IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.getContents("test", []);

    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
    expect(plugin.getContent).not.toHaveBeenCalled();

    client[Symbol.dispose]();
  });

  it("getContents deduplicates IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await client.getContents("test", ["id1", "id1", "id1"]);

    expect(plugin.getContent).toHaveBeenCalledTimes(1);

    client[Symbol.dispose]();
  });

  it("getContents uses fallback when plugin lacks native batch", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.getContents("test", ["a", "b", "c"]);

    expect(plugin.getContent).toHaveBeenCalledTimes(3);
    expect(result.values.size).toBe(3);
    expect(result.errors.size).toBe(0);

    client[Symbol.dispose]();
  });

  it("getContents fallback separates per-item errors", async () => {
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockImplementation(async (id: string) => {
      if (id === "missing") throw new NotFoundError("test", "missing");
      return { ...mockContent, id, platform: "test" };
    });
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.getContents("test", ["ok1", "missing", "ok2"]);

    expect(result.values.size).toBe(2);
    expect(result.values.has("ok1")).toBe(true);
    expect(result.values.has("ok2")).toBe(true);
    expect(result.errors.size).toBe(1);
    expect(result.errors.has("missing")).toBe(true);
    expect(result.errors.get("missing")).toBeInstanceOf(NotFoundError);

    client[Symbol.dispose]();
  });

  it("getContents fallback rethrows request-level errors", async () => {
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockRejectedValue(new RateLimitError("test"));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.getContents("test", ["id1"])).rejects.toThrow(RateLimitError);

    client[Symbol.dispose]();
  });

  it("getContents delegates to plugin native batch when available", async () => {
    const plugin = createMockPlugin("test");
    const nativeBatch: BatchResult<Content> = {
      values: new Map([["x", { ...mockContent, id: "x", platform: "test" }]]),
      errors: new Map(),
    };
    plugin.getContents = vi.fn(async () => nativeBatch);
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.getContents("test", ["x"]);

    expect(plugin.getContents).toHaveBeenCalledWith(["x"]);
    expect(plugin.getContent).not.toHaveBeenCalled();
    expect(result).toBe(nativeBatch);

    client[Symbol.dispose]();
  });

  it("getContents throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();

    await expect(client.getContents("unknown", ["id1"])).rejects.toThrow(PlatformNotFoundError);

    client[Symbol.dispose]();
  });
});

describe("UnifiedClient getLiveStreamsBatch", () => {
  it("returns empty for empty channelIds", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.getLiveStreamsBatch("test", []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
    client[Symbol.dispose]();
  });

  it("uses fallback when plugin lacks native batch", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.getLiveStreamsBatch("test", ["ch1", "ch2"]);
    expect(plugin.getLiveStreams).toHaveBeenCalledTimes(2);
    expect(result.values.size).toBe(2);
    // Each value should be an array (LiveStream[])
    for (const streams of result.values.values()) {
      expect(Array.isArray(streams)).toBe(true);
    }
    client[Symbol.dispose]();
  });

  it("deduplicates channel IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    await client.getLiveStreamsBatch("test", ["ch1", "ch1", "ch1"]);
    expect(plugin.getLiveStreams).toHaveBeenCalledTimes(1);
    client[Symbol.dispose]();
  });

  it("delegates to native batch when available", async () => {
    const plugin = createMockPlugin("test");
    const nativeResult = { values: new Map([["ch1", []]]), errors: new Map() };
    plugin.getLiveStreamsBatch = vi.fn(async () => nativeResult);
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.getLiveStreamsBatch("test", ["ch1"]);
    expect(plugin.getLiveStreamsBatch).toHaveBeenCalledWith(["ch1"]);
    expect(plugin.getLiveStreams).not.toHaveBeenCalled();
    expect(result).toBe(nativeResult);
    client[Symbol.dispose]();
  });

  it("throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();
    await expect(client.getLiveStreamsBatch("unknown", ["ch1"])).rejects.toThrow(
      PlatformNotFoundError,
    );
    client[Symbol.dispose]();
  });
});

describe("UnifiedClient search", () => {
  it("search delegates to plugin", async () => {
    const plugin = createMockPlugin("test");
    const searchResult: Page<Content> = {
      items: [{ ...mockContent, platform: "test" }],
      hasMore: false,
    };
    plugin.search = vi.fn(async () => searchResult);
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.search("test", { query: "hello" });

    expect(plugin.search).toHaveBeenCalledWith({ query: "hello" });
    expect(result).toBe(searchResult);

    client[Symbol.dispose]();
  });

  it("search throws ValidationError when plugin lacks search", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.search("test", { query: "hello" })).rejects.toThrow(ValidationError);
    await expect(client.search("test", { query: "hello" })).rejects.toThrow(
      "does not support search",
    );

    client[Symbol.dispose]();
  });

  it("search throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();

    await expect(client.search("unknown", { query: "hello" })).rejects.toThrow(
      PlatformNotFoundError,
    );

    client[Symbol.dispose]();
  });

  it("search throws ValidationError when no query, status, or channelId", async () => {
    const plugin = createMockPlugin("test");
    plugin.search = vi.fn(async () => ({ items: [], hasMore: false }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.search("test", {})).rejects.toThrow(ValidationError);
    await expect(client.search("test", {})).rejects.toThrow(
      "search requires at least one of 'query', 'status', or 'channelId'",
    );

    client[Symbol.dispose]();
  });

  it("search accepts channelId without query or status", async () => {
    const plugin = createMockPlugin("test");
    plugin.search = vi.fn(async () => ({ items: [], hasMore: false }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await client.search("test", { channelId: "ch1" });
    expect(plugin.search).toHaveBeenCalledWith({ channelId: "ch1" });

    client[Symbol.dispose]();
  });
});

describe("UnifiedClient OTel integration", () => {
  const createMockTracerProvider = () => {
    const spans: Array<{
      name: string;
      attributes: Record<string, unknown>;
      status?: { code: number };
      ended: boolean;
    }> = [];

    const tracer = {
      startActiveSpan: vi.fn((name: string, fn: (span: unknown) => unknown) => {
        const spanRecord = {
          name,
          attributes: {} as Record<string, unknown>,
          status: undefined as { code: number } | undefined,
          ended: false,
        };
        spans.push(spanRecord);
        const span = {
          setAttribute: vi.fn((k: string, v: unknown) => {
            spanRecord.attributes[k] = v;
          }),
          setStatus: vi.fn((s: { code: number }) => {
            spanRecord.status = s;
          }),
          recordException: vi.fn(),
          end: vi.fn(() => {
            spanRecord.ended = true;
          }),
        };
        return fn(span);
      }),
      startSpan: vi.fn(),
    };

    const provider: TracerProvider = { getTracer: vi.fn().mockReturnValue(tracer) };
    return { provider, spans };
  };

  it("creates client-level span for getContentById", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.getContentById("youtube", "abc");

    expect(spans).toHaveLength(1);
    expect(spans[0]!.name).toBe("unified-live.client getContentById");
    expect(spans[0]!.attributes["unified_live.operation"]).toBe("getContentById");
    expect(spans[0]!.attributes["unified_live.platform"]).toBe("youtube");
    expect(spans[0]!.ended).toBe(true);

    client[Symbol.dispose]();
  });

  it("sets batch.size for getContents", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.getContents("test", ["a", "b", "c"]);

    expect(spans).toHaveLength(1);
    expect(spans[0]!.attributes["unified_live.batch.size"]).toBe(3);

    client[Symbol.dispose]();
  });

  it("records error on client span when plugin throws", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockRejectedValue(
      new NotFoundError("test", "missing"),
    );
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.getContentById("test", "missing").catch(() => {});

    expect(spans[0]!.status?.code).toBe(2); // SpanStatusCode.ERROR
    expect(spans[0]!.ended).toBe(true);

    client[Symbol.dispose]();
  });
});
