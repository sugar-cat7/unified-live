import { describe, expect, it } from "vitest";
import type { YTChannelResource, YTVideoResource } from "../mapper.js";
import { parseDuration, toChannel, toContent } from "../mapper.js";

const baseVideoResource: YTVideoResource = {
  id: "dQw4w9WgXcQ",
  snippet: {
    title: "Test Video",
    channelId: "UC123",
    channelTitle: "Test Channel",
    thumbnails: {
      high: {
        url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        width: 480,
        height: 360,
      },
    },
    liveBroadcastContent: "none",
    publishedAt: "2024-01-01T00:00:00Z",
  },
  contentDetails: {
    duration: "PT1H2M3S",
  },
  statistics: {
    viewCount: "50000",
  },
};

const liveVideoResource: YTVideoResource = {
  ...baseVideoResource,
  snippet: {
    ...baseVideoResource.snippet,
    liveBroadcastContent: "live",
  },
  liveStreamingDetails: {
    actualStartTime: "2024-01-01T12:00:00Z",
    concurrentViewers: "1500",
  },
};

describe("toContent", () => {
  it("maps a regular video", () => {
    const content = toContent(baseVideoResource);

    expect(content.type).toBe("video");
    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(content.title).toBe("Test Video");
    expect(content.sessionId).toBe("dQw4w9WgXcQ");
    expect(content.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    if (content.type === "video") {
      expect(content.duration).toBe(3723); // 1*3600 + 2*60 + 3
      expect(content.viewCount).toBe(50000);
      expect(content.publishedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    }
  });

  it("maps a live stream", () => {
    const content = toContent(liveVideoResource);

    expect(content.type).toBe("live");
    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(content.sessionId).toBe("dQw4w9WgXcQ");

    if (content.type === "live") {
      expect(content.viewerCount).toBe(1500);
      expect(content.startedAt).toEqual(new Date("2024-01-01T12:00:00Z"));
    }
  });

  it("preserves raw data", () => {
    const content = toContent(baseVideoResource);
    expect(content.raw).toBe(baseVideoResource);
  });

  it("sets channel ref correctly", () => {
    const content = toContent(baseVideoResource);
    expect(content.channel).toEqual({
      id: "UC123",
      name: "Test Channel",
      url: "https://www.youtube.com/channel/UC123",
    });
  });

  it("throws when video has no thumbnail at all", () => {
    const noThumb: YTVideoResource = {
      ...baseVideoResource,
      snippet: {
        ...baseVideoResource.snippet,
        thumbnails: {},
      },
    };
    expect(() => toContent(noThumb)).toThrow(
      "YouTube resource has no thumbnail",
    );
  });

  it("uses best available thumbnail", () => {
    const noHighThumb: YTVideoResource = {
      ...baseVideoResource,
      snippet: {
        ...baseVideoResource.snippet,
        thumbnails: {
          medium: {
            url: "https://example.com/medium.jpg",
            width: 320,
            height: 180,
          },
        },
      },
    };
    const content = toContent(noHighThumb);
    expect(content.thumbnail.url).toBe("https://example.com/medium.jpg");
  });
});

describe("toChannel", () => {
  const channelResource: YTChannelResource = {
    id: "UC123",
    snippet: {
      title: "Test Channel",
      thumbnails: {
        high: {
          url: "https://example.com/avatar.jpg",
          width: 800,
          height: 800,
        },
      },
      customUrl: "@testchannel",
    },
    contentDetails: {
      relatedPlaylists: {
        uploads: "UU123",
      },
    },
  };

  it("maps a channel", () => {
    const channel = toChannel(channelResource);
    expect(channel.id).toBe("UC123");
    expect(channel.platform).toBe("youtube");
    expect(channel.name).toBe("Test Channel");
    expect(channel.url).toBe("https://www.youtube.com/channel/UC123");
    expect(channel.thumbnail).toEqual({
      url: "https://example.com/avatar.jpg",
      width: 800,
      height: 800,
    });
  });

  it("handles missing thumbnail", () => {
    const noThumb: YTChannelResource = {
      ...channelResource,
      snippet: { ...channelResource.snippet, thumbnails: {} },
    };
    const channel = toChannel(noThumb);
    expect(channel.thumbnail).toBeUndefined();
  });
});

describe("parseDuration", () => {
  it.each([
    { input: "PT1H2M3S", expected: 3723 },
    { input: "PT10M", expected: 600 },
    { input: "PT30S", expected: 30 },
    { input: "PT2H", expected: 7200 },
    { input: "PT1H30M", expected: 5400 },
    { input: "PT0S", expected: 0 },
    { input: "", expected: 0 },
    { input: "P1D", expected: 0 }, // Day-level not handled
  ])("parseDuration($input) = $expected", ({ input, expected }) => {
    expect(parseDuration(input)).toBe(expected);
  });
});
