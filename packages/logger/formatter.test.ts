import { describe, expect, it } from "vitest";
import { formatToGcpJson } from "./formatter";
import type { LogContext, LoggerConfig } from "./schema";

describe("formatToGcpJson", () => {
  const baseConfig: LoggerConfig = {
    name: "test-logger",
    minLevel: 0,
    format: "gcp",
    projectId: "test-project",
  };

  const baseMeta = {
    runtime: "server",
    hostname: "test-host",
    date: new Date("2024-01-15T10:00:00.000Z"),
    logLevelId: 3,
    logLevelName: "INFO",
    path: {
      fullFilePath: "file:///app/src/index.ts:42:10",
      fileName: "index.ts",
      fileColumn: "10",
      fileLine: "42",
      filePath: "/app/src/index.ts",
      filePathWithLine: "/app/src/index.ts:42",
    },
    name: "test-logger",
  };

  it("formats basic log message", () => {
    const logObj = {
      0: "Hello world",
      _meta: baseMeta,
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result.severity).toBe("INFO");
    expect(result.message).toBe("Hello world");
    expect(result.time).toBe("2024-01-15T10:00:00.000Z");
  });

  it("maps log levels to correct severity", () => {
    const testCases: Array<{ logLevelId: number; expectedSeverity: string }> = [
      { logLevelId: 0, expectedSeverity: "DEBUG" }, // silly
      { logLevelId: 1, expectedSeverity: "DEBUG" }, // trace
      { logLevelId: 2, expectedSeverity: "DEBUG" }, // debug
      { logLevelId: 3, expectedSeverity: "INFO" }, // info
      { logLevelId: 4, expectedSeverity: "WARNING" }, // warn
      { logLevelId: 5, expectedSeverity: "ERROR" }, // error
      { logLevelId: 6, expectedSeverity: "CRITICAL" }, // fatal
    ];

    for (const { logLevelId, expectedSeverity } of testCases) {
      const logObj = {
        0: "Test message",
        _meta: { ...baseMeta, logLevelId },
      };

      const result = formatToGcpJson(logObj, baseConfig);
      expect(result.severity).toBe(expectedSeverity);
    }
  });

  it("includes source location", () => {
    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result["logging.googleapis.com/sourceLocation"]).toEqual({
      file: "/app/src/index.ts",
      line: "42",
      function: undefined,
    });
  });

  it("includes default labels and service info", () => {
    const config: LoggerConfig = {
      ...baseConfig,
      serviceName: "my-service",
      serviceVersion: "1.0.0",
      defaultLabels: { env: "production" },
    };

    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const result = formatToGcpJson(logObj, config);

    expect(result["logging.googleapis.com/labels"]).toEqual({
      env: "production",
      serviceName: "my-service",
      serviceVersion: "1.0.0",
      loggerName: "test-logger",
    });
  });

  it("includes trace context", () => {
    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      traceId: "abc123",
      spanId: "def456",
      traceSampled: true,
    };

    const result = formatToGcpJson(logObj, baseConfig, context);

    expect(result["logging.googleapis.com/trace"]).toBe(
      "projects/test-project/traces/abc123",
    );
    expect(result["logging.googleapis.com/spanId"]).toBe("def456");
    expect(result["logging.googleapis.com/trace_sampled"]).toBe(true);
  });

  it("formats trace without project ID", () => {
    const config: LoggerConfig = {
      ...baseConfig,
      projectId: undefined,
    };

    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      traceId: "abc123",
    };

    const result = formatToGcpJson(logObj, config, context);

    expect(result["logging.googleapis.com/trace"]).toBe("abc123");
  });

  it("includes HTTP request", () => {
    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      httpRequest: {
        requestMethod: "GET",
        requestUrl: "/api/users",
        status: 200,
        userAgent: "Mozilla/5.0",
        remoteIp: "192.168.1.1",
        latency: "0.123s",
      },
    };

    const result = formatToGcpJson(logObj, baseConfig, context);

    expect(result.httpRequest).toEqual({
      requestMethod: "GET",
      requestUrl: "/api/users",
      status: 200,
      userAgent: "Mozilla/5.0",
      remoteIp: "192.168.1.1",
      latency: "0.123s",
    });
  });

  it("includes operation", () => {
    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      operation: {
        id: "op-123",
        producer: "my-service",
        first: true,
      },
    };

    const result = formatToGcpJson(logObj, baseConfig, context);

    expect(result["logging.googleapis.com/operation"]).toEqual({
      id: "op-123",
      producer: "my-service",
      first: true,
    });
  });

  it("includes insert ID", () => {
    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      insertId: "unique-id-123",
    };

    const result = formatToGcpJson(logObj, baseConfig, context);

    expect(result["logging.googleapis.com/insertId"]).toBe("unique-id-123");
  });

  it("merges context labels with default labels", () => {
    const config: LoggerConfig = {
      ...baseConfig,
      defaultLabels: { env: "production", team: "backend" },
    };

    const logObj = {
      0: "Test message",
      _meta: baseMeta,
    };

    const context: LogContext = {
      labels: { requestId: "req-123", env: "staging" }, // env should override
    };

    const result = formatToGcpJson(logObj, config, context);

    expect(result["logging.googleapis.com/labels"]).toEqual({
      env: "staging", // overridden by context
      team: "backend",
      requestId: "req-123",
      loggerName: "test-logger",
    });
  });

  it("includes structured data", () => {
    const logObj = {
      0: "User logged in",
      userData: { userId: "123", role: "admin" },
      _meta: baseMeta,
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result.data).toEqual({
      userData: { userId: "123", role: "admin" },
    });
  });

  it("handles Error objects", () => {
    const error = new Error("Something went wrong");
    error.stack = "Error: Something went wrong\n    at test.ts:1:1";

    const logObj = {
      0: "An error occurred",
      error,
      _meta: { ...baseMeta, logLevelId: 5 },
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result.severity).toBe("ERROR");
    expect(result.message).toContain("Error: Something went wrong");
    expect(result.data?.error).toEqual({
      name: "Error",
      message: "Something went wrong",
      stack: "Error: Something went wrong\n    at test.ts:1:1",
    });
  });

  it("handles missing meta", () => {
    const logObj = {
      0: "Test message",
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result.severity).toBe("INFO");
    expect(result.message).toBe("Test message");
    expect(result.time).toBeDefined();
  });

  it("handles multiple message parts", () => {
    const logObj = {
      0: "Part 1",
      1: "Part 2",
      2: { nested: "value" },
      _meta: baseMeta,
    };

    const result = formatToGcpJson(logObj, baseConfig);

    expect(result.message).toBe('Part 1 Part 2 {"nested":"value"}');
  });
});
