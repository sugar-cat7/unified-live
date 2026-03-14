import { Content, UnifiedClient } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createYouTubePlugin } from "../plugin";

/**
 * Integration test: Full consumer flow with mock fetch.
 * Tests the complete path: UnifiedClient.create -> createYouTubePlugin -> URL routing -> API call -> response mapping.
 */

function createMockFetch(
  handler: (url: string) => { body: unknown; status?: number },
): typeof globalThis.fetch {
  return vi.fn(async (input: string | URL | Request) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const { body, status } = handler(url);
    return new Response(JSON.stringify(body), {
      status: status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
}

const sampleVideoResponse = {
  items: [
    {
      id: "dQw4w9WgXcQ",
      snippet: {
        title: "Never Gonna Give You Up",
        channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
        channelTitle: "Rick Astley",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            width: 480,
            height: 360,
          },
        },
        liveBroadcastContent: "none",
        publishedAt: "2009-10-25T06:57:33Z",
      },
      contentDetails: { duration: "PT3M33S" },
      statistics: { viewCount: "1500000000" },
    },
  ],
  pageInfo: { totalResults: 1, resultsPerPage: 5 },
};

describe("YouTube Integration", () => {
  let client: ReturnType<typeof UnifiedClient.create>;

  afterEach(() => {
    client?.dispose();
  });

  it("full consumer flow: UnifiedClient.create -> getContent by URL", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleVideoResponse }));

    const plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContent(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );

    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(content.type).toBe("video");
    expect(content.title).toBe("Never Gonna Give You Up");
    expect(content.channel.name).toBe("Rick Astley");

    if (Content.isVideo(content)) {
      expect(content.duration).toBe(213); // 3*60 + 33
      expect(content.viewCount).toBe(1_500_000_000);
    }
  });

  it("URL matching via client.match()", () => {
    const plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    const resolved = client.match("https://youtu.be/dQw4w9WgXcQ");
    expect(resolved).toEqual({
      platform: "youtube",
      type: "content",
      id: "dQw4w9WgXcQ",
    });

    expect(client.match("https://twitch.tv/shroud")).toBeNull();
  });

  it("getContentById bypasses URL matching", async () => {
    const fetchFn = createMockFetch(() => ({ body: sampleVideoResponse }));

    const plugin = createYouTubePlugin({ apiKey: "test-key", fetch: fetchFn });
    client = UnifiedClient.create({ plugins: [plugin] });

    const content = await client.getContentById("youtube", "dQw4w9WgXcQ");
    expect(content.id).toBe("dQw4w9WgXcQ");
  });

  it("dispose cleans up all resources", () => {
    const plugin = createYouTubePlugin({
      apiKey: "test-key",
      fetch: createMockFetch(() => ({ body: {} })),
    });
    client = UnifiedClient.create({ plugins: [plugin] });

    // Should not throw
    client.dispose();
  });
});
