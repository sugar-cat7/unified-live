import { describe, expect, it, vi } from "vitest";
import { UnifiedClient } from "./client";
import { PlatformNotFoundError, ValidationError } from "./errors";
import type { PlatformPlugin } from "./plugin";
import type { Channel, Content } from "./types";

const createMockPlugin = (name: string): PlatformPlugin => {
  const mockContent: Content = {
    id: "test-id",
    platform: name,
    title: "Test Content",
    url: `https://${name}.com/watch?v=test-id`,
    thumbnail: {
      url: "https://example.com/thumb.jpg",
      width: 320,
      height: 180,
    },
    channel: {
      id: "ch1",
      name: "Channel",
      url: `https://${name}.com/channel/ch1`,
    },
    type: "video",
    duration: 3600,
    viewCount: 1000,
    publishedAt: new Date("2024-01-01"),
    raw: {},
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
    match: vi.fn(matchUrl),
    resolveUrl: vi.fn(matchUrl),
    getContent: vi.fn(async () => mockContent),
    getChannel: vi.fn(async () => mockChannel),
    getLiveStreams: vi.fn(async () => []),
    getVideos: vi.fn(async () => ({ items: [], cursor: undefined })),
    dispose: vi.fn(),
  };
};

describe("UnifiedClient.create", () => {
  it("registers plugins via options", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    expect(client.platform("youtube")).toBe(plugin);
    client.dispose();
  });

  it("registers plugins via register()", () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create();
    client.register(plugin);

    expect(client.platform("youtube")).toBe(plugin);
    client.dispose();
  });

  it("throws PlatformNotFoundError for unknown platform", () => {
    const client = UnifiedClient.create();
    expect(() => client.platform("unknown")).toThrow(PlatformNotFoundError);
    client.dispose();
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

    client.dispose();
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
      pluginArgs: ["ch1", "cursor1"],
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

      client.dispose();
    },
  );

  it("getContent routes URL to correct plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContent("https://youtube.com/watch?v=abc");
    expect(content.platform).toBe("youtube");
    expect(plugin.getContent).toHaveBeenCalledWith("test-id");

    client.dispose();
  });

  it("getContent throws ValidationError on empty URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.getContent("")).rejects.toThrow(ValidationError);
    await expect(client.getContent("")).rejects.toThrow("URL must be a non-empty string");

    client.dispose();
  });

  it("getContent throws PlatformNotFoundError for unknown URL", async () => {
    const client = UnifiedClient.create();

    await expect(client.getContent("https://unknown.com/video/123")).rejects.toThrow(
      PlatformNotFoundError,
    );

    client.dispose();
  });

  it("dispose calls dispose on all plugins and clears registry", () => {
    const yt = createMockPlugin("youtube");
    const tw = createMockPlugin("twitch");
    const client = UnifiedClient.create({ plugins: [yt, tw] });

    client.dispose();

    expect(yt.dispose).toHaveBeenCalledTimes(1);
    expect(tw.dispose).toHaveBeenCalledTimes(1);

    // After dispose, plugins are cleared
    expect(() => client.platform("youtube")).toThrow(PlatformNotFoundError);
  });
});
