import { describe, expect, it } from "vitest";
import { matchYouTubeUrl } from "./urls";

describe("matchYouTubeUrl", () => {
  it.each([
    {
      name: "youtube.com/watch?v=",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      expected: { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" },
    },
    {
      name: "youtube.com/watch?v= with extra params",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
      expected: { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" },
    },
    {
      name: "youtu.be short link",
      url: "https://youtu.be/dQw4w9WgXcQ",
      expected: { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" },
    },
    {
      name: "youtube.com/live/",
      url: "https://www.youtube.com/live/dQw4w9WgXcQ",
      expected: { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" },
    },
    {
      name: "youtube.com/channel/",
      url: "https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx",
      expected: {
        platform: "youtube",
        type: "channel",
        id: "UCxxxxxxxxxxxxxxxxxxxxxx",
      },
    },
    {
      name: "youtube.com/@handle",
      url: "https://www.youtube.com/@MrBeast",
      expected: { platform: "youtube", type: "channel", id: "MrBeast" },
    },
    {
      name: "youtube.com/c/custom",
      url: "https://www.youtube.com/c/Fireship",
      expected: { platform: "youtube", type: "channel", id: "Fireship" },
    },
    {
      name: "http protocol",
      url: "http://youtube.com/watch?v=dQw4w9WgXcQ",
      expected: { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" },
    },
  ])("matches $name", ({ url, expected }) => {
    expect(matchYouTubeUrl(url)).toEqual(expected);
  });

  it.each([
    { name: "non-youtube domain", url: "https://twitch.tv/shroud" },
    { name: "youtube homepage", url: "https://youtube.com/" },
    {
      name: "youtube playlist",
      url: "https://youtube.com/playlist?list=PL123",
    },
    { name: "empty string", url: "" },
    { name: "random string", url: "not-a-url" },
  ])("returns null for $name", ({ url }) => {
    expect(matchYouTubeUrl(url)).toBeNull();
  });
});
