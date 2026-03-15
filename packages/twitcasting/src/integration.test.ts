import { Content, NotFoundError, UnifiedClient } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTwitCastingPlugin } from "./plugin";

const mockUser = {
  id: "u1",
  screen_id: "testuser",
  name: "TestUser",
  image: "https://img.twitcasting.tv/user.png",
  profile: "Hello",
  level: 5,
  is_live: false,
};

const createMockFetch = (
  handler: (url: string) => { body: unknown; status?: number },
): typeof globalThis.fetch => {
  return vi.fn(async (input: string | URL | Request) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const { body, status } = handler(url);
    return new Response(JSON.stringify(body), {
      status: status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
};

const sampleMovieResponse = {
  movie: {
    id: "123",
    user_id: "u1",
    title: "Test Stream",
    subtitle: null,
    last_owner_comment: null,
    category: null,
    link: "https://twitcasting.tv/testuser/movie/123",
    is_live: false,
    is_recorded: true,
    current_view_count: 0,
    total_view_count: 1000,
    duration: 3600,
    created: 1741420800,
    large_thumbnail: "https://img.tv/thumb.jpg",
    small_thumbnail: "https://img.tv/thumb_s.jpg",
  },
  broadcaster: mockUser,
};

describe("TwitCasting Integration", () => {
  let client: ReturnType<typeof UnifiedClient.create>;

  afterEach(() => {
    client?.[Symbol.dispose]();
  });

  it("full consumer flow: UnifiedClient.create -> getContent by URL", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleMovieResponse }));
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContent("https://twitcasting.tv/testuser/movie/123");

    expect(content.id).toBe("123");
    expect(content.platform).toBe("twitcasting");
    expect(content.type).toBe("video");
    expect(content.title).toBe("Test Stream");

    if (Content.isVideo(content)) {
      expect(content.duration).toBe(3600);
      expect(content.viewCount).toBe(1000);
    }
  });

  it("URL matching via client.match()", () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const resolved = client.match("https://twitcasting.tv/testuser/movie/789");
    expect(resolved).toEqual({ platform: "twitcasting", type: "content", id: "789" });

    expect(client.match("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("getContentById bypasses URL matching", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleMovieResponse }));
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContentById("twitcasting", "123");
    expect(content.id).toBe("123");
  });

  it("[Symbol.dispose] cleans up all resources", () => {
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });
    client[Symbol.dispose]();
  });

  it("getChannel throws NotFoundError for nonexistent user", async () => {
    const fetchFn = createMockFetch(() => ({ body: { user: null } }));
    const plugin = createTwitCastingPlugin({
      clientId: "test-id",
      clientSecret: "test-secret",
      fetch: fetchFn,
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    await expect(client.getChannel("twitcasting", "nonexistent")).rejects.toThrow(
      NotFoundError,
    );
  });
});
