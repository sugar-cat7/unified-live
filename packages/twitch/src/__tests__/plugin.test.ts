import { describe, expect, it, vi } from "vitest";
import { createTwitchPlugin } from "../plugin";

function createMockFetch(
  responses: Array<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch {
  let callIndex = 0;
  return vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    // Handle token endpoint
    if (url.includes("id.twitch.tv/oauth2/token")) {
      return new Response(
        JSON.stringify({
          access_token: "test-token",
          expires_in: 5000000,
          token_type: "bearer",
        }),
        { status: 200 },
      );
    }

    const r = responses[callIndex];
    if (!r) throw new Error(`Unexpected fetch call #${callIndex}`);
    callIndex++;
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: r.headers,
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("createTwitchPlugin", () => {
  it("creates a plugin with correct name", () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([]),
    });

    expect(plugin.name).toBe("twitch");
    plugin.dispose();
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

    plugin.dispose();
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
    expect(content.type).toBe("video");
    expect(content.id).toBe("v123");
    expect(content.platform).toBe("twitch");

    plugin.dispose();
  });

  it("getChannel fetches user info", async () => {
    const mockUser = {
      id: "u1",
      login: "testuser",
      display_name: "TestUser",
      profile_image_url: "https://img.tv/user.png",
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockUser] } }]),
    });

    const channel = await plugin.getChannel("testuser");
    expect(channel.name).toBe("TestUser");
    expect(channel.platform).toBe("twitch");

    plugin.dispose();
  });

  it("getLiveStreams returns live streams", async () => {
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
    };

    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch([{ status: 200, body: { data: [mockStream] } }]),
    });

    const streams = await plugin.getLiveStreams("u1");
    expect(streams).toHaveLength(1);
    expect(streams[0]!.type).toBe("live");
    expect(streams[0]!.viewerCount).toBe(500);

    plugin.dispose();
  });

  it("getVideos returns paginated videos", async () => {
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

    const page = await plugin.getVideos("u1");
    expect(page.items).toHaveLength(1);
    expect(page.items[0]!.type).toBe("video");
    expect(page.cursor).toBe("next-page");

    plugin.dispose();
  });

  it("includes Client-Id header in requests", async () => {
    const fetchFn = createMockFetch([{ status: 200, body: { data: [] } }]);

    const plugin = createTwitchPlugin({
      clientId: "my-client-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });

    await plugin.getLiveStreams("u1");

    // Find the API call (not the token call)
    const calls = (fetchFn as ReturnType<typeof vi.fn>).mock.calls;
    const apiCall = calls.find(
      (c) => !(c[0] as string).includes("oauth2/token"),
    );
    const headers = (apiCall?.[1] as RequestInit)?.headers as Record<
      string,
      string
    >;
    expect(headers["Client-Id"]).toBe("my-client-id");

    plugin.dispose();
  });
});
