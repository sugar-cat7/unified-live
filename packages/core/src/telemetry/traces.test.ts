import { describe, expect, it } from "vitest";
import { getTracer, SpanAttributes } from "./traces.js";

describe("getTracer", () => {
  it("returns a tracer object", () => {
    const tracer = getTracer();
    expect(tracer).toBeDefined();
    expect(typeof tracer.startActiveSpan).toBe("function");
    expect(typeof tracer.startSpan).toBe("function");
  });

  it("returns a tracer on repeated calls", () => {
    const a = getTracer();
    const b = getTracer();
    expect(typeof a.startActiveSpan).toBe("function");
    expect(typeof b.startActiveSpan).toBe("function");
  });

  it("startActiveSpan executes the callback and returns its value", () => {
    const tracer = getTracer();
    const result = tracer.startActiveSpan("test-span", (span) => {
      span.end();
      return 42;
    });
    expect(result).toBe(42);
  });
});

describe("SpanAttributes", () => {
  it.each([
    ["PLATFORM", "unified_live.platform"],
    ["HTTP_METHOD", "http.request.method"],
    ["URL_PATH", "url.path"],
    ["HTTP_STATUS", "http.response.status_code"],
    ["RATE_LIMIT_REMAINING", "unified_live.rate_limit.remaining"],
    ["RATE_LIMIT_LIMIT", "unified_live.rate_limit.limit"],
    ["QUOTA_CONSUMED", "unified_live.quota.consumed"],
    ["QUOTA_DAILY_REMAINING", "unified_live.quota.daily_remaining"],
    ["ERROR_CODE", "error.code"],
    ["ERROR_TYPE", "error.type"],
    ["ERROR_HAS_CAUSE", "error.has_cause"],
  ] as const)("has %s = %s", (key, expected) => {
    expect(SpanAttributes[key]).toBe(expected);
  });

  it("has exactly 11 attribute keys", () => {
    expect(Object.keys(SpanAttributes)).toHaveLength(11);
  });
});
