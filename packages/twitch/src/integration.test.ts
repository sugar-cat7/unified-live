import { Content, UnifiedClient } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTwitchPlugin } from "./plugin";

const createMockFetch = (
  handler: (url: string) => { body: unknown; status?: number },
): typeof globalThis.fetch => {
  return vi.fn(async (input: string | URL | Request) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    // Handle token endpoint
    if (url.includes("id.twitch.tv/oauth2/token")) {
      return new Response(
        JSON.stringify({ access_token: "test-token", expires_in: 5000000, token_type: "bearer" }),
        { status: 200 },
      );
    }
    const { body, status } = handler(url);
    return new Response(JSON.stringify(body), {
      status: status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
};

const sampleVideoResponse = {
  data: [
    {
      id: "12345",
      stream_id: "s1",
      user_id: "u1",
      user_login: "testuser",
      user_name: "TestUser",
      title: "Test Stream",
      duration: "2h0m0s",
      view_count: 5000,
      created_at: "2026-01-01T00:00:00Z",
      published_at: "2026-01-01T00:00:00Z",
      thumbnail_url: "https://img.tv/thumb-%{width}x%{height}.jpg",
      type: "archive",
      url: "https://www.twitch.tv/videos/12345",
    },
  ],
};

describe("Twitch Integration", () => {
  let client: ReturnType<typeof UnifiedClient.create>;

  afterEach(() => {
    client?.[Symbol.dispose]();
  });

  it("full consumer flow: UnifiedClient.create -> getContent by URL", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleVideoResponse }));
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContent("https://www.twitch.tv/videos/12345");

    expect(content.id).toBe("12345");
    expect(content.platform).toBe("twitch");
    expect(content.type).toBe("video");
    expect(content.title).toBe("Test Stream");

    if (Content.isVideo(content)) {
      expect(content.duration).toBe(7200);
      expect(content.viewCount).toBe(5000);
    }
  });

  it("URL matching via client.match()", () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const resolved = client.match("https://www.twitch.tv/videos/12345");
    expect(resolved).toEqual({ platform: "twitch", type: "content", id: "12345" });

    expect(client.match("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("getContentById bypasses URL matching", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleVideoResponse }));
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContentById("twitch", "12345");
    expect(content.id).toBe("12345");
  });

  it("[Symbol.dispose] cleans up all resources", () => {
    const plugin = createTwitchPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });
    client[Symbol.dispose]();
  });
});
