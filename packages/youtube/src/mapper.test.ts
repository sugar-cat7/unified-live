import type { ScheduledBroadcast } from "@unified-live/core";
import { describe, expect, it } from "vitest";
import type { YTChannelResource, YTVideoResource } from "./mapper";
import { parseDuration, toChannel, toContent } from "./mapper";

const baseVideoResource: YTVideoResource = {
  id: "dQw4w9WgXcQ",
  snippet: {
    title: "Test Video",
    description: "A test video description",
    tags: ["test", "video"],
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

const upcomingVideoResource: YTVideoResource = {
  ...baseVideoResource,
  id: "upcoming123",
  snippet: {
    ...baseVideoResource.snippet,
    liveBroadcastContent: "upcoming",
  },
  liveStreamingDetails: {
    scheduledStartTime: "2024-06-01T18:00:00Z",
  },
};

describe("toContent", () => {
  it("maps a regular video", () => {
    const content = toContent(baseVideoResource);

    expect(content.type).toBe("archive");
    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(content.title).toBe("Test Video");
    expect(content.description).toBe("A test video description");
    expect(content.tags).toEqual(["test", "video"]);
    expect(content.sessionId).toBe("dQw4w9WgXcQ");
    expect(content.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    if (content.type === "archive") {
      expect(content.duration).toBe(3723); // 1*3600 + 2*60 + 3
      expect(content.viewCount).toBe(50000);
      expect(content.publishedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    }
  });

  it("maps a live stream", () => {
    const content = toContent(liveVideoResource);

    expect(content.type).toBe("broadcast");
    expect(content.id).toBe("dQw4w9WgXcQ");
    expect(content.platform).toBe("youtube");
    expect(content.description).toBe("A test video description");
    expect(content.tags).toEqual(["test", "video"]);
    expect(content.sessionId).toBe("dQw4w9WgXcQ");

    if (content.type === "broadcast") {
      expect(content.viewerCount).toBe(1500);
      expect(content.startedAt).toEqual(new Date("2024-01-01T12:00:00Z"));
      expect(content.endedAt).toBeUndefined();
    }
  });

  it("maps endedAt when actualEndTime is present", () => {
    const endedResource: YTVideoResource = {
      ...liveVideoResource,
      liveStreamingDetails: {
        ...liveVideoResource.liveStreamingDetails,
        actualEndTime: "2024-01-01T14:00:00Z",
      },
    };
    const content = toContent(endedResource);

    if (content.type === "broadcast") {
      expect(content.endedAt).toEqual(new Date("2024-01-01T14:00:00Z"));
    } else {
      expect.unreachable("Should be broadcast");
    }
  });

  it("maps languageCode from defaultAudioLanguage on live stream", () => {
    const resource: YTVideoResource = {
      ...liveVideoResource,
      snippet: {
        ...liveVideoResource.snippet,
        defaultAudioLanguage: "ja",
      },
    };
    const content = toContent(resource);
    expect(content.languageCode).toBe("ja");
  });

  it("maps languageCode from defaultAudioLanguage on scheduled stream", () => {
    const resource: YTVideoResource = {
      ...upcomingVideoResource,
      snippet: {
        ...upcomingVideoResource.snippet,
        defaultAudioLanguage: "en",
      },
    };
    const content = toContent(resource);
    expect(content.languageCode).toBe("en");
  });

  it("maps upcoming broadcast to ScheduledStream", () => {
    const result = toContent(upcomingVideoResource);
    expect(result.type).toBe("scheduled");
    expect(result.description).toBe("A test video description");
    expect(result.tags).toEqual(["test", "video"]);
    expect((result as ScheduledBroadcast).scheduledStartAt).toEqual(new Date("2024-06-01T18:00:00Z"));
  });

  it("maps startedAt/endedAt on video from liveStreamingDetails", () => {
    const resource: YTVideoResource = {
      ...baseVideoResource,
      liveStreamingDetails: {
        actualStartTime: "2024-01-01T10:00:00Z",
        actualEndTime: "2024-01-01T12:00:00Z",
      },
    };
    const content = toContent(resource);

    if (content.type === "archive") {
      expect(content.startedAt).toEqual(new Date("2024-01-01T10:00:00Z"));
      expect(content.endedAt).toEqual(new Date("2024-01-01T12:00:00Z"));
    } else {
      expect.unreachable("Should be archive");
    }
  });

  it("leaves startedAt/endedAt undefined on video without liveStreamingDetails", () => {
    const content = toContent(baseVideoResource);

    if (content.type === "archive") {
      expect(content.startedAt).toBeUndefined();
      expect(content.endedAt).toBeUndefined();
    } else {
      expect.unreachable("Should be archive");
    }
  });

  it("maps languageCode from defaultAudioLanguage on video", () => {
    const resource: YTVideoResource = {
      ...baseVideoResource,
      snippet: {
        ...baseVideoResource.snippet,
        defaultAudioLanguage: "ja",
      },
    };
    const content = toContent(resource);
    expect(content.languageCode).toBe("ja");
  });

  it("leaves languageCode undefined when defaultAudioLanguage is missing", () => {
    const content = toContent(baseVideoResource);
    expect(content.languageCode).toBeUndefined();
  });

  it("defaults description to empty string and tags to empty array when missing", () => {
    const noDescTags: YTVideoResource = {
      ...baseVideoResource,
      snippet: {
        ...baseVideoResource.snippet,
        description: undefined,
        tags: undefined,
      },
    };
    const content = toContent(noDescTags);
    expect(content.description).toBe("");
    expect(content.tags).toEqual([]);
  });

  it("maps upcoming without scheduledStartTime using publishedAt", () => {
    const item: YTVideoResource = { ...upcomingVideoResource, liveStreamingDetails: {} };
    const result = toContent(item);
    expect(result.type).toBe("scheduled");
    expect((result as ScheduledBroadcast).scheduledStartAt).toEqual(new Date("2024-01-01T00:00:00Z"));
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

  it.each([
    { field: "channelId", override: { channelId: undefined }, error: "missing channelId" },
    { field: "publishedAt", override: { publishedAt: undefined }, error: "missing publishedAt" },
  ])("throws when video has no $field", ({ override, error }) => {
    const resource: YTVideoResource = {
      ...baseVideoResource,
      snippet: { ...baseVideoResource.snippet, ...override },
    };
    expect(() => toContent(resource)).toThrow(error);
  });

  it("throws ParseError for video missing contentDetails", () => {
    const resource: YTVideoResource = {
      ...baseVideoResource,
      contentDetails: undefined,
    };
    expect(() => toContent(resource)).toThrow("missing required parts");
  });

  it("throws ParseError for video missing statistics", () => {
    const resource: YTVideoResource = {
      ...baseVideoResource,
      statistics: undefined,
    };
    expect(() => toContent(resource)).toThrow("missing required parts");
  });

  it("throws when video has no thumbnail at all", () => {
    const noThumb: YTVideoResource = {
      ...baseVideoResource,
      snippet: {
        ...baseVideoResource.snippet,
        thumbnails: {},
      },
    };
    expect(() => toContent(noThumb)).toThrow("YouTube resource has no thumbnail");
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

  it("maps description, subscriberCount, and publishedAt from statistics and snippet", () => {
    const resource: YTChannelResource = {
      ...channelResource,
      snippet: {
        ...channelResource.snippet,
        description: "A great channel",
        publishedAt: "2020-06-15T00:00:00Z",
      },
      statistics: {
        subscriberCount: "123456",
      },
    };
    const channel = toChannel(resource);
    expect(channel.description).toBe("A great channel");
    expect(channel.subscriberCount).toBe(123456);
    expect(channel.publishedAt).toEqual(new Date("2020-06-15T00:00:00Z"));
  });

  it("leaves subscriberCount/publishedAt undefined when not present", () => {
    const channel = toChannel(channelResource);
    expect(channel.subscriberCount).toBeUndefined();
    expect(channel.publishedAt).toBeUndefined();
  });

  it.each([
    { desc: "missing id", resource: { snippet: { title: "X" } } },
    { desc: "missing snippet", resource: { id: "UC123" } },
  ])("throws when channel has $desc", ({ resource }) => {
    expect(() => toChannel(resource as YTChannelResource)).toThrow("missing required parts");
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
    { name: "days and hours", input: "P1DT3H", expected: 97200 },
    { name: "days only", input: "P2D", expected: 172800 },
  ])("parseDuration($input) = $expected", ({ input, expected }) => {
    expect(parseDuration(input)).toBe(expected);
  });
});
