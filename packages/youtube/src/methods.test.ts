import { NotFoundError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import {
  youtubeGetChannel,
  youtubeGetContent,
  youtubeGetContents,
  youtubeGetLiveStreams,
  youtubeGetVideos,
  youtubeResolveArchive,
  youtubeSearch,
} from "./methods";
import { createMockRest } from "./test-helpers";

const sampleVideoItem = {
  id: "dQw4w9WgXcQ",
  snippet: {
    title: "Test Video",
    channelId: "UCtest",
    channelTitle: "Test Channel",
    publishedAt: "2024-01-01T00:00:00Z",
    thumbnails: {
      high: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", width: 480, height: 360 },
    },
    liveBroadcastContent: "none",
  },
  contentDetails: { duration: "PT3M32S" },
  statistics: { viewCount: "1000000" },
};

const sampleLiveItem = {
  ...sampleVideoItem,
  id: "live123",
  snippet: {
    ...sampleVideoItem.snippet,
    liveBroadcastContent: "live",
  },
  liveStreamingDetails: {
    actualStartTime: "2024-06-01T10:00:00Z",
    concurrentViewers: "5000",
  },
};

const sampleChannelItem = {
  id: "UCtest",
  snippet: {
    title: "Test Channel",
    thumbnails: {
      high: { url: "https://yt3.googleusercontent.com/channel.jpg", width: 800, height: 800 },
    },
  },
  contentDetails: {
    relatedPlaylists: { uploads: "UUtest" },
  },
};

describe("youtubeGetContent", () => {
  it("returns Content for a valid video ID", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [sampleVideoItem] },
    });

    const result = await youtubeGetContent(rest, "dQw4w9WgXcQ");
    expect(result.type).toBe("video");
    expect(result.id).toBe("dQw4w9WgXcQ");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/videos",
        query: expect.objectContaining({ id: "dQw4w9WgXcQ" }),
        bucketId: "videos:list",
      }),
    );
  });

  it("throws NotFoundError when video doesn't exist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    await expect(youtubeGetContent(rest, "missing")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when items is undefined", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {},
    });

    await expect(youtubeGetContent(rest, "missing")).rejects.toThrow(NotFoundError);
  });
});

describe("youtubeGetChannel", () => {
  it.each([
    { id: "UCtest", expectedKey: "id", desc: "channel ID (UC prefix)" },
    { id: "@handle", expectedKey: "forHandle", desc: "handle (@ prefix)" },
    { id: "username", expectedKey: "forUsername", desc: "legacy username" },
  ])("uses $expectedKey param for $desc", async ({ id, expectedKey }) => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [sampleChannelItem] },
    });

    await youtubeGetChannel(rest, id);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ [expectedKey]: id }),
      }),
    );
  });

  it("throws NotFoundError when channel doesn't exist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    await expect(youtubeGetChannel(rest, "UCmissing")).rejects.toThrow(NotFoundError);
  });
});

describe("youtubeGetLiveStreams", () => {
  it("returns empty array when no live streams", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    const result = await youtubeGetLiveStreams(rest, "UCtest");
    expect(result).toEqual([]);
    expect(rest.request).toHaveBeenCalledTimes(1); // Only search, no videos fetch
  });

  it("fetches video details for search results", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // search endpoint
        return {
          status: 200,
          headers: new Headers(),
          data: { items: [{ id: { videoId: "live123" } }] },
        };
      }
      // videos endpoint
      return {
        status: 200,
        headers: new Headers(),
        data: { items: [sampleLiveItem] },
      };
    });

    const result = await youtubeGetLiveStreams(rest, "UCtest");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("live");
    expect(rest.request).toHaveBeenCalledTimes(2);
  });

  it("filters out non-live items from video details", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          status: 200,
          headers: new Headers(),
          data: { items: [{ id: { videoId: "v1" } }, { id: { videoId: "v2" } }] },
        };
      }
      // Return one live and one regular video — only live should pass the filter
      return {
        status: 200,
        headers: new Headers(),
        data: { items: [sampleLiveItem, sampleVideoItem] },
      };
    });

    const result = await youtubeGetLiveStreams(rest, "UCtest");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("live");
  });

  it("returns empty when items is undefined", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {},
    });

    const result = await youtubeGetLiveStreams(rest, "UCtest");
    expect(result).toEqual([]);
  });
});

describe("youtubeGetVideos", () => {
  it("throws NotFoundError when channel doesn't exist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    await expect(youtubeGetVideos(rest, "UCmissing")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when no uploads playlist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [{ id: "UCtest", contentDetails: { relatedPlaylists: {} } }] },
    });

    await expect(youtubeGetVideos(rest, "UCtest")).rejects.toThrow(NotFoundError);
  });

  it("returns paginated videos", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // channels endpoint
        return { status: 200, headers: new Headers(), data: { items: [sampleChannelItem] } };
      }
      if (callCount === 2) {
        // playlistItems endpoint
        return {
          status: 200,
          headers: new Headers(),
          data: {
            items: [{ snippet: { resourceId: { videoId: "dQw4w9WgXcQ" } } }],
            nextPageToken: "next123",
            pageInfo: { totalResults: 50 },
          },
        };
      }
      // videos endpoint
      return { status: 200, headers: new Headers(), data: { items: [sampleVideoItem] } };
    });

    const result = await youtubeGetVideos(rest, "UCtest");
    expect(result.items).toHaveLength(1);
    expect(result.cursor).toBe("next123");
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(50);
  });

  it("passes cursor as pageToken", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { items: [sampleChannelItem] } };
      }
      if (callCount === 2) {
        return { status: 200, headers: new Headers(), data: { items: [] } };
      }
      return { status: 200, headers: new Headers(), data: { items: [] } };
    });

    await youtubeGetVideos(rest, "UCtest", "cursorABC");
    const secondCall = (rest.request as ReturnType<typeof vi.fn>).mock.calls[1]?.[0];
    expect(secondCall.query.pageToken).toBe("cursorABC");
  });

  it("handles undefined nextPageToken on last page", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { items: [sampleChannelItem] } };
      }
      if (callCount === 2) {
        return {
          status: 200,
          headers: new Headers(),
          data: {
            items: [{ snippet: { resourceId: { videoId: "dQw4w9WgXcQ" } } }],
            pageInfo: { totalResults: 1 },
            // No nextPageToken = last page
          },
        };
      }
      return { status: 200, headers: new Headers(), data: { items: [sampleVideoItem] } };
    });

    const result = await youtubeGetVideos(rest, "UCtest");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });

  it("filters out non-video (live) items from video details", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { items: [sampleChannelItem] } };
      }
      if (callCount === 2) {
        return {
          status: 200,
          headers: new Headers(),
          data: {
            items: [
              { snippet: { resourceId: { videoId: "dQw4w9WgXcQ" } } },
              { snippet: { resourceId: { videoId: "live123" } } },
            ],
          },
        };
      }
      // Return one regular video and one live — only video should pass the filter
      return {
        status: 200,
        headers: new Headers(),
        data: { items: [sampleVideoItem, sampleLiveItem] },
      };
    });

    const result = await youtubeGetVideos(rest, "UCtest");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
    expect(result.total).toBe(0); // no pageInfo means fallback to 0
  });

  it("returns empty page when no playlist items", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { items: [sampleChannelItem] } };
      }
      return { status: 200, headers: new Headers(), data: { items: [] } };
    });

    const result = await youtubeGetVideos(rest, "UCtest");
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

const createSampleVideoItem = (id: string) => ({
  ...sampleVideoItem,
  id,
});

describe("youtubeGetContents", () => {
  it("fetches multiple videos in one API call", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleVideoItem("v1"), createSampleVideoItem("v2")] },
    });
    const result = await youtubeGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(2);
    expect(result.errors.size).toBe(0);
  });

  it("puts missing IDs in errors map", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleVideoItem("v1")] },
    });
    const result = await youtubeGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(1);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("v2")).toBeInstanceOf(NotFoundError);
  });

  it("chunks for >50 IDs", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(
      async (req: { query: { id: string } }) => {
        callCount++;
        const ids = req.query.id.split(",");
        return {
          status: 200,
          headers: new Headers(),
          data: { items: ids.map((id: string) => createSampleVideoItem(id)) },
        };
      },
    );
    const ids = Array.from({ length: 60 }, (_, i) => `v${i}`);
    const result = await youtubeGetContents(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(60);
  });
});

describe("youtubeSearch", () => {
  it("searches with query and status", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: { items: [{ id: { videoId: "v1" } }] },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: { items: [sampleLiveItem] },
      });
    const result = await youtubeSearch(rest, { query: "vspo", status: "live" });
    expect(result.items.length).toBe(1);
  });

  it("returns empty when no results", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    const result = await youtubeSearch(rest, { query: "nothing" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

describe("youtubeResolveArchive", () => {
  it("returns Video when stream has ended", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [sampleVideoItem] },
    });

    const live = {
      id: "dQw4w9WgXcQ",
      platform: "youtube",
      title: "Test",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: { url: "https://example.com/t.jpg", width: 480, height: 360 },
      channel: { id: "UCtest", name: "Test", url: "https://youtube.com/channel/UCtest" },
      sessionId: "dQw4w9WgXcQ",
      type: "live" as const,
      viewerCount: 100,
      startedAt: new Date(),
      raw: {},
    };

    const result = await youtubeResolveArchive(rest, live);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("video");
  });

  it("returns null when stream is still live", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [sampleLiveItem] },
    });

    const live = {
      id: "live123",
      platform: "youtube",
      title: "Test",
      url: "https://youtube.com/watch?v=live123",
      thumbnail: { url: "https://example.com/t.jpg", width: 480, height: 360 },
      channel: { id: "UCtest", name: "Test", url: "https://youtube.com/channel/UCtest" },
      sessionId: "live123",
      type: "live" as const,
      viewerCount: 5000,
      startedAt: new Date(),
      raw: {},
    };

    const result = await youtubeResolveArchive(rest, live);
    expect(result).toBeNull();
  });
});
