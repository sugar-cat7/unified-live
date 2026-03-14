import { describe, expect, it } from "vitest";
import { matchTwitCastingUrl } from "./urls";

describe("matchTwitCastingUrl", () => {
  it.each([
    ["https://twitcasting.tv/user123/movie/789", "content", "789"],
    ["https://www.twitcasting.tv/user_name/movie/12345", "content", "12345"],
  ])("matches content URL: %s", (url, type, id) => {
    expect(matchTwitCastingUrl(url)).toEqual({
      platform: "twitcasting",
      type,
      id,
    });
  });

  it.each([
    ["https://twitcasting.tv/user123", "channel", "user123"],
    ["https://www.twitcasting.tv/user_name", "channel", "user_name"],
    ["https://twitcasting.tv/user123/", "channel", "user123"],
  ])("matches channel URL: %s", (url, type, id) => {
    expect(matchTwitCastingUrl(url)).toEqual({
      platform: "twitcasting",
      type,
      id,
    });
  });

  it.each([
    "https://youtube.com/watch?v=abc123",
    "https://twitch.tv/user",
    "https://example.com",
    "not-a-url",
  ])("returns null for non-TwitCasting URL: %s", (url) => {
    expect(matchTwitCastingUrl(url)).toBeNull();
  });
});
