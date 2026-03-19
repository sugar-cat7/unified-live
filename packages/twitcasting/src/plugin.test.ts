import { ValidationError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import { createTwitCastingPlugin } from "./plugin";
import { createMockFetch } from "./test-helpers";

const mockUser = {
  id: "u1",
  screen_id: "testuser",
  name: "TestUser",
  image: "https://img.twitcasting.tv/user.png",
  profile: "Hello",
  level: 5,
  is_live: false,
};

describe("createTwitCastingPlugin", () => {
  it("reports correct capabilities", () => {
    const plugin = createTwitCastingPlugin({
      clientId: "id",
      clientSecret: "secret",
      fetch: createMockFetch([]),
    });
    expect(plugin.capabilities).toEqual({
      supportsLiveStreams: true,
      supportsArchiveResolution: true,
      authModel: "basic",
      rateLimitModel: "tokenBucket",
      supportsBatchContent: false,
      supportsBatchChannels: false,
      supportsSearch: false,
    });
    plugin[Symbol.dispose]();
  });

  it("throws on missing credentials", () => {
    expect(() =>
      createTwitCastingPlugin({ clientId: "", clientSecret: "s", fetch: createMockFetch([]) }),
    ).toThrow("clientId and clientSecret are required");
    expect(() =>
      createTwitCastingPlugin({ clientId: "id", clientSecret: "", fetch: createMockFetch([]) }),
    ).toThrow("clientId and clientSecret are required");
  });

  it("throws ValidationError for whitespace-only credentials", () => {
    expect(() =>
      createTwitCastingPlugin({
        clientId: "  ",
        clientSecret: "secret",
        fetch: createMockFetch([]),
      }),
    ).toThrow(ValidationError);
  });

  it("creates a plugin with correct name", () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([]),
    });

    expect(plugin.name).toBe("twitcasting");
    plugin[Symbol.dispose]();
  });

  it("matches TwitCasting URLs", () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([]),
    });

    expect(plugin.match("https://twitcasting.tv/user123/movie/789")).toEqual({
      platform: "twitcasting",
      type: "content",
      id: "789",
    });
    expect(plugin.match("https://twitcasting.tv/user123")).toEqual({
      platform: "twitcasting",
      type: "channel",
      id: "user123",
    });
    expect(plugin.match("https://youtube.com/watch?v=abc")).toBeNull();

    plugin[Symbol.dispose]();
  });

  it("getContent fetches a movie by ID", async () => {
    const mockMovie = {
      id: "m123",
      user_id: "u1",
      title: "Test Movie",
      subtitle: null,
      last_owner_comment: null,
      category: null,
      link: "https://twitcasting.tv/testuser/movie/m123",
      is_live: false,
      is_recorded: true,
      current_view_count: 0,
      total_view_count: 100,
      duration: 1800,
      created: 1741420800,
      large_thumbnail: "https://img.tv/thumb.jpg",
      small_thumbnail: "https://img.tv/thumb_s.jpg",
    };

    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([
        {
          status: 200,
          body: { movie: mockMovie, broadcaster: mockUser },
        },
      ]),
    });

    const content = await plugin.getContent("m123");
    expect(content.type).toBe("video");
    expect(content.id).toBe("m123");
    expect(content.platform).toBe("twitcasting");

    plugin[Symbol.dispose]();
  });

  it("getChannel fetches user info", async () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { user: mockUser } }]),
    });

    const channel = await plugin.getChannel("testuser");
    expect(channel.name).toBe("TestUser");
    expect(channel.platform).toBe("twitcasting");

    plugin[Symbol.dispose]();
  });

  it("getLiveStreams returns empty when not live", async () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([
        {
          status: 200,
          body: { user: { ...mockUser, is_live: false } },
        },
      ]),
    });

    const streams = await plugin.getLiveStreams("u1");
    expect(streams).toHaveLength(0);

    plugin[Symbol.dispose]();
  });

  it("getLiveStreams returns stream when live", async () => {
    const liveMovie = {
      id: "m456",
      user_id: "u1",
      title: "Live Now!",
      subtitle: null,
      last_owner_comment: null,
      category: null,
      link: "https://twitcasting.tv/testuser/movie/m456",
      is_live: true,
      is_recorded: false,
      current_view_count: 300,
      total_view_count: 300,
      duration: 0,
      created: 1741420800,
      large_thumbnail: "https://img.tv/live.jpg",
      small_thumbnail: "https://img.tv/live_s.jpg",
    };

    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([
        {
          status: 200,
          body: { user: { ...mockUser, is_live: true } },
        },
        { status: 200, body: { movie: liveMovie } },
      ]),
    });

    const streams = await plugin.getLiveStreams("u1");
    expect(streams).toHaveLength(1);
    expect(streams[0]!.type).toBe("live");
    expect(streams[0]!.viewerCount).toBe(300);

    plugin[Symbol.dispose]();
  });

  it("includes X-Api-Version header in requests", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: { user: mockUser } }]);

    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });

    await plugin.getChannel("testuser");

    const calls = (fetchFn as ReturnType<typeof vi.fn>).mock.calls;
    const headers = (calls[0]?.[1] as RequestInit)?.headers as Record<string, string>;
    expect(headers["X-Api-Version"]).toBe("2.0");

    plugin[Symbol.dispose]();
  });

  it("resolveArchive returns video when movie is no longer live", async () => {
    const archivedMovie = {
      id: "m123",
      user_id: "u1",
      title: "Past Stream",
      subtitle: null,
      last_owner_comment: null,
      category: null,
      link: "https://twitcasting.tv/testuser/movie/m123",
      is_live: false,
      is_recorded: true,
      current_view_count: 0,
      total_view_count: 500,
      duration: 3600,
      created: 1741420800,
      large_thumbnail: "https://img.tv/thumb.jpg",
      small_thumbnail: "https://img.tv/thumb_s.jpg",
    };

    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([
        { status: 200, body: { movie: archivedMovie, broadcaster: mockUser } },
      ]),
    });

    const live = {
      id: "m123",
      platform: "twitcasting",
      title: "Live",
      url: "https://twitcasting.tv/testuser/movie/m123",
      thumbnail: { url: "https://img.tv/thumb.jpg", width: 640, height: 360 },
      channel: { id: "u1", name: "TestUser", url: "https://twitcasting.tv/testuser" },
      sessionId: "m123",
      type: "live" as const,
      viewerCount: 100,
      startedAt: new Date(1741420800 * 1000),
      raw: {},
    };

    const archive = await plugin.resolveArchive!(live);
    expect(archive).not.toBeNull();
    expect(archive!.type).toBe("video");
    expect(archive!.id).toBe("m123");

    plugin[Symbol.dispose]();
  });

  it("resolveArchive returns null when still live", async () => {
    const liveMovie = {
      id: "m456",
      user_id: "u1",
      title: "Still Live",
      subtitle: null,
      last_owner_comment: null,
      category: null,
      link: "https://twitcasting.tv/testuser/movie/m456",
      is_live: true,
      is_recorded: false,
      current_view_count: 300,
      total_view_count: 300,
      duration: 0,
      created: 1741420800,
      large_thumbnail: "https://img.tv/live.jpg",
      small_thumbnail: "https://img.tv/live_s.jpg",
    };

    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { movie: liveMovie, broadcaster: mockUser } }]),
    });

    const live = {
      id: "m456",
      platform: "twitcasting",
      title: "Live",
      url: "https://twitcasting.tv/testuser/movie/m456",
      thumbnail: { url: "https://img.tv/live.jpg", width: 640, height: 360 },
      channel: { id: "u1", name: "TestUser", url: "https://twitcasting.tv/testuser" },
      sessionId: "m456",
      type: "live" as const,
      viewerCount: 300,
      startedAt: new Date(1741420800 * 1000),
      raw: {},
    };

    const archive = await plugin.resolveArchive!(live);
    expect(archive).toBeNull();

    plugin[Symbol.dispose]();
  });
});
