import { NotFoundError } from "@unified-live/core";
import { describe, expect, it } from "vitest";
import {
  twitchGetChannel,
  twitchListClips,
  twitchBatchGetClips,
  twitchGetContent,
  twitchBatchGetContents,
  twitchListBroadcasts,
  twitchBatchGetBroadcasts,
  twitchListArchives,
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
  language: "en",
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
  description: "Test user description",
  created_at: "2020-01-01T00:00:00Z",
};

const sampleClip = {
  id: "clip1",
  url: "https://clips.twitch.tv/AwesomeClip",
  embed_url: "https://clips.twitch.tv/embed?clip=clip1",
  broadcaster_id: "u1",
  broadcaster_name: "TestUser",
  creator_id: "c1",
  creator_name: "Clipper",
  video_id: "v1",
  game_id: "g1",
  language: "en",
  title: "Great Clip",
  view_count: 500,
  created_at: "2024-01-01T12:00:00Z",
  thumbnail_url: "https://clips-media.twitch.tv/clip1-thumb.jpg",
  duration: 25.5,
  vod_offset: 1800,
  is_featured: false,
};

const createSampleClip = (id: string) => ({
  ...sampleClip,
  id,
  url: `https://clips.twitch.tv/${id}`,
});

describe("twitchGetContent", () => {
  it("returns Archive for a valid video ID", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchGetContent(rest, "v1");
    expect(result.type).toBe("archive");
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

describe("twitchListBroadcasts", () => {
  it("returns broadcasts filtered by type", async () => {
    const rest = createMockRest({ data: [sampleStream, { ...sampleStream, type: "" }] });
    const result = await twitchListBroadcasts(rest, "u1");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("broadcast");
  });

  it("returns empty array when not live", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchListBroadcasts(rest, "u1");
    expect(result).toEqual([]);
  });
});

describe("twitchListArchives", () => {
  it("returns paginated videos with cursor", async () => {
    const rest = createMockRest({
      data: [sampleVideo],
      pagination: { cursor: "next123" },
    });
    const result = await twitchListArchives(rest, "u1");
    expect(result.items).toHaveLength(1);
    expect(result.cursor).toBe("next123");
    expect(result.hasMore).toBe(true);
  });

  it("passes cursor as after param", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchListArchives(rest, "u1", "cursor123");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ after: "cursor123" }),
      }),
    );
  });

  it("has hasMore=false when no cursor returned", async () => {
    const rest = createMockRest({ data: [sampleVideo], pagination: {} });
    const result = await twitchListArchives(rest, "u1");
    expect(result.hasMore).toBe(false);
  });

  it("handles undefined pagination object", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchListArchives(rest, "u1");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });

  it("handles pagination with undefined cursor (last page)", async () => {
    const rest = createMockRest({ data: [sampleVideo], pagination: {} });
    const result = await twitchListArchives(rest, "u1");
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
      type: "broadcast",
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    });
    expect(result).toBeNull();
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("returns Archive when matching archive found", async () => {
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
      type: "broadcast",
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("archive");
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
      type: "broadcast",
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

describe("twitchBatchGetContents", () => {
  it("fetches multiple videos in one API call", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1"), createSampleVideo("v2")] });
    const result = await twitchBatchGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(2);
    expect(result.errors.size).toBe(0);
  });

  it("puts missing IDs in errors map", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1")] });
    const result = await twitchBatchGetContents(rest, ["v1", "v2"]);
    expect(result.values.size).toBe(1);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("v2")).toBeInstanceOf(NotFoundError);
  });

  it("passes array of IDs in query", async () => {
    const rest = createMockRest({ data: [createSampleVideo("v1"), createSampleVideo("v2")] });
    await twitchBatchGetContents(rest, ["v1", "v2"]);
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
    const result = await twitchBatchGetContents(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(150);
  });

  it("returns empty maps for empty IDs array", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchBatchGetContents(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});

describe("twitchBatchGetBroadcasts", () => {
  it("fetches broadcasts for multiple channels", async () => {
    const rest = createMockRest({ data: [sampleStream] });
    const result = await twitchBatchGetBroadcasts(rest, [sampleStream.user_id, "other_user"]);
    expect(result.values.get(sampleStream.user_id)).toHaveLength(1);
    expect(result.values.get("other_user")).toEqual([]);
    expect(result.errors.size).toBe(0);
  });

  it("returns empty arrays for channels with no broadcasts", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchBatchGetBroadcasts(rest, ["ch1", "ch2"]);
    expect(result.values.get("ch1")).toEqual([]);
    expect(result.values.get("ch2")).toEqual([]);
  });

  it("passes user_id as array for repeated params", async () => {
    const rest = createMockRest({ data: [] });
    await twitchBatchGetBroadcasts(rest, ["u1", "u2"]);
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
    const result = await twitchBatchGetBroadcasts(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(150);
  });

  it("returns empty maps for empty channelIds array", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchBatchGetBroadcasts(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });

  it("accumulates multiple streams for the same user_id", async () => {
    const stream1 = { ...sampleStream, id: "s1", user_id: "u1" };
    const stream2 = { ...sampleStream, id: "s2", user_id: "u1", title: "Second Stream" };
    const rest = createMockRest({ data: [stream1, stream2] });
    const result = await twitchBatchGetBroadcasts(rest, ["u1"]);
    expect(result.values.get("u1")).toHaveLength(2);
    expect(result.values.get("u1")![0]!.id).toBe("s1");
    expect(result.values.get("u1")![1]!.id).toBe("s2");
  });

  it("uses fallback [] for a stream whose user_id is not in the requested channelIds", async () => {
    // API returns a stream for "unknown_user" even though only "u1" was requested
    const unexpectedStream = { ...sampleStream, id: "s99", user_id: "unknown_user" };
    const rest = createMockRest({ data: [unexpectedStream] });
    const result = await twitchBatchGetBroadcasts(rest, ["u1"]);
    // u1 was requested but has no streams
    expect(result.values.get("u1")).toEqual([]);
    // unknown_user was not requested but came back from API — the ?? [] fallback creates its entry
    expect(result.values.get("unknown_user")).toHaveLength(1);
    expect(result.values.get("unknown_user")![0]!.id).toBe("s99");
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
    expect(result.items[0]!.type).toBe("broadcast");
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

  it("fetches broadcasts by channelId", async () => {
    const rest = createMockRest({ data: [sampleStream] });
    const result = await twitchSearch(rest, { channelId: "u1", status: "live" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("broadcast");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/streams" }));
  });

  it("fetches archives by channelId + ended", async () => {
    const rest = createMockRest({ data: [sampleVideo] });
    const result = await twitchSearch(rest, { channelId: "u1", status: "ended" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("archive");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/videos" }));
  });

  it("fetches broadcasts by channelId without status", async () => {
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

describe("twitchListClips", () => {
  it("returns paginated clips", async () => {
    const rest = createMockRest({
      data: [sampleClip],
      pagination: { cursor: "next456" },
    });
    const result = await twitchListClips(rest, "u1");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("clip");
    expect(result.items[0]!.id).toBe("clip1");
    expect(result.cursor).toBe("next456");
    expect(result.hasMore).toBe(true);
  });

  it("passes broadcaster_id in query", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchListClips(rest, "u1");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/clips",
        query: { broadcaster_id: "u1" },
      }),
    );
  });

  it("passes options through to query params", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    const startedAt = new Date("2024-01-01T00:00:00Z");
    const endedAt = new Date("2024-01-31T23:59:59Z");
    await twitchListClips(rest, "u1", {
      startedAt,
      endedAt,
      limit: 50,
      cursor: "abc",
      isFeatured: true,
    });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/clips",
        query: {
          broadcaster_id: "u1",
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          first: "50",
          after: "abc",
          is_featured: "true",
        },
      }),
    );
  });

  it("has hasMore=false when no cursor returned", async () => {
    const rest = createMockRest({ data: [sampleClip], pagination: {} });
    const result = await twitchListClips(rest, "u1");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });
});

describe("twitchBatchGetClips", () => {
  it("fetches multiple clips in one API call", async () => {
    const rest = createMockRest({
      data: [createSampleClip("clip1"), createSampleClip("clip2")],
    });
    const result = await twitchBatchGetClips(rest, ["clip1", "clip2"]);
    expect(result.values.size).toBe(2);
    expect(result.errors.size).toBe(0);
  });

  it("puts missing IDs in errors map", async () => {
    const rest = createMockRest({ data: [createSampleClip("clip1")] });
    const result = await twitchBatchGetClips(rest, ["clip1", "clip2"]);
    expect(result.values.size).toBe(1);
    expect(result.errors.size).toBe(1);
    expect(result.errors.get("clip2")).toBeInstanceOf(NotFoundError);
  });

  it("passes array of IDs in query", async () => {
    const rest = createMockRest({
      data: [createSampleClip("clip1"), createSampleClip("clip2")],
    });
    await twitchBatchGetClips(rest, ["clip1", "clip2"]);
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/clips",
        query: { id: ["clip1", "clip2"] },
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
          data: { data: ids.map((id: string) => createSampleClip(id)) },
        };
      },
    );
    const ids = Array.from({ length: 150 }, (_, i) => `clip${i}`);
    const result = await twitchBatchGetClips(rest, ids);
    expect(callCount).toBe(2);
    expect(result.values.size).toBe(150);
  });

  it("returns empty maps for empty IDs array", async () => {
    const rest = createMockRest({ data: [] });
    const result = await twitchBatchGetClips(rest, []);
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});

describe("twitchListArchives with options", () => {
  it("passes video options to query", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchListArchives(rest, "u1", undefined, 20, {
      period: "week",
      sort: "views",
      videoType: "highlight",
    });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          type: "highlight",
          period: "week",
          sort: "views",
        }),
      }),
    );
  });

  it("defaults to archive when no videoType in options", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchListArchives(rest, "u1", undefined, 20, { sort: "trending" });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          type: "archive",
          sort: "trending",
        }),
      }),
    );
  });

  it("defaults to archive when no options provided", async () => {
    const rest = createMockRest({ data: [], pagination: {} });
    await twitchListArchives(rest, "u1");
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ type: "archive" }),
      }),
    );
  });
});
