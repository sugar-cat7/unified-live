import type { TracerProvider } from "@opentelemetry/api";
import { describe, expect, it, vi } from "vitest";
import { UnifiedClient } from "./client";
import { NotFoundError, PlatformNotFoundError, RateLimitError, ValidationError } from "./errors";
import type { PlatformPlugin } from "./plugin";
import type { BatchResult, Channel, Clip, Content, Page } from "./types";

const mockContent: Content = {
  id: "test-id",
  platform: "test",
  title: "Test Content",
  description: "Test Content",
  tags: [],
  url: "https://test.com/watch?v=test-id",
  thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
  channel: { id: "ch1", name: "Channel", url: "https://test.com/channel/ch1" },
  type: "archive",
  duration: 3600,
  viewCount: 1000,
  publishedAt: new Date("2024-01-01"),
  raw: {},
};

const mockCapabilities = {
  supportsBroadcasts: true,
  supportsArchiveResolution: false,
  authModel: "apiKey" as const,
  rateLimitModel: "tokenBucket" as const,
  supportsBatchContent: false,
  supportsBatchBroadcasts: false,
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
    listBroadcasts: vi.fn(async () => []),
    listArchives: vi.fn(async () => ({ items: [], cursor: undefined, hasMore: false })),
  };
};

describe("UnifiedClient.create", () => {
  it("lists registered platforms", () => {
    const plugin = createMockPlugin("test-platform");
    const client = UnifiedClient.create({ plugins: [plugin] });

    expect(client.platforms()).toEqual(["test-platform"]);

  });

  it("registers plugins via options", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    expect(client.platform("youtube")).toBe(plugin);

  });

  it("registers plugins via register()", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create();
    client.register(plugin);

    expect(client.platform("youtube")).toBe(plugin);

  });

  it("throws PlatformNotFoundError for unknown platform", () => {
    const client = UnifiedClient.create();
    expect(() => client.platform("unknown")).toThrow(PlatformNotFoundError);

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


  });

  it.each([
    {
      method: "getContent" as const,
      args: ["youtube", "abc123"],
      pluginMethod: "getContent" as const,
      pluginArgs: ["abc123"],
      assertion: (result: Content) => expect(result.platform).toBe("youtube"),
    },
    {
      method: "listBroadcasts" as const,
      args: ["youtube", "ch1"],
      pluginMethod: "listBroadcasts" as const,
      pluginArgs: ["ch1"],
      assertion: (result: unknown) => expect(result).toEqual([]),
    },
    {
      method: "listArchives" as const,
      args: ["youtube", "ch1", "cursor1"],
      pluginMethod: "listArchives" as const,
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

  
    },
  );

  it("resolve routes URL to correct plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.resolve("https://youtube.com/watch?v=abc");
    expect(content.platform).toBe("youtube");
    expect(plugin.getContent).toHaveBeenCalledWith("test-id");


  });

  it("resolve throws ValidationError on empty URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.resolve("")).rejects.toThrow(ValidationError);
    await expect(client.resolve("")).rejects.toThrow("URL must be a non-empty string");


  });

  it("resolve throws ValidationError for malformed URL", async () => {
    const client = UnifiedClient.create();
    await expect(client.resolve("not-a-url")).rejects.toThrow(ValidationError);

  });

  it("resolve throws ValidationError for unmatched URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.resolve("https://unknown.com/video/123")).rejects.toThrow(ValidationError);
    await expect(client.resolve("https://unknown.com/video/123")).rejects.toThrow(
      "No registered plugin matches URL",
    );


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


  });

  it("register overwrites existing plugin with same name", () => {
    const original = createMockPlugin("youtube");
    const replacement = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [original] });

    client.register(replacement);

    // Should use the replacement, not the original
    expect(client.platform("youtube")).toBe(replacement);
    expect(client.platforms()).toEqual(["youtube"]);


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


  });

  it("concurrent API calls to different plugins do not interfere", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const [ytContent, twContent] = await Promise.all([
      client.getContent("youtube", "v1"),
      client.getContent("twitch", "v2"),
    ]);

    expect(ytContent.platform).toBe("youtube");
    expect(twContent.platform).toBe("twitch");
    expect(yt.getContent).toHaveBeenCalledWith("v1");
    expect(tw.getContent).toHaveBeenCalledWith("v2");


  });
});

describe("UnifiedClient batch operations", () => {
  it("batchGetContents returns empty BatchResult for empty IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetContents("test", []);

    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
    expect(plugin.getContent).not.toHaveBeenCalled();


  });

  it("batchGetContents deduplicates IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await client.batchGetContents("test", ["id1", "id1", "id1"]);

    expect(plugin.getContent).toHaveBeenCalledTimes(1);


  });

  it("batchGetContents uses fallback when plugin lacks native batch", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetContents("test", ["a", "b", "c"]);

    expect(plugin.getContent).toHaveBeenCalledTimes(3);
    expect(result.values.size).toBe(3);
    expect(result.errors.size).toBe(0);


  });

  it("batchGetContents fallback separates per-item errors", async () => {
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockImplementation(async (id: string) => {
      if (id === "missing") throw new NotFoundError("test", "missing");
      return { ...mockContent, id, platform: "test" };
    });
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetContents("test", ["ok1", "missing", "ok2"]);

    expect(result.values.size).toBe(2);
    expect(result.values.has("ok1")).toBe(true);
    expect(result.values.has("ok2")).toBe(true);
    expect(result.errors.size).toBe(1);
    expect(result.errors.has("missing")).toBe(true);
    expect(result.errors.get("missing")).toBeInstanceOf(NotFoundError);


  });

  it("batchGetContents fallback rethrows request-level errors", async () => {
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockRejectedValue(new RateLimitError("test"));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.batchGetContents("test", ["id1"])).rejects.toThrow(RateLimitError);


  });

  it("batchGetContents delegates to plugin native batch when available", async () => {
    const plugin = createMockPlugin("test");
    const nativeBatch: BatchResult<Content> = {
      values: new Map([["x", { ...mockContent, id: "x", platform: "test" }]]),
      errors: new Map(),
    };
    plugin.batchGetContents = vi.fn(async () => nativeBatch);
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetContents("test", ["x"]);

    expect(plugin.batchGetContents).toHaveBeenCalledWith(["x"]);
    expect(plugin.getContent).not.toHaveBeenCalled();
    expect(result).toBe(nativeBatch);


  });

  it("batchGetContents throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();

    await expect(client.batchGetContents("unknown", ["id1"])).rejects.toThrow(
      PlatformNotFoundError,
    );


  });
});

describe("UnifiedClient batchGetBroadcasts", () => {
  it("returns empty for empty channelIds", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.batchGetBroadcasts("test", []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);

  });

  it("uses fallback when plugin lacks native batch", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.batchGetBroadcasts("test", ["ch1", "ch2"]);
    expect(plugin.listBroadcasts).toHaveBeenCalledTimes(2);
    expect(result.values.size).toBe(2);
    // Each value should be an array (Broadcast[])
    for (const streams of result.values.values()) {
      expect(Array.isArray(streams)).toBe(true);
    }

  });

  it("deduplicates channel IDs", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });
    await client.batchGetBroadcasts("test", ["ch1", "ch1", "ch1"]);
    expect(plugin.listBroadcasts).toHaveBeenCalledTimes(1);

  });

  it("delegates to native batch when available", async () => {
    const plugin = createMockPlugin("test");
    const nativeResult = { values: new Map([["ch1", []]]), errors: new Map() };
    plugin.batchGetBroadcasts = vi.fn(async () => nativeResult);
    const client = UnifiedClient.create({ plugins: [plugin] });
    const result = await client.batchGetBroadcasts("test", ["ch1"]);
    expect(plugin.batchGetBroadcasts).toHaveBeenCalledWith(["ch1"]);
    expect(plugin.listBroadcasts).not.toHaveBeenCalled();
    expect(result).toBe(nativeResult);

  });

  it("throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();
    await expect(client.batchGetBroadcasts("unknown", ["ch1"])).rejects.toThrow(
      PlatformNotFoundError,
    );

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


  });

  it("search throws ValidationError when plugin lacks search", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.search("test", { query: "hello" })).rejects.toThrow(ValidationError);
    await expect(client.search("test", { query: "hello" })).rejects.toThrow(
      "does not support search",
    );


  });

  it("search throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();

    await expect(client.search("unknown", { query: "hello" })).rejects.toThrow(
      PlatformNotFoundError,
    );


  });

  it("search throws ValidationError when no query, status, or channelId", async () => {
    const plugin = createMockPlugin("test");
    plugin.search = vi.fn(async () => ({ items: [], hasMore: false }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.search("test", {})).rejects.toThrow(ValidationError);
    await expect(client.search("test", {})).rejects.toThrow(
      "search requires at least one of 'query', 'status', or 'channelId'",
    );


  });

  it("search accepts channelId without query or status", async () => {
    const plugin = createMockPlugin("test");
    plugin.search = vi.fn(async () => ({ items: [], hasMore: false }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await client.search("test", { channelId: "ch1" });
    expect(plugin.search).toHaveBeenCalledWith({ channelId: "ch1" });


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

  it("creates client-level span for getContent", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.getContent("youtube", "abc");

    expect(spans).toHaveLength(1);
    expect(spans[0]!.name).toBe("unified-live.client getContent");
    expect(spans[0]!.attributes["unified_live.operation"]).toBe("getContent");
    expect(spans[0]!.attributes["unified_live.platform"]).toBe("youtube");
    expect(spans[0]!.ended).toBe(true);


  });

  it("sets batch.size for batchGetContents", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.batchGetContents("test", ["a", "b", "c"]);

    expect(spans).toHaveLength(1);
    expect(spans[0]!.attributes["unified_live.batch.size"]).toBe(3);


  });

  it("records error on client span when plugin throws", async () => {
    const { provider, spans } = createMockTracerProvider();
    const plugin = createMockPlugin("test");
    (plugin.getContent as ReturnType<typeof vi.fn>).mockRejectedValue(
      new NotFoundError("test", "missing"),
    );
    const client = UnifiedClient.create({ plugins: [plugin], tracerProvider: provider });

    await client.getContent("test", "missing").catch(() => {});

    expect(spans[0]!.status?.code).toBe(2); // SpanStatusCode.ERROR
    expect(spans[0]!.ended).toBe(true);


  });
});

const mockClip: Clip = {
  id: "clip-1",
  platform: "test",
  title: "Test Clip",
  description: "A clip",
  tags: [],
  url: "https://test.com/clip/clip-1",
  thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
  channel: { id: "ch1", name: "Channel", url: "https://test.com/channel/ch1" },
  type: "clip",
  duration: 30,
  viewCount: 500,
  createdAt: new Date("2024-06-01"),
  raw: {},
};

describe("UnifiedClient listClips", () => {
  it("delegates to plugin when supported", async () => {
    const plugin = createMockPlugin("test");
    const clipPage: Page<Clip> = { items: [mockClip], hasMore: false };
    plugin.listClips = vi.fn(async () => clipPage);
    (plugin as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsClips: true,
    };
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.listClips("test", "ch1", { limit: 10 });

    expect(plugin.listClips).toHaveBeenCalledWith("ch1", { limit: 10 });
    expect(result).toBe(clipPage);


  });

  it("throws ValidationError when plugin does not support clips", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.listClips("test", "ch1")).rejects.toThrow(ValidationError);
    await expect(client.listClips("test", "ch1")).rejects.toThrow("does not support clips");


  });

  it("throws PlatformNotFoundError for unknown platform", async () => {
    const client = UnifiedClient.create();

    await expect(client.listClips("unknown", "ch1")).rejects.toThrow(PlatformNotFoundError);


  });
});

describe("UnifiedClient batchGetClips", () => {
  it("delegates to plugin when supported", async () => {
    const plugin = createMockPlugin("test");
    const batchResult: BatchResult<Clip> = {
      values: new Map([["clip-1", mockClip]]),
      errors: new Map(),
    };
    plugin.batchGetClips = vi.fn(async () => batchResult);
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetClips("test", ["clip-1"]);

    expect(plugin.batchGetClips).toHaveBeenCalledWith(["clip-1"]);
    expect(result).toBe(batchResult);


  });

  it("returns empty BatchResult for empty array", async () => {
    const plugin = createMockPlugin("test");
    plugin.batchGetClips = vi.fn(async () => ({ values: new Map(), errors: new Map() }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.batchGetClips("test", []);

    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
    expect(plugin.batchGetClips).not.toHaveBeenCalled();


  });

  it("throws ValidationError when plugin does not support batchGetClips", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.batchGetClips("test", ["clip-1"])).rejects.toThrow(ValidationError);
    await expect(client.batchGetClips("test", ["clip-1"])).rejects.toThrow(
      "does not support clip retrieval by IDs",
    );


  });

  it("deduplicates IDs", async () => {
    const plugin = createMockPlugin("test");
    plugin.batchGetClips = vi.fn(async () => ({ values: new Map(), errors: new Map() }));
    const client = UnifiedClient.create({ plugins: [plugin] });

    await client.batchGetClips("test", ["clip-1", "clip-1", "clip-1"]);

    expect(plugin.batchGetClips).toHaveBeenCalledWith(["clip-1"]);


  });
});

describe("UnifiedClient crossListBroadcasts", () => {
  it("fetches from multiple platforms in parallel", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const result = await client.crossListBroadcasts({
      youtube: ["yt-ch1", "yt-ch2"],
      twitch: ["tw-ch1"],
    });

    expect(Object.keys(result)).toHaveLength(2);
    expect(result.youtube).toBeDefined();
    expect(result.twitch).toBeDefined();
    expect(result.youtube!.values.size).toBe(2);
    expect(result.twitch!.values.size).toBe(1);


  });

  it("returns empty BatchResult for failed platforms", async () => {
    const yt = createMockPlugin("youtube");
    // twitch is not registered, so batchGetBroadcasts will throw PlatformNotFoundError
    const client = UnifiedClient.create({ plugins: [yt] });

    const result = await client.crossListBroadcasts({
      youtube: ["yt-ch1"],
      twitch: ["tw-ch1"],
    });

    expect(result.youtube).toBeDefined();
    expect(result.youtube!.values.size).toBe(1);
    // twitch is not registered, so Promise.allSettled catches the PlatformNotFoundError
    expect(result.twitch).toBeDefined();
    expect(result.twitch!.values.size).toBe(0);
    expect(result.twitch!.errors.size).toBe(0);


  });

  it("returns empty result for empty input", async () => {
    const client = UnifiedClient.create();

    const result = await client.crossListBroadcasts({});

    expect(Object.keys(result)).toHaveLength(0);


  });
});

describe("UnifiedClient crossSearch", () => {
  it("searches all searchable plugins", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const ytResult: Page<Content> = {
      items: [{ ...mockContent, platform: "youtube" }],
      hasMore: false,
    };
    const twResult: Page<Content> = {
      items: [{ ...mockContent, platform: "twitch" }],
      hasMore: true,
      cursor: "next",
    };
    yt.search = vi.fn(async () => ytResult);
    tw.search = vi.fn(async () => twResult);
    (yt as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsSearch: true,
    };
    (tw as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsSearch: true,
    };
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const result = await client.crossSearch({ query: "test" });

    expect(Object.keys(result)).toHaveLength(2);
    expect(result.youtube).toBe(ytResult);
    expect(result.twitch).toBe(twResult);


  });

  it("returns empty Page for failed platforms", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const ytResult: Page<Content> = {
      items: [{ ...mockContent, platform: "youtube" }],
      hasMore: false,
    };
    yt.search = vi.fn(async () => ytResult);
    tw.search = vi.fn(async () => {
      throw new Error("search failed");
    });
    (yt as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsSearch: true,
    };
    (tw as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsSearch: true,
    };
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const result = await client.crossSearch({ query: "test" });

    expect(result.youtube).toBe(ytResult);
    expect(result.twitch).toBeDefined();
    expect(result.twitch!.items).toEqual([]);
    expect(result.twitch!.hasMore).toBe(false);


  });

  it("skips plugins that do not support search", async () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const ytResult: Page<Content> = { items: [], hasMore: false };
    yt.search = vi.fn(async () => ytResult);
    (yt as { capabilities: typeof mockCapabilities }).capabilities = {
      ...mockCapabilities,
      supportsSearch: true,
    };
    // twitch has no search and supportsSearch=false (default)
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    const result = await client.crossSearch({ query: "test" });

    expect(Object.keys(result)).toHaveLength(1);
    expect(result.youtube).toBeDefined();
    expect(result.twitch).toBeUndefined();


  });

  it("returns empty result when no plugins support search", async () => {
    const plugin = createMockPlugin("test");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const result = await client.crossSearch({ query: "test" });

    expect(Object.keys(result)).toHaveLength(0);


  });
});
