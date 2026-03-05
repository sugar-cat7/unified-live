import { describe, expect, it } from "vitest";
import {
  broadcastSessionSchema,
  Content,
  channelRefSchema,
  channelSchema,
  contentSchema,
  liveStreamSchema,
  resolvedUrlSchema,
  thumbnailSchema,
  videoSchema,
} from "../types.js";

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

describe("contentSchema (discriminated union)", () => {
  it("parses live stream", () => {
    const result = contentSchema.parse(baseLiveStream);
    expect(result.type).toBe("live");
  });

  it("parses video", () => {
    const result = contentSchema.parse(baseVideo);
    expect(result.type).toBe("video");
  });

  it("rejects invalid type", () => {
    expect(() =>
      contentSchema.parse({ ...baseLiveStream, type: "unknown" }),
    ).toThrow();
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
});
