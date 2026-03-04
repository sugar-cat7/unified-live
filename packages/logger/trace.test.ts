import { describe, expect, it } from "vitest";
import {
  createTraceContext,
  generateSpanId,
  generateTraceId,
  parseCloudTraceContext,
  parseTraceparent,
} from "./trace";

describe("parseCloudTraceContext", () => {
  it("parses full X-Cloud-Trace-Context header", () => {
    const result = parseCloudTraceContext(
      "105445aa7843bc8bf206b12000100000/1;o=1",
    );

    expect(result).toEqual({
      traceId: "105445aa7843bc8bf206b12000100000",
      spanId: "1",
      traceSampled: true,
    });
  });

  it("parses header without span ID", () => {
    const result = parseCloudTraceContext(
      "105445aa7843bc8bf206b12000100000;o=1",
    );

    expect(result).toEqual({
      traceId: "105445aa7843bc8bf206b12000100000",
      spanId: undefined,
      traceSampled: true,
    });
  });

  it("parses header without trace sampling flag", () => {
    const result = parseCloudTraceContext(
      "105445aa7843bc8bf206b12000100000/12345",
    );

    expect(result).toEqual({
      traceId: "105445aa7843bc8bf206b12000100000",
      spanId: "12345",
      traceSampled: false,
    });
  });

  it("parses header with trace sampled = 0", () => {
    const result = parseCloudTraceContext(
      "105445aa7843bc8bf206b12000100000/1;o=0",
    );

    expect(result).toEqual({
      traceId: "105445aa7843bc8bf206b12000100000",
      spanId: "1",
      traceSampled: false,
    });
  });

  it("parses trace ID only", () => {
    const result = parseCloudTraceContext("105445aa7843bc8bf206b12000100000");

    expect(result).toEqual({
      traceId: "105445aa7843bc8bf206b12000100000",
      spanId: undefined,
      traceSampled: false,
    });
  });

  it("returns undefined for empty string", () => {
    expect(parseCloudTraceContext("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(parseCloudTraceContext(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(parseCloudTraceContext(undefined)).toBeUndefined();
  });

  it("returns undefined for invalid format", () => {
    expect(parseCloudTraceContext("invalid-header")).toBeUndefined();
  });
});

describe("parseTraceparent", () => {
  it("parses valid traceparent header", () => {
    const result = parseTraceparent(
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    );

    expect(result).toEqual({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      spanId: "b7ad6b7169203331",
      traceSampled: true,
    });
  });

  it("parses traceparent with sampled = 0", () => {
    const result = parseTraceparent(
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00",
    );

    expect(result).toEqual({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      spanId: "b7ad6b7169203331",
      traceSampled: false,
    });
  });

  it("parses traceparent with additional flags", () => {
    // Flags 03 means sampled (bit 0) + some other flag (bit 1)
    const result = parseTraceparent(
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-03",
    );

    expect(result).toEqual({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      spanId: "b7ad6b7169203331",
      traceSampled: true,
    });
  });

  it("returns undefined for empty string", () => {
    expect(parseTraceparent("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(parseTraceparent(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(parseTraceparent(undefined)).toBeUndefined();
  });

  it("returns undefined for invalid format", () => {
    expect(parseTraceparent("invalid-header")).toBeUndefined();
  });

  it("returns undefined for unsupported version", () => {
    const result = parseTraceparent(
      "01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined for wrong trace ID length", () => {
    const result = parseTraceparent("00-0af7651916cd43dd-b7ad6b7169203331-01");
    expect(result).toBeUndefined();
  });

  it("returns undefined for wrong span ID length", () => {
    const result = parseTraceparent(
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b71-01",
    );
    expect(result).toBeUndefined();
  });
});

describe("createTraceContext", () => {
  it("prefers X-Cloud-Trace-Context over traceparent", () => {
    const result = createTraceContext({
      "x-cloud-trace-context": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4/1;o=1",
      traceparent:
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    });

    expect(result?.traceId).toBe("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4");
  });

  it("falls back to traceparent when X-Cloud-Trace-Context is missing", () => {
    const result = createTraceContext({
      traceparent:
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    });

    expect(result?.traceId).toBe("0af7651916cd43dd8448eb211c80319c");
    expect(result?.spanId).toBe("b7ad6b7169203331");
  });

  it("falls back to traceparent when X-Cloud-Trace-Context is invalid", () => {
    const result = createTraceContext({
      "x-cloud-trace-context": "invalid",
      traceparent:
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    });

    expect(result?.traceId).toBe("0af7651916cd43dd8448eb211c80319c");
  });

  it("returns undefined when both headers are missing", () => {
    const result = createTraceContext({});
    expect(result).toBeUndefined();
  });

  it("returns undefined when both headers are invalid", () => {
    const result = createTraceContext({
      "x-cloud-trace-context": "invalid",
      traceparent: "invalid",
    });
    expect(result).toBeUndefined();
  });
});

describe("generateTraceId", () => {
  it("generates 32 character hex string", () => {
    const traceId = generateTraceId();

    expect(traceId).toMatch(/^[a-f0-9]{32}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTraceId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("generateSpanId", () => {
  it("generates 16 character hex string", () => {
    const spanId = generateSpanId();

    expect(spanId).toMatch(/^[a-f0-9]{16}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSpanId());
    }
    expect(ids.size).toBe(100);
  });
});
