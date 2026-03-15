import { afterEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "./errors";
import { PlatformPlugin, type PluginDefinition, type PluginMethods } from "./plugin";
import type { RateLimitHandle, RateLimitStrategy } from "./rest/strategy";
import type { ResolvedUrl } from "./types";

const createMockStrategy = (): RateLimitStrategy => {
  return {
    acquire: vi.fn().mockResolvedValue({
      complete: vi.fn(),
      release: vi.fn(),
    } satisfies RateLimitHandle),
    getStatus: vi.fn().mockReturnValue({
      remaining: 100,
      limit: 100,
      resetsAt: new Date(),
      queued: 0,
    }),
    [Symbol.dispose]: vi.fn(),
  };
};

const createMockFetch = (
  responses: Array<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch => {
  let callIndex = 0;
  return vi.fn(async () => {
    const r = responses[callIndex];
    if (!r) throw new Error(`Unexpected fetch call #${callIndex}`);
    callIndex++;
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: r.headers,
    });
  }) as unknown as typeof globalThis.fetch;
};

const mockMatchUrl = (url: string): ResolvedUrl | null => {
  if (url.includes("example.com")) {
    return { platform: "test", type: "content", id: "123" };
  }
  return null;
};

const createMockMethods = (): PluginMethods => {
  return {
    getContent: vi.fn().mockResolvedValue({ type: "video", id: "v1" }),
    getChannel: vi.fn().mockResolvedValue({ id: "ch1" }),
    getLiveStreams: vi.fn().mockResolvedValue([]),
    getVideos: vi.fn().mockResolvedValue({ items: [], hasMore: false }),
  };
};

const createMinimalDefinition = (overrides?: Partial<PluginDefinition>): PluginDefinition => {
  return {
    name: "test",
    baseUrl: "https://api.example.com",
    rateLimitStrategy: createMockStrategy(),
    matchUrl: mockMatchUrl,
    fetch: createMockFetch([{ status: 200, body: {} }]),
    ...overrides,
  };
};

describe("PlatformPlugin.create", () => {
  let plugin: PlatformPlugin | undefined;

  afterEach(() => {
    plugin?.[Symbol.dispose]();
    plugin = undefined;
  });

  it("throws ValidationError for non-HTTPS baseUrl", () => {
    expect(() =>
      PlatformPlugin.create(
        { ...createMinimalDefinition(), baseUrl: "http://api.example.com" },
        createMockMethods(),
      ),
    ).toThrow(ValidationError);
  });

  it("creates a plugin with required fields only", () => {
    plugin = PlatformPlugin.create(createMinimalDefinition(), createMockMethods());

    expect(plugin.name).toBe("test");
    expect(plugin.rest).toBeDefined();
    expect(plugin.rest.platform).toBe("test");
    expect(plugin.rest.baseUrl).toBe("https://api.example.com");
  });

  it("exposes plugin capabilities", () => {
    plugin = PlatformPlugin.create(createMinimalDefinition(), createMockMethods());

    expect(plugin.capabilities).toBeDefined();
    expect(plugin.capabilities.supportsLiveStreams).toBe(true);
  });

  it("wires match and resolveUrl to definition.matchUrl", () => {
    plugin = PlatformPlugin.create(createMinimalDefinition(), createMockMethods());

    const matched = plugin.match("https://example.com/video");
    expect(matched).toEqual({ platform: "test", type: "content", id: "123" });

    const resolved = plugin.resolveUrl("https://example.com/video");
    expect(resolved).toEqual({ platform: "test", type: "content", id: "123" });

    expect(plugin.match("https://other.com")).toBeNull();
  });

  it.each([
    {
      name: "getContent",
      methodName: "getContent" as const,
      args: ["v1"],
      expectedPluginArgs: ["v1"],
    },
    {
      name: "getChannel",
      methodName: "getChannel" as const,
      args: ["ch1"],
      expectedPluginArgs: ["ch1"],
    },
    {
      name: "getLiveStreams",
      methodName: "getLiveStreams" as const,
      args: ["ch1"],
      expectedPluginArgs: ["ch1"],
    },
  ])(
    "delegates $name to methods with rest injected",
    async ({ methodName, args, expectedPluginArgs }) => {
      const methods = createMockMethods();
      plugin = PlatformPlugin.create(createMinimalDefinition(), methods);
      await (plugin[methodName] as Function)(...args);
      expect(methods[methodName]).toHaveBeenCalledWith(plugin.rest, ...expectedPluginArgs);
    },
  );

  it("delegates getVideos to methods with rest and cursor injected", async () => {
    const methods = createMockMethods();
    plugin = PlatformPlugin.create(createMinimalDefinition(), methods);

    await plugin.getVideos("ch1", "cursor123");

    expect(methods.getVideos).toHaveBeenCalledWith(plugin.rest, "ch1", "cursor123", undefined);
  });

  it("wires resolveArchive when provided", async () => {
    const methods = createMockMethods();
    methods.resolveArchive = vi.fn().mockResolvedValue(null);
    plugin = PlatformPlugin.create(createMinimalDefinition(), methods);

    const live = { type: "live" as const, id: "l1" } as Parameters<
      NonNullable<PlatformPlugin["resolveArchive"]>
    >[0];
    await plugin.resolveArchive!(live);

    expect(methods.resolveArchive).toHaveBeenCalledWith(plugin.rest, live);
  });

  it("leaves resolveArchive undefined when not provided", () => {
    const methods = createMockMethods();
    plugin = PlatformPlugin.create(createMinimalDefinition(), methods);

    expect(plugin.resolveArchive).toBeUndefined();
  });

  it("applies transformRequest to modify requests", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: { ok: true } }]);
    const definition = createMinimalDefinition({
      fetch: fetchFn,
      transformRequest: (req) => ({
        ...req,
        query: { ...req.query, key: "API_KEY" },
      }),
    });
    const methods = createMockMethods();
    methods.getContent = async (rest, id) => {
      await rest.request({ method: "GET", path: "/videos", query: { id } });
      return { type: "video", id } as Awaited<ReturnType<typeof methods.getContent>>;
    };

    plugin = PlatformPlugin.create(definition, methods);
    await plugin.getContent("v1");

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("key")).toBe("API_KEY");
    expect(url.searchParams.get("id")).toBe("v1");
  });

  it("applies handleRateLimit override", async () => {
    const customHandler = vi.fn().mockResolvedValue(false);
    const definition = createMinimalDefinition({
      handleRateLimit: customHandler,
    });

    plugin = PlatformPlugin.create(definition, createMockMethods());

    expect(plugin.rest.handleRateLimit).toBe(customHandler);
  });

  it("applies parseRateLimitHeaders override", () => {
    const customParser = vi
      .fn()
      .mockReturnValue({ limit: 100, remaining: 50, resetsAt: new Date() });
    const definition = createMinimalDefinition({
      parseRateLimitHeaders: customParser,
    });

    plugin = PlatformPlugin.create(definition, createMockMethods());

    expect(plugin.rest.parseRateLimitHeaders).toBe(customParser);
  });

  it("passes headers to RestManager", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);
    const definition = createMinimalDefinition({
      fetch: fetchFn,
      headers: { "X-Custom-Header": "custom-value" },
    });
    const methods = createMockMethods();
    methods.getContent = async (rest, id) => {
      await rest.request({ method: "GET", path: "/test" });
      return { type: "video", id } as Awaited<ReturnType<typeof methods.getContent>>;
    };

    plugin = PlatformPlugin.create(definition, methods);
    await plugin.getContent("v1");

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers["X-Custom-Header"]).toBe("custom-value");
  });

  it("forwards tokenManager to RestManager", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);
    const tokenManager = {
      getAuthHeader: vi.fn().mockResolvedValue("Bearer test-token"),
      invalidate: vi.fn(),
    };
    const definition = createMinimalDefinition({
      fetch: fetchFn,
      tokenManager,
    });
    const methods = createMockMethods();
    methods.getContent = async (rest, id) => {
      await rest.request({ method: "GET", path: "/test" });
      return { type: "video", id } as Awaited<ReturnType<typeof methods.getContent>>;
    };

    plugin = PlatformPlugin.create(definition, methods);
    await plugin.getContent("v1");

    expect(tokenManager.getAuthHeader).toHaveBeenCalled();
    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("forwards retry config to RestManager", async () => {
    const fetchFn = createMockFetch([{ status: 500 }, { status: 200, body: { ok: true } }]);
    const definition = createMinimalDefinition({
      fetch: fetchFn,
      retry: { maxRetries: 1, baseDelay: 1 },
    });
    const methods = createMockMethods();
    methods.getContent = async (rest, id) => {
      await rest.request<{ ok: boolean }>({
        method: "GET",
        path: "/test",
      });
      return { type: "video", id } as unknown as Awaited<ReturnType<typeof methods.getContent>>;
    };

    plugin = PlatformPlugin.create(definition, methods);
    await plugin.getContent("v1");

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("[Symbol.dispose] calls rest[Symbol.dispose]", () => {
    const strategy = createMockStrategy();
    plugin = PlatformPlugin.create(
      createMinimalDefinition({ rateLimitStrategy: strategy }),
      createMockMethods(),
    );

    plugin[Symbol.dispose]();

    expect(strategy[Symbol.dispose]).toHaveBeenCalledTimes(1);
    plugin = undefined; // prevent double [Symbol.dispose] in afterEach
  });
});

describe("PlatformPlugin.is", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string", "hello"],
    ["number", 42],
    ["empty object", {}],
  ])("returns false for %s", (_, value) => {
    expect(PlatformPlugin.is(value)).toBe(false);
  });

  it("returns false for partial object missing required properties", () => {
    expect(PlatformPlugin.is({ name: "test", match: () => null })).toBe(false);
    expect(
      PlatformPlugin.is({
        name: "test",
        rest: {},
        match: () => null,
        getContent: () => {},
      }),
    ).toBe(false);
  });

  it("returns true for a valid PlatformPlugin", () => {
    const plugin = PlatformPlugin.create(createMinimalDefinition(), createMockMethods());

    expect(PlatformPlugin.is(plugin)).toBe(true);

    plugin[Symbol.dispose]();
  });

  it("returns true for a manually constructed object with all required properties", () => {
    const obj = {
      name: "manual",
      rest: {},
      capabilities: {
        supportsLiveStreams: true,
        supportsArchiveResolution: false,
        authModel: "apiKey",
        rateLimitModel: "tokenBucket",
      },
      match: () => null,
      resolveUrl: () => null,
      getContent: async () => ({}),
      getChannel: async () => ({}),
      getLiveStreams: async () => [],
      getVideos: async () => ({ items: [] }),
      [Symbol.dispose]: () => {},
    };

    expect(PlatformPlugin.is(obj)).toBe(true);
  });
});
