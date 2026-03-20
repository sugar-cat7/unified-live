import { ParseError } from "@unified-live/core";
import { describe, expect, it } from "vitest";
import type {
  TwitchClip,
  TwitchSearchChannel,
  TwitchStream,
  TwitchUser,
  TwitchVideo,
} from "./mapper";
import { parseDuration, toClip, toLive, toChannel, toSearchLive, toVideo } from "./mapper";

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
  language: "en",
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
  description: "I am a test user",
  created_at: "2020-01-15T10:00:00Z",
};

const mockClip: TwitchClip = {
  id: "clip123",
  url: "https://clips.twitch.tv/AwesomeClip",
  embed_url: "https://clips.twitch.tv/embed?clip=clip123",
  broadcaster_id: "user456",
  broadcaster_name: "TestUser",
  creator_id: "creator789",
  creator_name: "ClipCreator",
  video_id: "v789",
  game_id: "game001",
  language: "en",
  title: "Amazing Clip",
  view_count: 9999,
  created_at: "2026-03-08T14:30:00Z",
  thumbnail_url: "https://clips-media.twitch.tv/clip123-preview.jpg",
  duration: 30.5,
  vod_offset: 3600,
  is_featured: false,
};

describe("toLive", () => {
  it("converts a Twitch stream to LiveStream", () => {
    const result = toLive(mockStream);

    expect(result.type).toBe("broadcast");
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
    expect(result.languageCode).toBe("en");
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

    expect(result.type).toBe("archive");
    expect(result.id).toBe("v789");
    expect(result.platform).toBe("twitch");
    expect(result.title).toBe("Past Stream");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.duration).toBe(10921); // 3*3600 + 2*60 + 1
    expect(result.viewCount).toBe(5678);
    expect(result.sessionId).toBe("stream123");
    expect(result.startedAt).toEqual(new Date("2026-03-07T12:00:00Z"));
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
    expect(result.description).toBe("I am a test user");
    expect(result.publishedAt).toEqual(new Date("2020-01-15T10:00:00Z"));
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
    expect(result.type).toBe("broadcast");
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

describe("toClip", () => {
  it.each([
    {
      desc: "basic clip",
      clip: mockClip,
      expected: {
        id: "clip123",
        platform: "twitch",
        type: "clip",
        title: "Amazing Clip",
        duration: 30.5,
        viewCount: 9999,
        vodOffset: 3600,
        isFeatured: false,
        languageCode: "en",
        gameId: "game001",
      },
    },
    {
      desc: "null vod_offset maps to undefined",
      clip: { ...mockClip, vod_offset: null },
      expected: { vodOffset: undefined },
    },
    {
      desc: "featured clip",
      clip: { ...mockClip, is_featured: true },
      expected: { isFeatured: true },
    },
    {
      desc: "different language",
      clip: { ...mockClip, language: "ja" },
      expected: { languageCode: "ja" },
    },
  ])("converts $desc", ({ clip, expected }) => {
    const result = toClip(clip);
    for (const [key, value] of Object.entries(expected)) {
      expect(result[key as keyof typeof result]).toEqual(value);
    }
  });

  it("maps channel from broadcaster fields", () => {
    const result = toClip(mockClip);
    expect(result.channel.id).toBe("user456");
    expect(result.channel.name).toBe("TestUser");
    expect(result.channel.url).toBe("https://www.twitch.tv/TestUser");
  });

  it("maps clipCreator from creator fields", () => {
    const result = toClip(mockClip);
    expect(result.clipCreator).toEqual({ id: "creator789", name: "ClipCreator" });
  });

  it("maps thumbnail with clip dimensions", () => {
    const result = toClip(mockClip);
    expect(result.thumbnail).toEqual({
      url: "https://clips-media.twitch.tv/clip123-preview.jpg",
      width: 480,
      height: 272,
    });
  });

  it("maps createdAt and embedUrl", () => {
    const result = toClip(mockClip);
    expect(result.createdAt).toEqual(new Date("2026-03-08T14:30:00Z"));
    expect(result.embedUrl).toBe("https://clips.twitch.tv/embed?clip=clip123");
  });

  it("preserves raw data", () => {
    const result = toClip(mockClip);
    expect(result.raw).toBe(mockClip);
  });

  it.each([
    { desc: "missing clip.id", override: { id: "" } },
    { desc: "missing clip.broadcaster_id", override: { broadcaster_id: "" } },
  ])("throws ParseError when $desc", ({ override }) => {
    expect(() => toClip({ ...mockClip, ...override } as TwitchClip)).toThrow(ParseError);
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
