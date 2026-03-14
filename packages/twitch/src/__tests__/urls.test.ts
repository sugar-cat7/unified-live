import { describe, expect, it } from "vitest";
import { matchTwitchUrl } from "../urls";

describe("matchTwitchUrl", () => {
  it.each([
    ["https://www.twitch.tv/videos/12345", "content", "12345"],
    ["https://twitch.tv/videos/99999", "content", "99999"],
  ])("matches content URL: %s", (url, type, id) => {
    expect(matchTwitchUrl(url)).toEqual({ platform: "twitch", type, id });
  });

  it.each([
    ["https://www.twitch.tv/shroud", "channel", "shroud"],
    ["https://twitch.tv/ninja", "channel", "ninja"],
    ["https://www.twitch.tv/user_name1", "channel", "user_name1"],
  ])("matches channel URL: %s", (url, type, id) => {
    expect(matchTwitchUrl(url)).toEqual({ platform: "twitch", type, id });
  });

  it.each([
    "https://youtube.com/watch?v=abc123",
    "https://example.com",
    "https://twitch.tv/videos/",
    "not-a-url",
  ])("returns null for non-Twitch URL: %s", (url) => {
    expect(matchTwitchUrl(url)).toBeNull();
  });
});
