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
import {
  noopMeterProvider,
  noopTracerProvider,
  SPAN_KIND_CLIENT,
  SPAN_STATUS_ERROR,
} from "./otel-types";
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

  it("wraps non-Error thrown values in Error before recording exception", async () => {
    const mockSpan = {
      setAttribute: vi.fn(),
      end: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
    };
    const mockTracer = { startActiveSpan: vi.fn((_name, fn) => fn(mockSpan)) };
    await expect(
      withSpan(mockTracer as any, "fail", {}, async () => {
        throw "string-error";
      }),
    ).rejects.toBe("string-error");
    expect(mockSpan.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ code: SPAN_STATUS_ERROR, message: "string-error" }),
    );
    expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSpan.end).toHaveBeenCalled();
  });
});

describe("OTel constants match @opentelemetry/api", () => {
  it.each([
    { name: "SPAN_KIND_CLIENT", value: SPAN_KIND_CLIENT, canonical: 2 },
    { name: "SPAN_STATUS_ERROR", value: SPAN_STATUS_ERROR, canonical: 2 },
  ])("$name matches OTel spec value", ({ value, canonical }) => {
    expect(value).toBe(canonical);
  });
});

describe("noopTracerProvider", () => {
  it("startSpan returns a non-recording span", () => {
    const span = noopTracerProvider.getTracer("test").startSpan("test-span");
    expect(span.isRecording()).toBe(false);
  });

  it.each([
    {
      method: "spanContext",
      call: (s: any) => s.spanContext(),
      expected: { traceId: "", spanId: "", traceFlags: 0 },
    },
    { method: "setAttribute", call: (s: any) => s.setAttribute("key", "val"), returnsSpan: true },
    {
      method: "setAttributes",
      call: (s: any) => s.setAttributes({ key: "val" }),
      returnsSpan: true,
    },
    { method: "setStatus", call: (s: any) => s.setStatus({ code: 0 }), returnsSpan: true },
    { method: "updateName", call: (s: any) => s.updateName("new"), returnsSpan: true },
    {
      method: "recordException",
      call: (s: any) => s.recordException(new Error("x")),
      returnsVoid: true,
    },
    { method: "addEvent", call: (s: any) => s.addEvent("evt"), returnsSpan: true },
    { method: "addLink", call: (s: any) => s.addLink({ context: {} as any }), returnsSpan: true },
    { method: "addLinks", call: (s: any) => s.addLinks([]), returnsSpan: true },
    { method: "end", call: (s: any) => s.end(), returnsVoid: true },
  ])("no-op span.$method returns expected value", ({ call, expected, returnsSpan }) => {
    const span = noopTracerProvider.getTracer("t").startSpan("s");
    const result = call(span);
    if (expected !== undefined) expect(result).toEqual(expected);
    if (returnsSpan) expect(result).toBe(span);
  });
});

describe("noopMeterProvider", () => {
  it.each([
    { method: "createHistogram", callResult: (r: any) => r.record(1.0) },
    { method: "createCounter", callResult: (r: any) => r.add(1) },
    { method: "createUpDownCounter", callResult: (r: any) => r.add(-1) },
    { method: "createGauge", callResult: (r: any) => r.record(42) },
    {
      method: "createObservableGauge",
      callResult: (r: any) => {
        r.addCallback(() => {});
        r.removeCallback(() => {});
      },
    },
    {
      method: "createObservableCounter",
      callResult: (r: any) => {
        r.addCallback(() => {});
        r.removeCallback(() => {});
      },
    },
    {
      method: "createObservableUpDownCounter",
      callResult: (r: any) => {
        r.addCallback(() => {});
        r.removeCallback(() => {});
      },
    },
  ])("no-op meter.$method works without error", ({ method, callResult }) => {
    const meter = noopMeterProvider.getMeter("test");
    const instrument = (meter as any)[method]("test-instrument");
    expect(() => callResult(instrument)).not.toThrow();
  });

  it("no-op meter batch observable callbacks do not throw", () => {
    const meter = noopMeterProvider.getMeter("test");
    expect(() => meter.addBatchObservableCallback(() => {}, [])).not.toThrow();
    expect(() => meter.removeBatchObservableCallback(() => {}, [])).not.toThrow();
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
