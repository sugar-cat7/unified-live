import { describe, expect, it } from "vitest";
import type { TwitchStream, TwitchUser, TwitchVideo } from "../mapper";
import {
  parseTwitchDuration,
  streamToLive,
  userToChannel,
  videoToVideo,
} from "../mapper";

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
  thumbnail_url:
    "https://static-cdn.jtvnw.net/cf_vods/testuser/thumb-{width}x{height}.jpg",
  type: "archive",
  url: "https://www.twitch.tv/videos/789",
};

const mockUser: TwitchUser = {
  id: "user456",
  login: "testuser",
  display_name: "TestUser",
  profile_image_url: "https://static-cdn.jtvnw.net/user-default.png",
};

describe("streamToLive", () => {
  it("converts a Twitch stream to LiveStream", () => {
    const result = streamToLive(mockStream);

    expect(result.type).toBe("live");
    expect(result.id).toBe("stream123");
    expect(result.platform).toBe("twitch");
    expect(result.title).toBe("Test Stream");
    expect(result.viewerCount).toBe(1234);
    expect(result.sessionId).toBe("stream123");
    expect(result.channel.id).toBe("user456");
    expect(result.url).toBe("https://www.twitch.tv/testuser");
  });
});

describe("videoToVideo", () => {
  it("converts a Twitch video to Video", () => {
    const result = videoToVideo(mockVideo);

    expect(result.type).toBe("video");
    expect(result.id).toBe("v789");
    expect(result.platform).toBe("twitch");
    expect(result.title).toBe("Past Stream");
    expect(result.duration).toBe(10921); // 3*3600 + 2*60 + 1
    expect(result.viewCount).toBe(5678);
    expect(result.sessionId).toBe("stream123");
  });

  it("uses video id as sessionId when stream_id is null", () => {
    const video = { ...mockVideo, stream_id: null };
    const result = videoToVideo(video);
    expect(result.sessionId).toBe("v789");
  });
});

describe("userToChannel", () => {
  it("converts a Twitch user to Channel", () => {
    const result = userToChannel(mockUser);

    expect(result.id).toBe("user456");
    expect(result.platform).toBe("twitch");
    expect(result.name).toBe("TestUser");
    expect(result.url).toBe("https://www.twitch.tv/testuser");
    expect(result.thumbnail?.url).toBe(
      "https://static-cdn.jtvnw.net/user-default.png",
    );
  });
});

describe("parseTwitchDuration", () => {
  it.each([
    ["3h2m1s", 10921],
    ["1h0m0s", 3600],
    ["45m30s", 2730],
    ["30s", 30],
    ["1h", 3600],
    ["", 0],
  ])("parses %s to %d seconds", (input, expected) => {
    expect(parseTwitchDuration(input)).toBe(expected);
  });
});
