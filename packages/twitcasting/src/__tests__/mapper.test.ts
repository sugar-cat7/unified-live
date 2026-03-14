import { describe, expect, it } from "vitest";
import {
  movieToContent,
  movieToLive,
  movieToVideo,
  type TCMovie,
  type TCUser,
  userToChannel,
} from "../mapper";

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

describe("movieToLive", () => {
  it("converts a live TwitCasting movie to LiveStream", () => {
    const result = movieToLive(mockLiveMovie, mockUser);

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
});

describe("movieToVideo", () => {
  it("converts an archive TwitCasting movie to Video", () => {
    const result = movieToVideo(mockArchiveMovie, mockUser);

    expect(result.type).toBe("video");
    expect(result.id).toBe("movie789");
    expect(result.platform).toBe("twitcasting");
    expect(result.title).toBe("Past Broadcast");
    expect(result.duration).toBe(3600);
    expect(result.viewCount).toBe(5000);
    expect(result.sessionId).toBe("movie789");
  });
});

describe("movieToContent", () => {
  it("returns LiveStream for live movies", () => {
    const result = movieToContent(mockLiveMovie, mockUser);
    expect(result.type).toBe("live");
  });

  it("returns Video for archived movies", () => {
    const result = movieToContent(mockArchiveMovie, mockUser);
    expect(result.type).toBe("video");
  });
});

describe("userToChannel", () => {
  it("converts a TwitCasting user to Channel", () => {
    const result = userToChannel(mockUser);

    expect(result.id).toBe("user456");
    expect(result.platform).toBe("twitcasting");
    expect(result.name).toBe("TestUser");
    expect(result.url).toBe("https://twitcasting.tv/testuser");
    expect(result.thumbnail?.url).toBe("https://img.twitcasting.tv/user.png");
  });
});
