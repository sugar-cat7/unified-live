import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  NotFoundError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
} from "../errors.js";

describe("UnifiedLiveError hierarchy", () => {
  it.each([
    {
      name: "QuotaExhaustedError",
      error: new QuotaExhaustedError("youtube", {
        consumed: 9500,
        limit: 10000,
        resetsAt: new Date("2024-01-02T08:00:00Z"),
        requestedCost: 100,
      }),
      code: "QUOTA_EXHAUSTED",
      platform: "youtube",
    },
    {
      name: "AuthenticationError",
      error: new AuthenticationError("twitch"),
      code: "AUTHENTICATION",
      platform: "twitch",
    },
    {
      name: "RateLimitError",
      error: new RateLimitError("twitcasting", 30),
      code: "RATE_LIMITED",
      platform: "twitcasting",
    },
    {
      name: "PlatformNotFoundError",
      error: new PlatformNotFoundError("unknown"),
      code: "PLATFORM_NOT_FOUND",
      platform: "unknown",
    },
    {
      name: "NotFoundError",
      error: new NotFoundError("youtube", "abc123"),
      code: "NOT_FOUND",
      platform: "youtube",
    },
  ])("$name is instanceof UnifiedLiveError", ({ error, code, platform }) => {
    expect(error).toBeInstanceOf(UnifiedLiveError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.platform).toBe(platform);
    expect(error.message).toBeTruthy();
  });
});

describe("QuotaExhaustedError", () => {
  it("exposes details", () => {
    const resetsAt = new Date("2024-01-02T08:00:00Z");
    const error = new QuotaExhaustedError("youtube", {
      consumed: 9500,
      limit: 10000,
      resetsAt,
      requestedCost: 100,
    });
    expect(error.details.consumed).toBe(9500);
    expect(error.details.limit).toBe(10000);
    expect(error.details.resetsAt).toBe(resetsAt);
    expect(error.details.requestedCost).toBe(100);
    expect(error.message).toContain("9500/10000");
  });
});

describe("AuthenticationError", () => {
  it("uses default message", () => {
    const error = new AuthenticationError("twitch");
    expect(error.message).toBe("Authentication failed");
  });

  it("uses custom message", () => {
    const error = new AuthenticationError("twitch", "Token expired");
    expect(error.message).toBe("Token expired");
  });
});

describe("RateLimitError", () => {
  it("includes retryAfter", () => {
    const error = new RateLimitError("twitch", 30);
    expect(error.retryAfter).toBe(30);
    expect(error.message).toContain("30");
  });

  it("handles missing retryAfter", () => {
    const error = new RateLimitError("twitch");
    expect(error.retryAfter).toBeUndefined();
    expect(error.message).toBe("Rate limited");
  });
});

describe("NotFoundError", () => {
  it("includes resource id in message", () => {
    const error = new NotFoundError("youtube", "abc123");
    expect(error.message).toContain("abc123");
    expect(error.message).toContain("youtube");
  });
});

describe("PlatformNotFoundError", () => {
  it("includes platform name in message", () => {
    const error = new PlatformNotFoundError("unknown");
    expect(error.message).toContain("unknown");
  });
});
