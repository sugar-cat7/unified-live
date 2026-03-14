import { describe, expect, it, vi } from "vitest";
import { UnifiedClient } from "../client";
import { PlatformNotFoundError, ValidationError } from "../errors";
import type { PlatformPlugin } from "../plugin";
import type { Channel, Content } from "../types";

function createMockPlugin(name: string): PlatformPlugin {
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

  return {
    name,
    rest: {} as PlatformPlugin["rest"],
    match: vi.fn((url: string) => {
      if (url.includes(name)) {
        return { platform: name, type: "content" as const, id: "test-id" };
      }
      return null;
    }),
    resolveUrl: vi.fn((url: string) => {
      if (url.includes(name)) {
        return { platform: name, type: "content" as const, id: "test-id" };
      }
      return null;
    }),
    getContent: vi.fn(async () => mockContent),
    getChannel: vi.fn(async () => mockChannel),
    getLiveStreams: vi.fn(async () => []),
    getVideos: vi.fn(async () => ({ items: [], cursor: undefined })),
    dispose: vi.fn(),
  };
}

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
    await expect(client.getContent("")).rejects.toThrow(
      "URL must be a non-empty string",
    );

    client.dispose();
  });

  it("getContent throws PlatformNotFoundError for unknown URL", async () => {
    const client = UnifiedClient.create();

    await expect(
      client.getContent("https://unknown.com/video/123"),
    ).rejects.toThrow(PlatformNotFoundError);

    client.dispose();
  });

  it("getContentById retrieves by platform + id", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContentById("youtube", "abc123");
    expect(plugin.getContent).toHaveBeenCalledWith("abc123");
    expect(content.platform).toBe("youtube");

    client.dispose();
  });

  it("getLiveStreams delegates to plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const streams = await client.getLiveStreams("youtube", "ch1");
    expect(plugin.getLiveStreams).toHaveBeenCalledWith("ch1");
    expect(streams).toEqual([]);

    client.dispose();
  });

  it("getVideos delegates to plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const page = await client.getVideos("youtube", "ch1", "cursor1");
    expect(plugin.getVideos).toHaveBeenCalledWith("ch1", "cursor1");
    expect(page.items).toEqual([]);

    client.dispose();
  });

  it("getChannel delegates to plugin", async () => {
    const plugin = createMockPlugin("youtube");
    const client = UnifiedClient.create({ plugins: [plugin] });

    const channel = await client.getChannel("youtube", "ch1");
    expect(plugin.getChannel).toHaveBeenCalledWith("ch1");
    expect(channel.name).toBe("Test Channel");

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
