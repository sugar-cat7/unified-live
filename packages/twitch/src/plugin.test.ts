import { ValidationError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import { createTwitchPlugin } from "./plugin";
import { createMockFetch } from "./test-helpers";

describe("createTwitchPlugin", () => {
  it("reports correct capabilities", () => {
    const plugin = createTwitchPlugin({
      clientId: "id",
      clientSecret: "secret",
      fetch: createMockFetch([]),
    });
    expect(plugin.capabilities).toEqual({
      supportsBroadcasts: true,
      supportsArchiveResolution: true,
      authModel: "oauth2",
      rateLimitModel: "tokenBucket",
      supportsBatchContent: true,
      supportsBatchBroadcasts: true,
      supportsSearch: true,
      supportsClips: true,
    });

  });

  it("throws on missing credentials", () => {
    expect(() =>
      createTwitchPlugin({ clientId: "", clientSecret: "s", fetch: createMockFetch([]) }),
    ).toThrow("clientId and clientSecret are required");
    expect(() =>
      createTwitchPlugin({ clientId: "id", clientSecret: "", fetch: createMockFetch([]) }),
    ).toThrow("clientId and clientSecret are required");
  });

  it("throws ValidationError for whitespace-only credentials", () => {
    expect(() =>
      createTwitchPlugin({ clientId: "  ", clientSecret: "secret", fetch: createMockFetch([]) }),
    ).toThrow(ValidationError);
  });

  it("creates a plugin with correct name", () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([]),
    });

    expect(plugin.name).toBe("twitch");

  });

  it("matches Twitch URLs", () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([]),
    });

    expect(plugin.match("https://www.twitch.tv/shroud")).toEqual({
      platform: "twitch",
      type: "channel",
      id: "shroud",
    });
    expect(plugin.match("https://www.twitch.tv/videos/12345")).toEqual({
      platform: "twitch",
      type: "content",
      id: "12345",
    });
    expect(plugin.match("https://youtube.com/watch?v=abc")).toBeNull();


  });

  it("getContent fetches a video by ID", async () => {
    const mockVideo = {
      id: "v123",
      stream_id: "s1",
      user_id: "u1",
      user_login: "user",
      user_name: "User",
      title: "Test",
      duration: "1h0m0s",
      view_count: 100,
      created_at: "2026-01-01T00:00:00Z",
      published_at: "2026-01-01T00:00:00Z",
      thumbnail_url: "https://img.tv/thumb-{width}x{height}.jpg",
      type: "archive",
      url: "https://www.twitch.tv/videos/v123",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockVideo] } }]),
    });

    const content = await plugin.getContent("v123");
    expect(content.type).toBe("archive");
    expect(content.id).toBe("v123");
    expect(content.platform).toBe("twitch");


  });

  it("getChannel fetches user info", async () => {
    const mockUser = {
      id: "u1",
      login: "testuser",
      display_name: "TestUser",
      profile_image_url: "https://img.tv/user.png",
      description: "A test user",
      created_at: "2020-01-01T00:00:00Z",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockUser] } }]),
    });

    const channel = await plugin.getChannel("testuser");
    expect(channel.name).toBe("TestUser");
    expect(channel.platform).toBe("twitch");


  });

  it("listBroadcasts returns broadcasts", async () => {
    const mockStream = {
      id: "s1",
      user_id: "u1",
      user_login: "user",
      user_name: "User",
      game_name: "Game",
      title: "Live!",
      viewer_count: 500,
      started_at: "2026-03-08T10:00:00Z",
      thumbnail_url: "https://img.tv/live-{width}x{height}.jpg",
      type: "live",
      language: "en",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockStream] } }]),
    });

    const streams = await plugin.listBroadcasts("u1");
    expect(streams).toHaveLength(1);
    expect(streams[0]!.type).toBe("broadcast");
    expect(streams[0]!.viewerCount).toBe(500);


  });

  it("listArchives returns paginated archives", async () => {
    const mockVideo = {
      id: "v1",
      stream_id: "s1",
      user_id: "u1",
      user_login: "user",
      user_name: "User",
      title: "Past Stream",
      duration: "2h30m0s",
      view_count: 200,
      created_at: "2026-03-07T00:00:00Z",
      published_at: "2026-03-07T00:00:00Z",
      thumbnail_url: "https://img.tv/vid-{width}x{height}.jpg",
      type: "archive",
      url: "https://www.twitch.tv/videos/v1",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([
        {
          status: 200,
          body: {
            data: [mockVideo],
            pagination: { cursor: "next-page" },
          },
        },
      ]),
    });

    const page = await plugin.listArchives("u1");
    expect(page.items).toHaveLength(1);
    expect(page.items[0]!.type).toBe("archive");
    expect(page.cursor).toBe("next-page");
    expect(page.hasMore).toBe(true);


  });

  it("includes Client-Id header in requests", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: { data: [] } }]);

    const plugin = createTwitchPlugin({
      clientId: "my-client-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });

    await plugin.listBroadcasts("u1");

    // Find the API call (not the token call)
    const calls = (fetchFn as ReturnType<typeof vi.fn>).mock.calls;
    const apiCall = calls.find((c) => !(c[0] as string).includes("oauth2/token"));
    const headers = (apiCall?.[1] as RequestInit)?.headers as Record<string, string>;
    expect(headers["Client-Id"]).toBe("my-client-id");


  });

  it("resolveArchive finds matching archive video", async () => {
    const mockVideo = {
      id: "v1",
      stream_id: "s1",
      user_id: "u1",
      user_login: "user",
      user_name: "User",
      title: "Past Stream",
      duration: "1h0m0s",
      view_count: 100,
      created_at: "2026-01-01T00:00:00Z",
      published_at: "2026-01-01T00:00:00Z",
      thumbnail_url: "https://img.tv/vid-{width}x{height}.jpg",
      type: "archive",
      url: "https://www.twitch.tv/videos/v1",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockVideo] } }]),
    });

    const live = {
      id: "s1",
      platform: "twitch",
      title: "Live",
      description: "",
      tags: [] as string[],
      url: "https://www.twitch.tv/user",
      thumbnail: { url: "https://img.tv/thumb.jpg", width: 640, height: 360 },
      channel: { id: "u1", name: "User", url: "https://www.twitch.tv/user" },
      sessionId: "s1",
      type: "broadcast" as const,
      viewerCount: 100,
      startedAt: new Date("2026-01-01T00:00:00Z"),
      raw: {},
    };

    const archive = await plugin.resolveArchive!(live);
    expect(archive).not.toBeNull();
    expect(archive!.type).toBe("archive");


  });

  it("resolveArchive returns null when no match", async () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [] } }]),
    });

    const live = {
      id: "s1",
      platform: "twitch",
      title: "Live",
      description: "",
      tags: [] as string[],
      url: "https://www.twitch.tv/user",
      thumbnail: { url: "https://img.tv/thumb.jpg", width: 640, height: 360 },
      channel: { id: "u1", name: "User", url: "https://www.twitch.tv/user" },
      sessionId: "s1",
      type: "broadcast" as const,
      viewerCount: 100,
      startedAt: new Date("2026-01-01T00:00:00Z"),
      raw: {},
    };

    const archive = await plugin.resolveArchive!(live);
    expect(archive).toBeNull();


  });
});
