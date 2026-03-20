import { describe, expect, it } from "vitest";
import {
  BatchResult,
  BroadcastSession,
  broadcastSessionSchema,
  Channel,
  channelRefSchema,
  channelSchema,
  Clip,
  clipOptionsSchema,
  clipSchema,
  Content,
  contentSchema,
  knownPlatforms,
  Broadcast,
  broadcastSchema,
  Page,
  resolvedUrlSchema,
  ScheduledBroadcast,
  scheduledBroadcastSchema,
  searchOptionsSchema,
  thumbnailSchema,
  Archive,
  archiveSchema,
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

const baseBroadcast = {
  id: "abc123",
  platform: "youtube",
  title: "Test Live",
  description: "Test live stream description",
  tags: ["tag1", "tag2"],
  url: "https://youtube.com/watch?v=abc123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "broadcast" as const,
  viewerCount: 1000,
  startedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseArchive = {
  id: "xyz789",
  platform: "youtube",
  title: "Test Video",
  description: "Test video description",
  tags: [],
  url: "https://youtube.com/watch?v=xyz789",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "archive" as const,
  duration: 3600,
  viewCount: 50000,
  publishedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseScheduledBroadcast = {
  id: "sched123",
  platform: "youtube",
  title: "Upcoming Stream",
  description: "",
  tags: ["upcoming"],
  url: "https://youtube.com/watch?v=sched123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "scheduled" as const,
  scheduledStartAt: new Date("2024-06-01T18:00:00Z"),
  raw: {},
};

const baseClip = {
  id: "clip123",
  platform: "twitch",
  title: "Amazing Play",
  description: "",
  tags: [],
  url: "https://clips.twitch.tv/clip123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "clip" as const,
  duration: 30,
  viewCount: 1000,
  createdAt: new Date("2024-03-15T12:00:00Z"),
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

describe("broadcastSchema", () => {
  it.each([
    { name: "valid", input: baseBroadcast, valid: true },
    {
      name: "with sessionId",
      input: { ...baseBroadcast, sessionId: "s1" },
      valid: true,
    },
    {
      name: "negative viewerCount",
      input: { ...baseBroadcast, viewerCount: -1 },
      valid: false,
    },
    {
      name: "missing startedAt",
      input: { ...baseBroadcast, startedAt: undefined },
      valid: false,
    },
    {
      name: "with endedAt",
      input: { ...baseBroadcast, endedAt: new Date("2024-01-01T01:00:00Z") },
      valid: true,
    },
    {
      name: "without endedAt",
      input: baseBroadcast,
      valid: true,
    },
  ])("$name", ({ input, valid }) => {
    const result = broadcastSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("archiveSchema", () => {
  it.each([
    { name: "valid", input: baseArchive, valid: true },
    {
      name: "negative duration",
      input: { ...baseArchive, duration: -1 },
      valid: false,
    },
    {
      name: "negative viewCount",
      input: { ...baseArchive, viewCount: -1 },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = archiveSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });

  it("accepts optional startedAt and endedAt", () => {
    const result = archiveSchema.safeParse({
      ...baseArchive,
      startedAt: new Date("2024-01-01T00:00:00Z"),
      endedAt: new Date("2024-01-01T01:00:00Z"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(result.data.endedAt).toEqual(new Date("2024-01-01T01:00:00Z"));
    }
  });

  it("accepts video without startedAt/endedAt", () => {
    const result = archiveSchema.safeParse(baseArchive);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startedAt).toBeUndefined();
      expect(result.data.endedAt).toBeUndefined();
    }
  });
});

describe("contentBaseSchema languageCode", () => {
  it("accepts content with languageCode", () => {
    const result = broadcastSchema.safeParse({ ...baseBroadcast, languageCode: "ja" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.languageCode).toBe("ja");
    }
  });

  it("accepts content without languageCode", () => {
    const result = broadcastSchema.safeParse(baseBroadcast);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.languageCode).toBeUndefined();
    }
  });
});

describe("scheduledBroadcastSchema", () => {
  it.each([
    { name: "valid", input: baseScheduledBroadcast, valid: true },
    {
      name: "with sessionId",
      input: { ...baseScheduledBroadcast, sessionId: "s1" },
      valid: true,
    },
    {
      name: "missing scheduledStartAt",
      input: { ...baseScheduledBroadcast, scheduledStartAt: undefined },
      valid: false,
    },
    {
      name: "string scheduledStartAt rejected (no coercion)",
      input: { ...baseScheduledBroadcast, scheduledStartAt: "2024-06-01T18:00:00Z" },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = scheduledBroadcastSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("contentSchema (discriminated union)", () => {
  it("parses broadcast", () => {
    const result = contentSchema.parse(baseBroadcast);
    expect(result.type).toBe("broadcast");
  });

  it("parses archive", () => {
    const result = contentSchema.parse(baseArchive);
    expect(result.type).toBe("archive");
  });

  it("parses scheduled broadcast", () => {
    const result = contentSchema.parse(baseScheduledBroadcast);
    expect(result.type).toBe("scheduled");
  });

  it("rejects invalid type", () => {
    expect(() => contentSchema.parse({ ...baseBroadcast, type: "unknown" })).toThrow();
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
      contentIds: { broadcastId: "l1" },
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
  it("isBroadcast narrows to Broadcast", () => {
    const content = contentSchema.parse(baseBroadcast);
    if (Content.isBroadcast(content)) {
      expect(content.viewerCount).toBe(1000);
      expect(content.startedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be broadcast");
    }
  });

  it("isArchive narrows to Archive", () => {
    const content = contentSchema.parse(baseArchive);
    if (Content.isArchive(content)) {
      expect(content.duration).toBe(3600);
      expect(content.publishedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be archive");
    }
  });

  it("isBroadcast returns false for archive", () => {
    const content = contentSchema.parse(baseArchive);
    expect(Content.isBroadcast(content)).toBe(false);
  });

  it("isArchive returns false for broadcast", () => {
    const content = contentSchema.parse(baseBroadcast);
    expect(Content.isArchive(content)).toBe(false);
  });

  it("isScheduledBroadcast narrows to ScheduledBroadcast", () => {
    const content = contentSchema.parse(baseScheduledBroadcast);
    if (Content.isScheduledBroadcast(content)) {
      expect(content.scheduledStartAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be scheduled broadcast");
    }
  });

  it("isScheduledBroadcast returns false for broadcast", () => {
    const content = contentSchema.parse(baseBroadcast);
    expect(Content.isScheduledBroadcast(content)).toBe(false);
  });

  it("isScheduledBroadcast returns false for archive", () => {
    const content = contentSchema.parse(baseArchive);
    expect(Content.isScheduledBroadcast(content)).toBe(false);
  });
});

describe("Broadcast.is", () => {
  it("returns true for valid Broadcast", () => {
    expect(Broadcast.is(baseBroadcast)).toBe(true);
  });

  it("returns false for Archive", () => {
    expect(Broadcast.is(baseArchive)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(Broadcast.is("not an object")).toBe(false);
  });
});

describe("Archive.is", () => {
  it("returns true for valid Archive", () => {
    expect(Archive.is(baseArchive)).toBe(true);
  });

  it("returns false for Broadcast", () => {
    expect(Archive.is(baseBroadcast)).toBe(false);
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

describe("ScheduledBroadcast.is", () => {
  it("returns true for valid ScheduledBroadcast", () => {
    expect(ScheduledBroadcast.is(baseScheduledBroadcast)).toBe(true);
  });

  it("returns false for Broadcast", () => {
    expect(ScheduledBroadcast.is(baseBroadcast)).toBe(false);
  });

  it("returns false for Archive", () => {
    expect(ScheduledBroadcast.is(baseArchive)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(ScheduledBroadcast.is("not an object")).toBe(false);
  });
});

describe("BroadcastSession.is", () => {
  it("returns true for valid BroadcastSession", () => {
    const session = {
      sessionId: "s1",
      platform: "twitch",
      channel: validChannelRef,
      startedAt: new Date(),
      contentIds: { broadcastId: "l1" },
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

describe("clipSchema", () => {
  it.each([
    { name: "valid clip", input: baseClip, valid: true },
    {
      name: "clip with all optional fields",
      input: {
        ...baseClip,
        clipCreator: { id: "user1", name: "ClipMaster" },
        embedUrl: "https://clips.twitch.tv/embed/clip123",
        vodOffset: 3600,
        isFeatured: true,
        gameId: "12345",
        languageCode: "en",
      },
      valid: true,
    },
    {
      name: "reject negative duration",
      input: { ...baseClip, duration: -1 },
      valid: false,
    },
  ])("$name", ({ input, valid }) => {
    const result = clipSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("Content.isClip", () => {
  it("returns true for clip", () => {
    const content = contentSchema.parse(baseClip);
    expect(Content.isClip(content)).toBe(true);
  });

  it("returns false for broadcast", () => {
    const content = contentSchema.parse(baseBroadcast);
    expect(Content.isClip(content)).toBe(false);
  });
});

describe("Clip.is", () => {
  it("returns true for valid Clip", () => {
    expect(Clip.is(baseClip)).toBe(true);
  });

  it("returns false for Broadcast", () => {
    expect(Clip.is(baseBroadcast)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(Clip.is("not an object")).toBe(false);
  });
});

describe("clipOptionsSchema", () => {
  it.each([
    { name: "empty options valid", input: {}, valid: true },
    {
      name: "all options valid",
      input: {
        startedAt: new Date("2024-01-01T00:00:00Z"),
        endedAt: new Date("2024-12-31T23:59:59Z"),
        limit: 25,
        cursor: "abc123",
        isFeatured: true,
      },
      valid: true,
    },
    { name: "limit over 100 rejected", input: { limit: 101 }, valid: false },
  ])("$name", ({ input, valid }) => {
    const result = clipOptionsSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("knownPlatforms", () => {
  it.each([
    { name: "accepts youtube", input: "youtube", valid: true },
    { name: "accepts twitch", input: "twitch", valid: true },
    { name: "accepts twitcasting", input: "twitcasting", valid: true },
    { name: "rejects unknown", input: "unknown", valid: false },
  ])("$name", ({ input, valid }) => {
    const result = knownPlatforms.safeParse(input);
    expect(result.success).toBe(valid);
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
    { name: "channelId only", input: { channelId: "UC123" }, valid: true },
    { name: "channelId + status", input: { channelId: "UC123", status: "live" }, valid: true },
    { name: "order relevance", input: { query: "test", order: "relevance" }, valid: true },
    { name: "order date", input: { query: "test", order: "date" }, valid: true },
    { name: "invalid order", input: { query: "test", order: "popular" }, valid: false },
    { name: "empty channelId", input: { channelId: "" }, valid: false },
  ])("$name", ({ input, valid }) => {
    const result = searchOptionsSchema.safeParse(input);
    expect(result.success).toBe(valid);
  });
});

describe("channelSchema extensions", () => {
  const validChannel = {
    id: "UC123",
    platform: "youtube",
    name: "Test",
    url: "https://youtube.com/channel/UC123",
  };
  it("accepts channel with new optional fields", () => {
    const result = channelSchema.safeParse({
      ...validChannel,
      description: "A great channel",
      subscriberCount: 100000,
      publishedAt: new Date("2020-01-01"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("A great channel");
      expect(result.data.subscriberCount).toBe(100000);
    }
  });
  it("still accepts channel without new fields", () => {
    expect(channelSchema.safeParse(validChannel).success).toBe(true);
  });
  it("rejects negative subscriberCount", () => {
    expect(channelSchema.safeParse({ ...validChannel, subscriberCount: -1 }).success).toBe(false);
  });
});

describe("searchOptionsSchema extensions", () => {
  it.each(["relevance", "date", "rating", "title", "videoCount", "viewCount"])(
    "accepts order=%s",
    (o) => {
      expect(searchOptionsSchema.safeParse({ query: "test", order: o }).success).toBe(true);
    },
  );
  it.each(["moderate", "none", "strict"])("accepts safeSearch=%s", (s) => {
    expect(searchOptionsSchema.safeParse({ query: "test", safeSearch: s }).success).toBe(true);
  });
  it("accepts languageCode", () => {
    expect(searchOptionsSchema.safeParse({ query: "test", languageCode: "ja" }).success).toBe(true);
  });
});
