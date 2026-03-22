import { describe, expect, it } from "vitest";
import {
  Archive,
  BatchResult,
  Broadcast,
  BroadcastSession,
  Channel,
  Clip,
  Content,
  knownPlatforms,
  Page,
  ScheduledBroadcast,
} from "./types";
import type { Broadcast as BroadcastType, Content as ContentType } from "./types";

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

const baseBroadcast: BroadcastType = {
  id: "abc123",
  platform: "youtube",
  title: "Test Live",
  description: "Test live stream description",
  tags: ["tag1", "tag2"],
  url: "https://youtube.com/watch?v=abc123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "broadcast",
  viewerCount: 1000,
  startedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseArchive: ContentType = {
  id: "xyz789",
  platform: "youtube",
  title: "Test Video",
  description: "Test video description",
  tags: [],
  url: "https://youtube.com/watch?v=xyz789",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "archive",
  duration: 3600,
  viewCount: 50000,
  publishedAt: new Date("2024-01-01T00:00:00Z"),
  raw: {},
};

const baseScheduledBroadcast: ContentType = {
  id: "sched123",
  platform: "youtube",
  title: "Upcoming Stream",
  description: "",
  tags: ["upcoming"],
  url: "https://youtube.com/watch?v=sched123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "scheduled",
  scheduledStartAt: new Date("2024-06-01T18:00:00Z"),
  raw: {},
};

const baseClip: ContentType = {
  id: "clip123",
  platform: "twitch",
  title: "Amazing Play",
  description: "",
  tags: [],
  url: "https://clips.twitch.tv/clip123",
  thumbnail: validThumbnail,
  channel: validChannelRef,
  type: "clip",
  duration: 30,
  viewCount: 1000,
  createdAt: new Date("2024-03-15T12:00:00Z"),
  raw: {},
};

describe("Content type guards", () => {
  it("isBroadcast narrows to Broadcast", () => {
    const content: ContentType = baseBroadcast;
    if (Content.isBroadcast(content)) {
      expect(content.viewerCount).toBe(1000);
      expect(content.startedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be broadcast");
    }
  });

  it("isArchive narrows to Archive", () => {
    const content: ContentType = baseArchive;
    if (Content.isArchive(content)) {
      expect(content.duration).toBe(3600);
      expect(content.publishedAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be archive");
    }
  });

  it("isBroadcast returns false for archive", () => {
    const content: ContentType = baseArchive;
    expect(Content.isBroadcast(content)).toBe(false);
  });

  it("isArchive returns false for broadcast", () => {
    const content: ContentType = baseBroadcast;
    expect(Content.isArchive(content)).toBe(false);
  });

  it("isScheduledBroadcast narrows to ScheduledBroadcast", () => {
    const content: ContentType = baseScheduledBroadcast;
    if (Content.isScheduledBroadcast(content)) {
      expect(content.scheduledStartAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be scheduled broadcast");
    }
  });

  it("isScheduledBroadcast returns false for broadcast", () => {
    const content: ContentType = baseBroadcast;
    expect(Content.isScheduledBroadcast(content)).toBe(false);
  });

  it("isScheduledBroadcast returns false for archive", () => {
    const content: ContentType = baseArchive;
    expect(Content.isScheduledBroadcast(content)).toBe(false);
  });

  it("isClip narrows to Clip", () => {
    const content: ContentType = baseClip;
    if (Content.isClip(content)) {
      expect(content.duration).toBe(30);
      expect(content.createdAt).toBeInstanceOf(Date);
    } else {
      expect.unreachable("Should be clip");
    }
  });

  it("isClip returns false for broadcast", () => {
    const content: ContentType = baseBroadcast;
    expect(Content.isClip(content)).toBe(false);
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

describe("knownPlatforms", () => {
  it("contains expected platforms", () => {
    expect(knownPlatforms).toEqual(["youtube", "twitch", "twitcasting"]);
  });

  it("has correct length", () => {
    expect(knownPlatforms).toHaveLength(3);
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
    const result = BatchResult.empty<ContentType>();
    expect(result.values.size).toBe(0);
    expect(result.errors.size).toBe(0);
  });
});
