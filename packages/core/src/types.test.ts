import { describe, expect, it } from "vitest";
import {
  BatchResult,
  BroadcastSession,
  broadcastSessionSchema,
  Channel,
  channelRefSchema,
  channelSchema,
  Content,
  contentSchema,
  LiveStream,
  liveStreamSchema,
  Page,
  resolvedUrlSchema,
  ScheduledStream,
  scheduledStreamSchema,
  searchOptionsSchema,
  thumbnailSchema,
  Video,
  videoSchema,
} from "./types";

const validThumbnail = {
  url: "https://example.com/thumb.jpg",
  width: 320,
  height: 180,
};

const validChannelRef = {
  id: "UC123",
  name: "Test Channel",
  url: "https://youtube.com/channel/UC123",
};

const baseLiveStream = {
  id: "abc123",
  platform: "youtube",
  title: "Test Live",
  url: "https://youtube.com/watch?v=abc123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "live" as const,
  viewerCount: 1000,
  startedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseVideo = {
  id: "xyz789",
  platform: "youtube",
  title: "Test Video",
  url: "https://youtube.com/watch?v=xyz789",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "video" as const,
  duration: 3600,
  viewCount: 50000,
  publishedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseScheduledStream = {
  id: "sched123",
  platform: "youtube",
  title: "Upcoming Stream",
  url: "https://youtube.com/watch?v=sched123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "scheduled" as const,
  scheduledStartAt: new Date("2024-06-01T18:00:00Z"),
  raw: {},
};

describe("thumbnailSchema", () => {
  it.each([
    { name: "valid", input: validThumbnail, valid: true },
    {
      name: "invalid url",
      input: { ...validThumbnail, url: "not-url" },
      valid: false,
    },
    {
      name: "zero width",
      input: { ...validThumbnail, width: 0 },
      valid: false,
    },
    {
      name: "negative height",
      input: { ...validThumbnail, height: -1 },
      valid: false,
    },
    {
      name: "float width",
      input: { ...validThumbnail, width: 1.5 },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = thumbnailSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("channelRefSchema", () => {
  it.each([
    { name: "valid", input: validChannelRef, valid: true },
    { name: "empty id", input: { ...validChannelRef, id: "" }, valid: false },
    {
      name: "invalid url",
      input: { ...validChannelRef, url: "bad" },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = channelRefSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("liveStreamSchema", () => {
  it.each([
    { name: "valid", input: baseLiveStream, valid: true },
    {
      name: "with sessionId",
      input: { ...baseLiveStream, sessionId: "s1" },
      valid: true,
    },
    {
      name: "negative viewerCount",
      input: { ...baseLiveStream, viewerCount: -1 },
      valid: false,
    },
    {
      name: "missing startedAt",
      input: { ...baseLiveStream, startedAt: undefined },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = liveStreamSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("videoSchema", () => {
  it.each([
    { name: "valid", input: baseVideo, valid: true },
    {
      name: "negative duration",
      input: { ...baseVideo, duration: -1 },
      valid: false,
    },
    {
      name: "negative viewCount",
      input: { ...baseVideo, viewCount: -1 },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = videoSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("scheduledStreamSchema", () => {
  it.each([
    { name: "valid", input: baseScheduledStream, valid: true },
    {
      name: "with sessionId",
      input: { ...baseScheduledStream, sessionId: "s1" },
      valid: true,
    },
    {
      name: "missing scheduledStartAt",
      input: { ...baseScheduledStream, scheduledStartAt: undefined },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = scheduledStreamSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("contentSchema (discriminated union)", () => {
  it("parses live stream", () => {
    const result = contentSchema.parse(baseLiveStream);
    expect(result.type).toBe("live");
  });

  it("parses video", () => {
    const result = contentSchema.parse(baseVideo);
    expect(result.type).toBe("video");
  });

  it("parses scheduled stream", () => {
    const result = contentSchema.parse(baseScheduledStream);
    expect(result.type).toBe("scheduled");
  });

  it("rejects invalid type", () => {
    expect(() => contentSchema.parse({ ...baseLiveStream, type: "unknown" })).toThrow();
  });
});

describe("channelSchema", () => {
  it.each([
    {
      name: "valid with thumbnail",
      input: {
        id: "UC123",
        platform: "youtube",
        name: "Ch",
        url: "https://youtube.com/c/ch",
        thumbnail: validThumbnail,
      },
      valid: true,
    },
    {
      name: "valid without thumbnail",
      input: {
        id: "UC123",
        platform: "youtube",
        name: "Ch",
        url: "https://youtube.com/c/ch",
      },
      valid: true,
    },
    {
      name: "empty platform",
      input: {
        id: "UC123",
        platform: "",
        name: "Ch",
        url: "https://youtube.com/c/ch",
      },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = channelSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("broadcastSessionSchema", () => {
  it("parses valid session", () => {
    const result = broadcastSessionSchema.safeParse({
      sessionId: "s1",
      platform: "twitch",
      channel: validChannelRef,
      startedAt: new Date(),
      contentIds: { liveId: "l1" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty sessionId", () => {
    const result = broadcastSessionSchema.safeParse({
      sessionId: "",
      platform: "twitch",
      channel: validChannelRef,
      startedAt: new Date(),
      contentIds: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("resolvedUrlSchema", () => {
  it.each([
    {
      name: "content type",
      input: { platform: "youtube", type: "content", id: "abc" },
      valid: true,
    },
    {
      name: "channel type",
      input: { platform: "twitch", type: "channel", id: "xyz" },
      valid: true,
    },
    {
      name: "invalid type",
      input: { platform: "youtube", type: "playlist", id: "abc" },
      valid: false,
    },
    {
      name: "empty id",
      input: { platform: "youtube", type: "content", id: "" },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = resolvedUrlSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("Content type guards", () => {
  it("isLive narrows to LiveStream", () => {
    const content = contentSchema.parse(baseLiveStream);
    if (Content.isLive(content)) {
      expect(content.viewerCount).toBe(1000);
      expect(content.startedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be live");
    }
  });

  it("isVideo narrows to Video", () => {
    const content = contentSchema.parse(baseVideo);
    if (Content.isVideo(content)) {
      expect(content.duration).toBe(3600);
      expect(content.publishedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be video");
    }
  });

  it("isLive returns false for video", () => {
    const content = contentSchema.parse(baseVideo);
    expect(Content.isLive(content)).toBe(false);
  });

  it("isVideo returns false for live", () => {
    const content = contentSchema.parse(baseLiveStream);
    expect(Content.isVideo(content)).toBe(false);
  });

  it("isScheduled narrows to ScheduledStream", () => {
    const content = contentSchema.parse(baseScheduledStream);
    if (Content.isScheduled(content)) {
      expect(content.scheduledStartAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be scheduled");
    }
  });

  it("isScheduled returns false for live", () => {
    const content = contentSchema.parse(baseLiveStream);
    expect(Content.isScheduled(content)).toBe(false);
  });

  it("isScheduled returns false for video", () => {
    const content = contentSchema.parse(baseVideo);
    expect(Content.isScheduled(content)).toBe(false);
  });
});

describe("LiveStream.is", () => {
  it("returns true for valid LiveStream", () => {
    expect(LiveStream.is(baseLiveStream)).toBe(true);
  });

  it("returns false for Video", () => {
    expect(LiveStream.is(baseVideo)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(LiveStream.is("not an object")).toBe(false);
  });
});

describe("Video.is", () => {
  it("returns true for valid Video", () => {
    expect(Video.is(baseVideo)).toBe(true);
  });

  it("returns false for LiveStream", () => {
    expect(Video.is(baseLiveStream)).toBe(false);
  });
});

describe("Channel.is", () => {
  it("returns true for valid Channel", () => {
    const channel = {
      id: "ch1",
      platform: "test",
      name: "Test Channel",
      url: "https://example.com/ch1",
    };
    expect(Channel.is(channel)).toBe(true);
  });

  it("returns false for invalid object", () => {
    expect(Channel.is({ id: "ch1" })).toBe(false);
  });
});

describe("ScheduledStream.is", () => {
  it("returns true for valid ScheduledStream", () => {
    expect(ScheduledStream.is(baseScheduledStream)).toBe(true);
  });

  it("returns false for LiveStream", () => {
    expect(ScheduledStream.is(baseLiveStream)).toBe(false);
  });

  it("returns false for Video", () => {
    expect(ScheduledStream.is(baseVideo)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(ScheduledStream.is("not an object")).toBe(false);
  });
});

describe("BroadcastSession.is", () => {
  it("returns true for valid BroadcastSession", () => {
    const session = {
      sessionId: "s1",
      platform: "twitch",
      channel: validChannelRef,
      startedAt: new Date(),
      contentIds: { liveId: "l1" },
    };
    expect(BroadcastSession.is(session)).toBe(true);
  });

  it("returns false for invalid object", () => {
    expect(BroadcastSession.is({ sessionId: "" })).toBe(false);
  });
});

describe("Page.map", () => {
  it("transforms items while preserving pagination metadata", () => {
    const page: Page<{ id: string; name: string }> = {
      items: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ],
      cursor: "next-page",
      total: 10,
      hasMore: true,
    };

    const mapped = Page.map(page, (item) => item.id);
    expect(mapped.items).toEqual(["1", "2"]);
    expect(mapped.cursor).toBe("next-page");
    expect(mapped.total).toBe(10);
    expect(mapped.hasMore).toBe(true);
  });

  it("handles empty page", () => {
    const page: Page<string> = { items: [], hasMore: false };
    const mapped = Page.map(page, (s) => s.length);
    expect(mapped.items).toEqual([]);
    expect(mapped.hasMore).toBe(false);
  });
});

describe("Page.empty", () => {
  it("creates an empty page", () => {
    const page = Page.empty<string>();
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor).toBeUndefined();
    expect(page.total).toBeUndefined();
  });
});

describe("BatchResult.empty", () => {
  it("creates empty BatchResult", () => {
    const result = BatchResult.empty<Content>();
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});

describe("searchOptionsSchema", () => {
  it.each([
    { name: "query only", input: { query: "vspo" }, valid: true },
    { name: "status only", input: { status: "live" }, valid: true },
    { name: "query + status", input: { query: "vspo", status: "upcoming" }, valid: true },
    { name: "with limit", input: { query: "vspo", limit: 50 }, valid: true },
    { name: "with cursor", input: { query: "vspo", cursor: "abc" }, valid: true },
    {
      name: "full options",
      input: { query: "test", status: "ended", limit: 10, cursor: "c1" },
      valid: true,
    },
    { name: "invalid status", input: { query: "test", status: "invalid" }, valid: false },
    { name: "zero limit", input: { query: "test", limit: 0 }, valid: false },
    { name: "negative limit", input: { query: "test", limit: -1 }, valid: false },
    { name: "limit over 100", input: { query: "test", limit: 101 }, valid: false },
    { name: "float limit", input: { query: "test", limit: 1.5 }, valid: false },
    { name: "empty object", input: {}, valid: true },
  ])("$name", ({ input, valid }) => {
    const result = searchOptionsSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});
