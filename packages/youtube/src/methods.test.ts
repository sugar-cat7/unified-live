import { NotFoundError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import {
  youtubeBatchGetChannels,
  youtubeGetChannel,
  youtubeGetContent,
  youtubeBatchGetContents,
  youtubeListBroadcasts,
  youtubeListArchives,
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
    expect(result.type).toBe("archive");
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
  it("requests snippet,contentDetails,statistics parts", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [sampleChannelItem] },
    });

    await youtubeGetChannel(rest, "UCtest");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ part: "snippet,contentDetails,statistics" }),
      }),
    );
  });

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

describe("youtubeListBroadcasts", () => {
  it("returns empty array when no broadcasts", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    const result = await youtubeListBroadcasts(rest, "UCtest");
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

    const result = await youtubeListBroadcasts(rest, "UCtest");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("broadcast");
    expect(rest.request).toHaveBeenCalledTimes(2);
  });

  it("filters out non-broadcast items from video details", async () => {
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
      // Return one broadcast and one regular archive — only broadcast should pass the filter
      return {
        status: 200,
        headers: new Headers(),
        data: { items: [sampleLiveItem, sampleVideoItem] },
      };
    });

    const result = await youtubeListBroadcasts(rest, "UCtest");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("broadcast");
  });

  it("returns empty when items is undefined", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {},
    });

    const result = await youtubeListBroadcasts(rest, "UCtest");
    expect(result).toEqual([]);
  });

  it("returns empty when video items is empty after fetching details", async () => {
    const rest = createMockRest();
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          status: 200,
          headers: new Headers(),
          data: { items: [{ id: { videoId: "v1" } }] },
        };
      }
      // videos endpoint returns empty items (undefined)
      return {
        status: 200,
        headers: new Headers(),
        data: {},
      };
    });

    const result = await youtubeListBroadcasts(rest, "UCtest");
    expect(result).toEqual([]);
  });
});

describe("youtubeListArchives", () => {
  it("throws NotFoundError when channel doesn't exist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    await expect(youtubeListArchives(rest, "UCmissing")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when no uploads playlist", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [{ id: "UCtest", contentDetails: { relatedPlaylists: {} } }] },
    });

    await expect(youtubeListArchives(rest, "UCtest")).rejects.toThrow(NotFoundError);
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

    const result = await youtubeListArchives(rest, "UCtest");
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

    await youtubeListArchives(rest, "UCtest", "cursorABC");
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

    const result = await youtubeListArchives(rest, "UCtest");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });

  it("filters out non-archive (broadcast) items from video details", async () => {
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
      // Return one regular archive and one broadcast — only archive should pass the filter
      return {
        status: 200,
        headers: new Headers(),
        data: { items: [sampleVideoItem, sampleLiveItem] },
      };
    });

    const result = await youtubeListArchives(rest, "UCtest");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("archive");
    expect(result.total).toBe(0); // no pageInfo means fallback to 0
  });

  it("returns empty archives when video items is undefined after fetching details", async () => {
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
          },
        };
      }
      // videos endpoint returns undefined items
      return { status: 200, headers: new Headers(), data: {} };
    });

    const result = await youtubeListArchives(rest, "UCtest");
    expect(result.items).toEqual([]);
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

    const result = await youtubeListArchives(rest, "UCtest");
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

const createSampleVideoItem = (id: string) => ({
  ...sampleVideoItem,
  id,
});

describe("youtubeBatchGetContents", () => {
  it("fetches multiple videos in one API call", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleVideoItem("v1"), createSampleVideoItem("v2")] },
    });
    const result = await youtubeBatchGetContents(rest, ["v1", "v2"]);
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
    const result = await youtubeBatchGetContents(rest, ["v1", "v2"]);
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
    const result = await youtubeBatchGetContents(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(60);
  });

  it("skips items without id and marks requested id as not found", async () => {
    const rest = createMockRest();
    const itemWithoutId = { ...sampleVideoItem, id: undefined };
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [itemWithoutId] },
    });
    const result = await youtubeBatchGetContents(rest, ["v1"]);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("v1")).toBeInstanceOf(NotFoundError);
  });

  it("handles undefined items in API response", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {},
    });
    const result = await youtubeBatchGetContents(rest, ["v1"]);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("v1")).toBeInstanceOf(NotFoundError);
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

  it("passes channelId to YouTube search API", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    await youtubeSearch(rest, { channelId: "UC123", status: "live" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ channelId: "UC123", eventType: "live" }),
      }),
    );
  });

  it("passes safeSearch to YouTube search API", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    await youtubeSearch(rest, { query: "test", safeSearch: "strict" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ q: "test", safeSearch: "strict" }),
      }),
    );
  });

  it("passes languageCode as relevanceLanguage to YouTube search API", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    await youtubeSearch(rest, { query: "test", languageCode: "ja" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ q: "test", relevanceLanguage: "ja" }),
      }),
    );
  });

  it("passes order to YouTube search API", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    await youtubeSearch(rest, { query: "test", order: "date" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ q: "test", order: "date" }),
      }),
    );
  });

  it("passes limit as maxResults (capped at 50) and cursor as pageToken", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });
    await youtubeSearch(rest, { query: "test", limit: 100, cursor: "TOKEN_ABC" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ maxResults: "50", pageToken: "TOKEN_ABC" }),
      }),
    );
  });

  it("returns empty when search results have no valid videoIds", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [{ id: {} }, { id: { videoId: undefined } }] },
    });
    const result = await youtubeSearch(rest, { query: "test" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    // Only one call — no second call for videos since videoIds is empty
    expect(rest.request).toHaveBeenCalledTimes(1);
  });

  it("handles undefined items in video details response", async () => {
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
        data: {},
      });
    const result = await youtubeSearch(rest, { query: "test" });
    expect(result.items).toEqual([]);
    expect(rest.request).toHaveBeenCalledTimes(2);
  });

  it("fetches video details and returns paginated results with cursor", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: {
          items: [{ id: { videoId: "v1" } }, { id: { videoId: "v2" } }],
          nextPageToken: "PAGE2",
          pageInfo: { totalResults: 100 },
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: { items: [createSampleVideoItem("v1"), createSampleVideoItem("v2")] },
      });

    const result = await youtubeSearch(rest, { query: "music" });
    expect(result.items).toHaveLength(2);
    expect(result.cursor).toBe("PAGE2");
    expect(result.total).toBe(100);
    expect(result.hasMore).toBe(true);
    expect(rest.request).toHaveBeenCalledTimes(2);
  });
});

const createSampleChannelItem = (id: string) => ({
  ...sampleChannelItem,
  id,
});

describe("youtubeBatchGetChannels", () => {
  it("fetches multiple channels in one API call", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleChannelItem("UC1"), createSampleChannelItem("UC2")] },
    });
    const result = await youtubeBatchGetChannels(rest, ["UC1", "UC2"]);
    expect(result.values.size).toBe(2);
    expect(result.errors.size).toBe(0);
  });

  it("puts missing IDs in errors map", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleChannelItem("UC1")] },
    });
    const result = await youtubeBatchGetChannels(rest, ["UC1", "UC2"]);
    expect(result.values.size).toBe(1);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("UC2")).toBeInstanceOf(NotFoundError);
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
          data: { items: ids.map((id: string) => createSampleChannelItem(id)) },
        };
      },
    );
    const ids = Array.from({ length: 60 }, (_, i) => `UC${i}`);
    const result = await youtubeBatchGetChannels(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(60);
  });

  it("skips items without id and marks requested id as not found", async () => {
    const rest = createMockRest();
    const itemWithoutId = { ...sampleChannelItem, id: undefined };
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [itemWithoutId] },
    });
    const result = await youtubeBatchGetChannels(rest, ["UC1"]);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("UC1")).toBeInstanceOf(NotFoundError);
  });

  it("sends comma-separated IDs with channels:list bucketId", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [createSampleChannelItem("UC1")] },
    });
    await youtubeBatchGetChannels(rest, ["UC1"]);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/channels",
        query: expect.objectContaining({
          part: "snippet,contentDetails,statistics",
          id: "UC1",
        }),
        bucketId: "channels:list",
      }),
    );
  });

  it("returns empty maps for empty IDs array", async () => {
    const rest = createMockRest();
    const result = await youtubeBatchGetChannels(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("handles undefined items in API response", async () => {
    const rest = createMockRest();
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {},
    });
    const result = await youtubeBatchGetChannels(rest, ["UC1"]);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("UC1")).toBeInstanceOf(NotFoundError);
  });
});

describe("youtubeResolveArchive", () => {
  it("returns Archive when stream has ended", async () => {
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
      description: "",
      tags: [] as string[],
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: { url: "https://example.com/t.jpg", width: 480, height: 360 },
      channel: { id: "UCtest", name: "Test", url: "https://youtube.com/channel/UCtest" },
      sessionId: "dQw4w9WgXcQ",
      type: "broadcast" as const,
      viewerCount: 100,
      startedAt: new Date(),
      raw: {},
    };

    const result = await youtubeResolveArchive(rest, live);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("archive");
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
      description: "",
      tags: [] as string[],
      url: "https://youtube.com/watch?v=live123",
      thumbnail: { url: "https://example.com/t.jpg", width: 480, height: 360 },
      channel: { id: "UCtest", name: "Test", url: "https://youtube.com/channel/UCtest" },
      sessionId: "live123",
      type: "broadcast" as const,
      viewerCount: 5000,
      startedAt: new Date(),
      raw: {},
    };

    const result = await youtubeResolveArchive(rest, live);
    expect(result).toBeNull();
  });
});
