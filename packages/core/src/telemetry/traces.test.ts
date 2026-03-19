import { trace } from "@opentelemetry/api";
import { describe, expect, it, vi } from "vitest";
import { getTracer, SpanAttributes } from "./traces.js";

describe("getTracer", () => {
  it("returns a tracer object", () => {
    const tracer = getTracer();
    expect(tracer).toBeDefined();
    expect(typeof tracer.startActiveSpan).toBe("function");
    expect(typeof tracer.startSpan).toBe("function");
  });

  it("passes tracer name and version to trace.getTracer", () => {
    const spy = vi.spyOn(trace, "getTracer");
    getTracer();
    expect(spy).toHaveBeenCalledWith("unified-live", expect.any(String));
    spy.mockRestore();
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
    ["SERVER_ADDRESS", "server.address"],
    ["SERVER_PORT", "server.port"],
    ["ERROR_CODE", "unified_live.error.code"],
    ["ERROR_TYPE", "error.type"],
    ["ERROR_HAS_CAUSE", "unified_live.error.has_cause"],
    ["RETRY_COUNT", "unified_live.retry.count"],
  ] as const)("has %s = %s", (key, expected) => {
    expect(SpanAttributes[key]).toBe(expected);
  });

  it("has exactly 12 attribute keys", () => {
    expect(Object.keys(SpanAttributes)).toHaveLength(12);
  });
});
