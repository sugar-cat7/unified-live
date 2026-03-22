import {
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_SCHEME,
} from "@opentelemetry/semantic-conventions";
import { describe, expect, it, vi } from "vitest";
import { SPAN_STATUS_ERROR } from "./otel-types";
import { getTracer, SpanAttributes, withSpan } from "./traces.js";

describe("getTracer", () => {
  it("returns a no-op tracer by default", () => {
    const tracer = getTracer();
    expect(tracer).toBeDefined();
    expect(typeof tracer.startActiveSpan).toBe("function");
  });

  it("no-op tracer executes callback and returns its value", () => {
    const tracer = getTracer();
    const result = tracer.startActiveSpan("test-span", (span) => {
      span.end();
      return 42;
    });
    expect(result).toBe(42);
  });

  it("accepts a custom TracerProvider", () => {
    const mockTracer = {
      startSpan: vi.fn(),
      startActiveSpan: vi.fn(),
    };
    const mockProvider = {
      getTracer: vi.fn().mockReturnValue(mockTracer),
    };

    const tracer = getTracer(mockProvider);
    expect(tracer).toBe(mockTracer);
    expect(mockProvider.getTracer).toHaveBeenCalledWith("unified-live", expect.any(String));
  });

  it("uses OTel TracerProvider when passed", async () => {
    const { trace } = await import("@opentelemetry/api");
    const spy = vi.spyOn(trace, "getTracer");
    getTracer(trace);
    expect(spy).toHaveBeenCalledWith("unified-live", expect.any(String));
    spy.mockRestore();
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
    ["URL_FULL", "url.full"],
    ["URL_SCHEME", "url.scheme"],
    ["ERROR_CODE", "unified_live.error.code"],
    ["ERROR_TYPE", "error.type"],
    ["ERROR_HAS_CAUSE", "unified_live.error.has_cause"],
    ["RETRY_COUNT", "unified_live.retry.count"],
    ["OPERATION", "unified_live.operation"],
    ["BATCH_SIZE", "unified_live.batch.size"],
  ] as const)("has %s = %s", (key, expected) => {
    expect(SpanAttributes[key]).toBe(expected);
  });

  it("has exactly 16 attribute keys", () => {
    expect(Object.keys(SpanAttributes)).toHaveLength(16);
  });
});

describe("withSpan", () => {
  it("creates a span, runs callback, and ends span", async () => {
    const endSpy = vi.fn();
    const setAttributeSpy = vi.fn();
    const mockSpan = {
      setAttribute: setAttributeSpy,
      end: endSpy,
      setStatus: vi.fn(),
      recordException: vi.fn(),
    };
    const mockTracer = { startActiveSpan: vi.fn((_name, fn) => fn(mockSpan)) };
    const result = await withSpan(mockTracer as any, "test-span", { key: "val" }, async () => 42);
    expect(result).toBe(42);
    expect(endSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith("key", "val");
  });

  it("records exception, sets error status, and re-throws on error", async () => {
    const mockSpan = {
      setAttribute: vi.fn(),
      end: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
    };
    const mockTracer = { startActiveSpan: vi.fn((_name, fn) => fn(mockSpan)) };
    await expect(
      withSpan(mockTracer as any, "fail", {}, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(mockSpan.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ code: SPAN_STATUS_ERROR }),
    );
    expect(mockSpan.recordException).toHaveBeenCalled();
    expect(mockSpan.end).toHaveBeenCalled();
  });
});

describe("SpanAttributes semconv alignment", () => {
  it.each([
    [SpanAttributes.HTTP_METHOD, ATTR_HTTP_REQUEST_METHOD],
    [SpanAttributes.URL_PATH, ATTR_URL_PATH],
    [SpanAttributes.HTTP_STATUS, ATTR_HTTP_RESPONSE_STATUS_CODE],
    [SpanAttributes.SERVER_ADDRESS, ATTR_SERVER_ADDRESS],
    [SpanAttributes.SERVER_PORT, ATTR_SERVER_PORT],
    [SpanAttributes.URL_FULL, ATTR_URL_FULL],
    [SpanAttributes.URL_SCHEME, ATTR_URL_SCHEME],
    [SpanAttributes.ERROR_TYPE, ATTR_ERROR_TYPE],
  ])("SpanAttributes value %s matches semconv constant %s", (ours, semconv) => {
    expect(ours).toBe(semconv);
  });
});
