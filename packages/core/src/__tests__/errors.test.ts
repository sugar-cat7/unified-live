import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  classifyNetworkError,
  NetworkError,
  NotFoundError,
  ParseError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
  ValidationError,
} from "../errors.js";

describe("UnifiedLiveError hierarchy", () => {
  it.each([
    {
      name: "NotFoundError",
      error: new NotFoundError("youtube", "abc123"),
      code: "NOT_FOUND",
      platform: "youtube",
    },
    {
      name: "AuthenticationError",
      error: new AuthenticationError("twitch"),
      code: "AUTHENTICATION_INVALID",
      platform: "twitch",
    },
    {
      name: "RateLimitError",
      error: new RateLimitError("twitcasting", { retryAfter: 30 }),
      code: "RATE_LIMIT_EXCEEDED",
      platform: "twitcasting",
    },
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
      name: "PlatformNotFoundError",
      error: new PlatformNotFoundError("unknown"),
      code: "PLATFORM_NOT_FOUND",
      platform: "unknown",
    },
    {
      name: "NetworkError",
      error: new NetworkError("youtube", "NETWORK_TIMEOUT"),
      code: "NETWORK_TIMEOUT",
      platform: "youtube",
    },
    {
      name: "ParseError",
      error: new ParseError("youtube", "PARSE_JSON"),
      code: "PARSE_JSON",
      platform: "youtube",
    },
    {
      name: "ValidationError",
      error: new ValidationError(
        "VALIDATION_INVALID_INPUT",
        "URL must be a non-empty string",
      ),
      code: "VALIDATION_INVALID_INPUT",
      platform: "unknown",
    },
  ])("$name is instanceof UnifiedLiveError with correct code and platform", ({
    error,
    code,
    platform,
  }) => {
    expect(error).toBeInstanceOf(UnifiedLiveError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.platform).toBe(platform);
    expect(error.context.platform).toBe(platform);
    expect(error.message).toBeTruthy();
  });
});

describe("UnifiedLiveError base", () => {
  it("platform getter returns context.platform", () => {
    const error = new UnifiedLiveError("test", "INTERNAL", {
      platform: "youtube",
    });
    expect(error.platform).toBe("youtube");
    expect(error.context.platform).toBe("youtube");
  });

  it("preserves cause via ES2022 Error.cause", () => {
    const cause = new Error("original");
    const error = new UnifiedLiveError(
      "wrapped",
      "INTERNAL",
      {
        platform: "youtube",
      },
      { cause },
    );
    expect(error.cause).toBe(cause);
  });

  it("sets ErrorContext fields correctly", () => {
    const error = new UnifiedLiveError("test", "INTERNAL", {
      platform: "youtube",
      method: "GET",
      path: "/videos",
      status: 500,
      resourceId: "abc123",
    });
    expect(error.context).toEqual({
      platform: "youtube",
      method: "GET",
      path: "/videos",
      status: 500,
      resourceId: "abc123",
    });
  });
});

describe("NotFoundError", () => {
  it("includes resource id in message", () => {
    const error = new NotFoundError("youtube", "abc123");
    expect(error.message).toContain("abc123");
    expect(error.message).toContain("youtube");
    expect(error.context.resourceId).toBe("abc123");
  });

  it("preserves cause", () => {
    const cause = new Error("upstream");
    const error = new NotFoundError("youtube", "abc123", { cause });
    expect(error.cause).toBe(cause);
  });
});

describe("AuthenticationError", () => {
  it("uses default message and code", () => {
    const error = new AuthenticationError("twitch");
    expect(error.message).toBe("Authentication failed");
    expect(error.code).toBe("AUTHENTICATION_INVALID");
  });

  it("accepts options object with code, message, and cause", () => {
    const cause = new Error("token expired");
    const error = new AuthenticationError("twitch", {
      code: "AUTHENTICATION_EXPIRED",
      message: "Token expired",
      cause,
    });
    expect(error.code).toBe("AUTHENTICATION_EXPIRED");
    expect(error.message).toBe("Token expired");
    expect(error.cause).toBe(cause);
  });
});

describe("RateLimitError", () => {
  it("includes retryAfter", () => {
    const error = new RateLimitError("twitch", { retryAfter: 30 });
    expect(error.retryAfter).toBe(30);
    expect(error.message).toContain("30");
  });

  it("handles missing retryAfter", () => {
    const error = new RateLimitError("twitch");
    expect(error.retryAfter).toBeUndefined();
    expect(error.message).toBe("Rate limited");
  });

  it("preserves cause", () => {
    const cause = new Error("429");
    const error = new RateLimitError("twitch", { retryAfter: 10, cause });
    expect(error.cause).toBe(cause);
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

  it("preserves cause", () => {
    const cause = new Error("quota api");
    const error = new QuotaExhaustedError(
      "youtube",
      {
        consumed: 100,
        limit: 100,
        resetsAt: new Date(),
        requestedCost: 1,
      },
      { cause },
    );
    expect(error.cause).toBe(cause);
  });
});

describe("NetworkError", () => {
  it.each([
    "NETWORK_TIMEOUT",
    "NETWORK_CONNECTION",
    "NETWORK_DNS",
    "NETWORK_ABORT",
  ] as const)("creates with code %s", (code) => {
    const error = new NetworkError("youtube", code);
    expect(error.code).toBe(code);
    expect(error.message).toContain(code);
    expect(error.name).toBe("NetworkError");
  });

  it("sets path, method, and cause", () => {
    const cause = new TypeError("fetch failed");
    const error = new NetworkError("youtube", "NETWORK_CONNECTION", {
      message: "Connection refused",
      path: "/videos",
      method: "GET",
      cause,
    });
    expect(error.context.path).toBe("/videos");
    expect(error.context.method).toBe("GET");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Connection refused");
  });
});

describe("ParseError", () => {
  it.each([
    "PARSE_JSON",
    "PARSE_RESPONSE",
  ] as const)("creates with code %s", (code) => {
    const error = new ParseError("youtube", code);
    expect(error.code).toBe(code);
    expect(error.name).toBe("ParseError");
  });

  it("sets path, status, and cause", () => {
    const cause = new SyntaxError("Unexpected token");
    const error = new ParseError("youtube", "PARSE_JSON", {
      message: "Failed to parse JSON",
      path: "/videos",
      status: 200,
      cause,
    });
    expect(error.context.path).toBe("/videos");
    expect(error.context.status).toBe(200);
    expect(error.cause).toBe(cause);
  });
});

describe("ValidationError", () => {
  it.each([
    "VALIDATION_INVALID_URL",
    "VALIDATION_INVALID_INPUT",
  ] as const)("creates with code %s", (code) => {
    const error = new ValidationError(code, "Invalid input");
    expect(error.code).toBe(code);
    expect(error.name).toBe("ValidationError");
    expect(error.platform).toBe("unknown");
  });

  it("accepts optional platform", () => {
    const error = new ValidationError("VALIDATION_INVALID_URL", "Bad URL", {
      platform: "youtube",
    });
    expect(error.platform).toBe("youtube");
  });
});

describe("PlatformNotFoundError", () => {
  it("includes platform name in message", () => {
    const error = new PlatformNotFoundError("unknown");
    expect(error.message).toContain("unknown");
    expect(error.code).toBe("PLATFORM_NOT_FOUND");
  });
});

describe("classifyNetworkError", () => {
  it("classifies AbortError", () => {
    const error = new DOMException("The operation was aborted", "AbortError");
    expect(classifyNetworkError(error)).toBe("NETWORK_ABORT");
  });

  it("classifies abort in message", () => {
    const error = new Error("Request aborted by user");
    expect(classifyNetworkError(error)).toBe("NETWORK_ABORT");
  });

  it("classifies TimeoutError", () => {
    const error = new DOMException("Signal timed out", "TimeoutError");
    expect(classifyNetworkError(error)).toBe("NETWORK_TIMEOUT");
  });

  it("classifies timeout in message", () => {
    const error = new Error("request timeout");
    expect(classifyNetworkError(error)).toBe("NETWORK_TIMEOUT");
  });

  it("classifies DNS errors", () => {
    const error = new Error("getaddrinfo ENOTFOUND example.com");
    expect(classifyNetworkError(error)).toBe("NETWORK_DNS");
  });

  it("classifies dns in message", () => {
    const error = new Error("DNS lookup failed");
    expect(classifyNetworkError(error)).toBe("NETWORK_DNS");
  });

  it("defaults to NETWORK_CONNECTION", () => {
    const error = new TypeError("fetch failed");
    expect(classifyNetworkError(error)).toBe("NETWORK_CONNECTION");
  });
});
