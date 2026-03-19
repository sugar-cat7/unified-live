import { NotFoundError } from "@unified-live/core";
import { describe, expect, it } from "vitest";
import {
  twitchGetContent,
  twitchGetContents,
  twitchGetChannel,
  twitchGetLiveStreams,
  twitchGetLiveStreamsBatch,
  twitchGetVideos,
  twitchResolveArchive,
  twitchSearch,
} from "./methods";
import { createMockRest } from "./test-helpers";

const sampleStream = {
  id: "s1",
  user_id: "u1",
  user_login: "testuser",
  user_name: "TestUser",
  game_name: "Just Chatting",
  title: "Live Stream",
  viewer_count: 100,
  started_at: "2024-01-01T00:00:00Z",
  thumbnail_url: "https://static-cdn.jtvnw.net/previews-ttv/live_%{width}x%{height}.jpg",
  type: "live" as const,
};

const sampleVideo = {
  id: "v1",
  stream_id: "s1",
  user_id: "u1",
  user_login: "testuser",
  user_name: "TestUser",
  title: "Past Stream",
  duration: "1h30m0s",
  view_count: 5000,
  created_at: "2024-01-01T00:00:00Z",
  published_at: "2024-01-01T01:30:00Z",
  thumbnail_url: "https://static-cdn.jtvnw.net/cf_vods/%{width}x%{height}/thumb.jpg",
  type: "archive" as const,
  url: "https://www.twitch.tv/videos/v1",
};

const sampleUser = {
  id: "u1",
  login: "testuser",
  display_name: "TestUser",
  profile_image_url: "https://static-cdn.jtvnw.net/jtv_user_pictures/user.png",
};

describe("twitchGetContent", () => {
  it("returns Video for a valid video ID", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchGetContent(rest, "v1");
    expect(result.type).toBe("video");
    expect(result.id).toBe("v1");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/videos", query: { id: "v1" } }),
    );
  });

  it("throws NotFoundError when video doesn't exist", async () => {
    const rest = createMockRest({ data: [] });
    await expect(twitchGetContent(rest, "missing")).rejects.toThrow(NotFoundError);
  });
});

describe("twitchGetChannel", () => {
  it("uses id param for numeric IDs", async () => {
    const rest = createMockRest({ data: [sampleUser] });
    await twitchGetChannel(rest, "12345");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ query: { id: "12345" } }));
  });

  it("uses login param for non-numeric IDs", async () => {
    const rest = createMockRest({ data: [sampleUser] });
    await twitchGetChannel(rest, "testuser");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({ query: { login: "testuser" } }),
    );
  });

  it("throws NotFoundError when user doesn't exist", async () => {
    const rest = createMockRest({ data: [] });
    await expect(twitchGetChannel(rest, "nobody")).rejects.toThrow(NotFoundError);
  });
});

describe("twitchGetLiveStreams", () => {
  it("returns live streams filtered by type", async () => {
    const rest = createMockRest({ data: [sampleStream, { ...sampleStream, type: "" }] });
    const result = await twitchGetLiveStreams(rest, "u1");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("live");
  });

  it("returns empty array when not live", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchGetLiveStreams(rest, "u1");
    expect(result).toEqual([]);
  });
});

describe("twitchGetVideos", () => {
  it("returns paginated videos with cursor", async () => {
    const rest = createMockRest({
      data: [sampleVideo],
      pagination: { cursor: "next123" },
    });
    const result = await twitchGetVideos(rest, "u1");
    expect(result.items).toHaveLength(1);
    expect(result.cursor).toBe("next123");
    expect(result.hasMore).toBe(true);
  });

  it("passes cursor as after param", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchGetVideos(rest, "u1", "cursor123");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ after: "cursor123" }),
      }),
    );
  });

  it("has hasMore=false when no cursor returned", async () => {
    const rest = createMockRest({ data: [sampleVideo], pagination: {} });
    const result = await twitchGetVideos(rest, "u1");
    expect(result.hasMore).toBe(false);
  });

  it("handles undefined pagination object", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchGetVideos(rest, "u1");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });

  it("handles pagination with undefined cursor (last page)", async () => {
    const rest = createMockRest({ data: [sampleVideo], pagination: {} });
    const result = await twitchGetVideos(rest, "u1");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });
});

describe("twitchResolveArchive", () => {
  it("returns null when live has no sessionId", async () => {
    const rest = createMockRest({});
    const result = await twitchResolveArchive(rest, {
      id: "s1",
      platform: "twitch",
      title: "",
      description: "",
      tags: [] as string[],
      url: "https://twitch.tv/test",
      thumbnail: { url: "", width: 1, height: 1 },
      channel: { id: "u1", name: "", url: "" },
      type: "live",
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    });
    expect(result).toBeNull();
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("returns Video when matching archive found", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchResolveArchive(rest, {
      id: "s1",
      platform: "twitch",
      title: "",
      description: "",
      tags: [] as string[],
      url: "https://twitch.tv/test",
      thumbnail: { url: "", width: 1, height: 1 },
      channel: { id: "u1", name: "", url: "" },
      sessionId: "s1",
      type: "live",
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("video");
  });

  it("returns null when no matching archive", async () => {
    const rest = createMockRest({ data: [{ ...sampleVideo, stream_id: "other" }] });
    const result = await twitchResolveArchive(rest, {
      id: "s1",
      platform: "twitch",
      title: "",
      description: "",
      tags: [] as string[],
      url: "https://twitch.tv/test",
      thumbnail: { url: "", width: 1, height: 1 },
      channel: { id: "u1", name: "", url: "" },
      sessionId: "s1",
      type: "live",
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    });
    expect(result).toBeNull();
  });
});

const createSampleVideo = (id: string) => ({
  ...sampleVideo,
  id,
  url: `https://www.twitch.tv/videos/${id}`,
});

describe("twitchGetContents", () => {
  it("fetches multiple videos in one API call", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1"), createSampleVideo("v2")] });
    const result = await twitchGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(2);
    expect(result.errors.size).toBe(0);
  });

  it("puts missing IDs in errors map", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1")] });
    const result = await twitchGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(1);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("v2")).toBeInstanceOf(NotFoundError);
  });

  it("passes array of IDs in query", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1"), createSampleVideo("v2")] });
    await twitchGetContents(rest, ["v1", "v2"]);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/videos",
        query: { id: ["v1", "v2"] },
      }),
    );
  });

  it("chunks for >100 IDs", async () => {
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof import("vitest").vi.fn>).mockImplementation(
      async (req: { query: { id: string[] } }) => {
        callCount++;
        const ids = req.query.id;
        return {
          status: 200,
          headers: new Headers(),
          data: { data: ids.map((id: string) => createSampleVideo(id)) },
        };
      },
    );
    const ids = Array.from({ length: 150 }, (_, i) => `v${i}`);
    const result = await twitchGetContents(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(150);
  });

  it("returns empty maps for empty IDs array", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchGetContents(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});

describe("twitchGetLiveStreamsBatch", () => {
  it("fetches live streams for multiple channels", async () => {
    const rest = createMockRest({ data: [sampleStream] });
    const result = await twitchGetLiveStreamsBatch(rest, [sampleStream.user_id, "other_user"]);
    expect(result.values.get(sampleStream.user_id)).toHaveLength(1);
    expect(result.values.get("other_user")).toEqual([]);
    expect(result.errors.size).toBe(0);
  });

  it("returns empty arrays for channels with no live streams", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchGetLiveStreamsBatch(rest, ["ch1", "ch2"]);
    expect(result.values.get("ch1")).toEqual([]);
    expect(result.values.get("ch2")).toEqual([]);
  });

  it("passes user_id as array for repeated params", async () => {
    const rest = createMockRest({ data: [] });
    await twitchGetLiveStreamsBatch(rest, ["u1", "u2"]);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ user_id: ["u1", "u2"] }),
      }),
    );
  });

  it("chunks for >100 channel IDs", async () => {
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof import("vitest").vi.fn>).mockImplementation(async () => {
      callCount++;
      return {
        status: 200,
        headers: new Headers(),
        data: { data: [] },
      };
    });
    const ids = Array.from({ length: 150 }, (_, i) => `u${i}`);
    const result = await twitchGetLiveStreamsBatch(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(150);
  });

  it("returns empty maps for empty channelIds array", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchGetLiveStreamsBatch(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});

const sampleSearchChannel = {
  id: "ch1",
  broadcaster_login: "livecaster",
  display_name: "LiveCaster",
  game_name: "Just Chatting",
  title: "Live Now!",
  is_live: true,
  started_at: "2024-06-01T10:00:00Z",
  thumbnail_url: "https://img.tv/ch1.jpg",
};

describe("twitchSearch", () => {
  it("searches live channels with query", async () => {
    const rest = createMockRest({
      data: [sampleSearchChannel],
      pagination: { cursor: "next123" },
    });
    const result = await twitchSearch(rest, { query: "gaming", status: "live" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("live");
    expect(result.cursor).toBe("next123");
    expect(result.hasMore).toBe(true);
  });

  it("passes query params correctly", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchSearch(rest, { query: "test", limit: 10, cursor: "abc" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/search/channels",
        query: {
          live_only: "true",
          query: "test",
          first: "10",
          after: "abc",
        },
      }),
    );
  });

  it("returns empty for upcoming status", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchSearch(rest, { query: "test", status: "upcoming" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("returns empty for ended status without channelId", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchSearch(rest, { query: "test", status: "ended" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("defaults to live_only=true when no status", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchSearch(rest, { query: "test" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ live_only: "true" }),
      }),
    );
  });

  it("filters out non-live channels from results", async () => {
    const rest = createMockRest({
      data: [sampleSearchChannel, { ...sampleSearchChannel, id: "ch2", is_live: false }],
    });
    const result = await twitchSearch(rest, { query: "test" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe("livecaster");
  });

  it("returns empty when no results", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    const result = await twitchSearch(rest, { query: "nothing" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it("fetches live streams by channelId", async () => {
    const rest = createMockRest({ data: [sampleStream] });
    const result = await twitchSearch(rest, { channelId: "u1", status: "live" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("live");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/streams" }));
  });

  it("fetches archives by channelId + ended", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchSearch(rest, { channelId: "u1", status: "ended" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/videos" }));
  });

  it("fetches live streams by channelId without status", async () => {
    const rest = createMockRest({ data: [sampleStream] });
    const result = await twitchSearch(rest, { channelId: "u1" });
    expect(result.items).toHaveLength(1);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/streams",
        query: expect.objectContaining({ user_id: "u1", type: "live" }),
      }),
    );
  });

  it("returns empty for channelId + upcoming", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchSearch(rest, { channelId: "u1", status: "upcoming" });
    expect(result.items).toEqual([]);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("uses /search/channels when both channelId and query are provided", async () => {
    const rest = createMockRest({ data: [sampleSearchChannel], pagination: {} });
    const result = await twitchSearch(rest, { channelId: "u1", query: "test" });
    expect(result.items).toHaveLength(1);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/search/channels" }),
    );
  });

  it("returns empty when no query and no channelId", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchSearch(rest, {});
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(rest.request).not.toHaveBeenCalled();
  });
});
