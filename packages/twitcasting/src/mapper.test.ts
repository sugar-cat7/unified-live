import { describe, expect, it } from "vitest";
import { toContent, toLive, toVideo, type TCMovie, type TCUser, toChannel } from "./mapper";

const mockUser: TCUser = {
  id: "user456",
  screen_id: "testuser",
  name: "TestUser",
  image: "https://img.twitcasting.tv/user.png",
  profile: "Hello!",
  level: 10,
  is_live: false,
};

const mockLiveMovie: TCMovie = {
  id: "movie123",
  user_id: "user456",
  title: "Live Stream!",
  subtitle: null,
  last_owner_comment: null,
  category: "talk",
  link: "https://twitcasting.tv/testuser/movie/movie123",
  is_live: true,
  is_recorded: false,
  current_view_count: 500,
  total_view_count: 1000,
  duration: 0,
  created: 1741420800, // 2025-03-08T12:00:00Z
  large_thumbnail: "https://img.twitcasting.tv/thumb_large.jpg",
  small_thumbnail: "https://img.twitcasting.tv/thumb_small.jpg",
};

const mockArchiveMovie: TCMovie = {
  id: "movie789",
  user_id: "user456",
  title: "Past Broadcast",
  subtitle: null,
  last_owner_comment: null,
  category: "game",
  link: "https://twitcasting.tv/testuser/movie/movie789",
  is_live: false,
  is_recorded: true,
  current_view_count: 0,
  total_view_count: 5000,
  duration: 3600,
  created: 1741334400, // 2025-03-07T12:00:00Z
  large_thumbnail: "https://img.twitcasting.tv/arch_thumb.jpg",
  small_thumbnail: "https://img.twitcasting.tv/arch_thumb_s.jpg",
};

describe("toLive", () => {
  it("converts a live TwitCasting movie to LiveStream", () => {
    const result = toLive(mockLiveMovie, mockUser);

    expect(result.type).toBe("live");
    expect(result.id).toBe("movie123");
    expect(result.platform).toBe("twitcasting");
    expect(result.title).toBe("Live Stream!");
    expect(result.viewerCount).toBe(500);
    expect(result.sessionId).toBe("movie123");
    expect(result.channel.id).toBe("user456");
    expect(result.channel.name).toBe("TestUser");
    expect(result.url).toBe("https://twitcasting.tv/testuser/movie/movie123");
  });

  it("preserves raw data", () => {
    const result = toLive(mockLiveMovie, mockUser);
    expect(result.raw).toBe(mockLiveMovie);
  });

  it("uses user name as fallback when title is empty", () => {
    const noTitle = { ...mockLiveMovie, title: "" };
    const result = toLive(noTitle, mockUser);
    expect(result.title).toBe("TestUser's live");
  });
});

describe("toVideo", () => {
  it("converts an archive TwitCasting movie to Video", () => {
    const result = toVideo(mockArchiveMovie, mockUser);

    expect(result.type).toBe("video");
    expect(result.id).toBe("movie789");
    expect(result.platform).toBe("twitcasting");
    expect(result.title).toBe("Past Broadcast");
    expect(result.duration).toBe(3600);
    expect(result.viewCount).toBe(5000);
    expect(result.sessionId).toBe("movie789");
  });

  it("preserves raw data", () => {
    const result = toVideo(mockArchiveMovie, mockUser);
    expect(result.raw).toBe(mockArchiveMovie);
  });

  it("uses user name as fallback when title is empty", () => {
    const noTitle = { ...mockArchiveMovie, title: "" };
    const result = toVideo(noTitle, mockUser);
    expect(result.title).toBe("TestUser's broadcast");
  });

  it("handles zero duration", () => {
    const zeroDuration = { ...mockArchiveMovie, duration: 0 };
    const result = toVideo(zeroDuration, mockUser);
    expect(result.duration).toBe(0);
  });

  it("converts epoch timestamp to correct date", () => {
    const result = toVideo(mockArchiveMovie, mockUser);
    expect(result.publishedAt).toEqual(new Date(1741334400 * 1000));
  });
});

describe("toContent", () => {
  it("returns LiveStream for live movies", () => {
    const result = toContent(mockLiveMovie, mockUser);
    expect(result.type).toBe("live");
  });

  it("returns Video for archived movies", () => {
    const result = toContent(mockArchiveMovie, mockUser);
    expect(result.type).toBe("video");
  });
});

describe("toChannel", () => {
  it("converts a TwitCasting user to Channel", () => {
    const result = toChannel(mockUser);

    expect(result.id).toBe("user456");
    expect(result.platform).toBe("twitcasting");
    expect(result.name).toBe("TestUser");
    expect(result.url).toBe("https://twitcasting.tv/testuser");
    expect(result.thumbnail?.url).toBe("https://img.twitcasting.tv/user.png");
  });
});
