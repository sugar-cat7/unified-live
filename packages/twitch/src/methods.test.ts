import { NotFoundError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import type { RestManager } from "@unified-live/core";
import {
  twitchGetContent,
  twitchGetChannel,
  twitchGetLiveStreams,
  twitchGetVideos,
  twitchResolveArchive,
} from "./methods";

const createMockRest = (response: unknown): RestManager => ({
  platform: "twitch",
  baseUrl: "https://api.twitch.tv/helix",
  rateLimitStrategy: {} as RestManager["rateLimitStrategy"],
  tokenManager: undefined,
  request: vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), data: response }),
  createHeaders: vi.fn(),
  runRequest: vi.fn(),
  handleResponse: vi.fn(),
  handleRateLimit: vi.fn(),
  parseRateLimitHeaders: vi.fn(),
  [Symbol.dispose]: vi.fn(),
});

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
