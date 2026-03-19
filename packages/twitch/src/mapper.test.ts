import { ParseError } from "@unified-live/core";
import { describe, expect, it } from "vitest";
import type { TwitchSearchChannel, TwitchStream, TwitchUser, TwitchVideo } from "./mapper";
import { parseDuration, toLive, toChannel, toSearchLive, toVideo } from "./mapper";

const mockStream: TwitchStream = {
  id: "stream123",
  user_id: "user456",
  user_login: "testuser",
  user_name: "TestUser",
  game_name: "Just Chatting",
  title: "Test Stream",
  viewer_count: 1234,
  started_at: "2026-03-08T12:00:00Z",
  thumbnail_url:
    "https://static-cdn.jtvnw.net/previews-ttv/live_user_testuser-{width}x{height}.jpg",
  type: "live",
};

const mockVideo: TwitchVideo = {
  id: "v789",
  stream_id: "stream123",
  user_id: "user456",
  user_login: "testuser",
  user_name: "TestUser",
  title: "Past Stream",
  duration: "3h2m1s",
  view_count: 5678,
  created_at: "2026-03-07T12:00:00Z",
  published_at: "2026-03-07T15:00:00Z",
  thumbnail_url: "https://static-cdn.jtvnw.net/cf_vods/testuser/thumb-{width}x{height}.jpg",
  type: "archive",
  url: "https://www.twitch.tv/videos/789",
};

const mockUser: TwitchUser = {
  id: "user456",
  login: "testuser",
  display_name: "TestUser",
  profile_image_url: "https://static-cdn.jtvnw.net/user-default.png",
};

describe("toLive", () => {
  it("converts a Twitch stream to LiveStream", () => {
    const result = toLive(mockStream);

    expect(result.type).toBe("live");
    expect(result.id).toBe("stream123");
    expect(result.platform).toBe("twitch");
    expect(result.title).toBe("Test Stream");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.viewerCount).toBe(1234);
    expect(result.endedAt).toBeUndefined();
    expect(result.sessionId).toBe("stream123");
    expect(result.channel.id).toBe("user456");
    expect(result.url).toBe("https://www.twitch.tv/testuser");
  });

  it("preserves raw data", () => {
    const result = toLive(mockStream);
    expect(result.raw).toBe(mockStream);
  });

  it.each([
    { desc: "missing stream.id", override: { id: "" } },
    { desc: "missing stream.user_id", override: { user_id: "" } },
  ])("throws ParseError when $desc", ({ override }) => {
    expect(() => toLive({ ...mockStream, ...override } as TwitchStream)).toThrow(ParseError);
  });
});

describe("toVideo", () => {
  it("converts a Twitch video to Video", () => {
    const result = toVideo(mockVideo);

    expect(result.type).toBe("video");
    expect(result.id).toBe("v789");
    expect(result.platform).toBe("twitch");
    expect(result.title).toBe("Past Stream");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.duration).toBe(10921); // 3*3600 + 2*60 + 1
    expect(result.viewCount).toBe(5678);
    expect(result.sessionId).toBe("stream123");
  });

  it("uses video id as sessionId when stream_id is null", () => {
    const video = { ...mockVideo, stream_id: null };
    const result = toVideo(video);
    expect(result.sessionId).toBe("v789");
  });

  it("preserves raw data", () => {
    const result = toVideo(mockVideo);
    expect(result.raw).toBe(mockVideo);
  });

  it("formats thumbnail URL replacing placeholders", () => {
    const result = toVideo(mockVideo);
    expect(result.thumbnail.url).not.toContain("{width}");
    expect(result.thumbnail.url).not.toContain("{height}");
    expect(result.thumbnail.width).toBe(640);
    expect(result.thumbnail.height).toBe(360);
  });

  it.each([
    { desc: "missing video.id", override: { id: "" } },
    { desc: "missing video.user_id", override: { user_id: "" } },
  ])("throws ParseError when $desc", ({ override }) => {
    expect(() => toVideo({ ...mockVideo, ...override } as TwitchVideo)).toThrow(ParseError);
  });
});

describe("toChannel", () => {
  it("converts a Twitch user to Channel", () => {
    const result = toChannel(mockUser);

    expect(result.id).toBe("user456");
    expect(result.platform).toBe("twitch");
    expect(result.name).toBe("TestUser");
    expect(result.url).toBe("https://www.twitch.tv/testuser");
    expect(result.thumbnail?.url).toBe("https://static-cdn.jtvnw.net/user-default.png");
  });

  it.each([
    { desc: "missing user.id", override: { id: "" } },
    { desc: "missing user.login", override: { login: "" } },
  ])("throws ParseError when $desc", ({ override }) => {
    expect(() => toChannel({ ...mockUser, ...override } as TwitchUser)).toThrow(ParseError);
  });
});

describe("toSearchLive", () => {
  const mockSearchChannel: TwitchSearchChannel = {
    id: "ch1",
    broadcaster_login: "livecaster",
    display_name: "LiveCaster",
    game_name: "Just Chatting",
    title: "Live Now!",
    is_live: true,
    started_at: "2024-06-01T10:00:00Z",
    thumbnail_url: "https://img.tv/ch1.jpg",
  };

  it("maps search channel to LiveStream", () => {
    const result = toSearchLive(mockSearchChannel);
    expect(result.type).toBe("live");
    expect(result.id).toBe("livecaster");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.channel.id).toBe("ch1");
    expect(result.channel.name).toBe("LiveCaster");
    expect(result.url).toBe("https://www.twitch.tv/livecaster");
    expect(result.startedAt).toEqual(new Date("2024-06-01T10:00:00Z"));
    expect(result.endedAt).toBeUndefined();
    expect(result.viewerCount).toBe(0);
  });

  it("preserves raw data", () => {
    const result = toSearchLive(mockSearchChannel);
    expect(result.raw).toBe(mockSearchChannel);
  });

  it.each([
    { desc: "missing id", override: { id: "" } },
    { desc: "missing broadcaster_login", override: { broadcaster_login: "" } },
  ])("throws ParseError when $desc", ({ override }) => {
    expect(() =>
      toSearchLive({ ...mockSearchChannel, ...override } as TwitchSearchChannel),
    ).toThrow(ParseError);
  });
});

describe("parseDuration", () => {
  it.each([
    ["3h2m1s", 10921],
    ["1h0m0s", 3600],
    ["45m30s", 2730],
    ["30s", 30],
    ["1h", 3600],
    ["", 0],
    ["0h0m0s", 0],
    ["10h", 36000],
    ["invalid", 0],
  ])("parses %s to %d seconds", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});
