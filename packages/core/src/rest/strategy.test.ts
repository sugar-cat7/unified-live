import { describe, expect, it } from "vitest";
import { createTokenBucketStrategy } from "./bucket";
import { RateLimitStrategy } from "./strategy";
import type { RateLimitInfo } from "./types";

const noopParseHeaders = (): RateLimitInfo | undefined => undefined;

describe("RateLimitStrategy.is", () => {
  it.each([null, undefined, "string", 42, true])(
    "returns false for non-object value: %s",
    (value) => {
      expect(RateLimitStrategy.is(value)).toBe(false);
    },
  );

  it("returns true for a token bucket strategy", () => {
    const strategy = createTokenBucketStrategy({
      global: { requests: 10, perMs: 60_000 },
      parseHeaders: noopParseHeaders,
      platform: "test",
    });
    expect(RateLimitStrategy.is(strategy)).toBe(true);
  });

  it("returns false for partial object missing methods", () => {
    expect(RateLimitStrategy.is({ acquire: () => {} })).toBe(false);
    expect(RateLimitStrategy.is({ acquire: () => {}, getStatus: () => {} })).toBe(true);
  });

  it("returns false for object with non-function properties", () => {
    expect(
      RateLimitStrategy.is({
        acquire: "not a function",
        getStatus: () => {},
      }),
    ).toBe(false);
  });

  it("returns true for manually constructed object with all methods", () => {
    const fake = {
      acquire: async () => ({ complete: () => {}, release: () => {} }),
      getStatus: () => ({ remaining: 0, limit: 0, resetsAt: new Date(), queued: 0 }),
    };
    expect(RateLimitStrategy.is(fake)).toBe(true);
  });
});
