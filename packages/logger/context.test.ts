import { describe, expect, it } from "vitest";
import {
  createRequestContext,
  getLogContext,
  getRequestId,
  runWithLogContext,
  runWithLogContextAsync,
  updateLogContext,
  withRequestContext,
} from "./context";

describe("runWithLogContext", () => {
  it("provides context within callback", () => {
    const context = { traceId: "trace-123", spanId: "span-456" };

    runWithLogContext(context, () => {
      const currentContext = getLogContext();
      expect(currentContext).toEqual(context);
    });
  });

  it("context is undefined outside callback", () => {
    runWithLogContext({ traceId: "trace-123" }, () => {
      // Inside callback
    });

    // Outside callback
    expect(getLogContext()).toBeUndefined();
  });

  it("returns value from callback", () => {
    const result = runWithLogContext({ traceId: "trace-123" }, () => {
      return "hello";
    });

    expect(result).toBe("hello");
  });

  it("supports nested contexts", () => {
    runWithLogContext({ traceId: "outer" }, () => {
      expect(getLogContext()?.traceId).toBe("outer");

      runWithLogContext({ traceId: "inner" }, () => {
        expect(getLogContext()?.traceId).toBe("inner");
      });

      expect(getLogContext()?.traceId).toBe("outer");
    });
  });
});

describe("runWithLogContextAsync", () => {
  it("provides context within async callback", async () => {
    const context = { traceId: "trace-123" };

    await runWithLogContextAsync(context, async () => {
      await Promise.resolve();
      const currentContext = getLogContext();
      expect(currentContext).toEqual(context);
    });
  });

  it("returns value from async callback", async () => {
    const result = await runWithLogContextAsync({ traceId: "trace-123" }, async () => {
      await Promise.resolve();
      return "async-result";
    });

    expect(result).toBe("async-result");
  });

  it("maintains context across await boundaries", async () => {
    await runWithLogContextAsync({ traceId: "trace-123" }, async () => {
      expect(getLogContext()?.traceId).toBe("trace-123");

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(getLogContext()?.traceId).toBe("trace-123");
    });
  });
});

describe("updateLogContext", () => {
  it("updates existing context", () => {
    runWithLogContext({ traceId: "trace-123" }, () => {
      updateLogContext({ spanId: "span-456" });

      const context = getLogContext();
      expect(context?.traceId).toBe("trace-123");
      expect(context?.spanId).toBe("span-456");
    });
  });

  it("does nothing when called outside context", () => {
    // Should not throw
    expect(() => updateLogContext({ spanId: "span-456" })).not.toThrow();
  });

  it("overwrites existing properties", () => {
    runWithLogContext({ traceId: "original" }, () => {
      updateLogContext({ traceId: "updated" });

      expect(getLogContext()?.traceId).toBe("updated");
    });
  });
});

describe("withRequestContext", () => {
  it("works with sync functions", async () => {
    const result = await withRequestContext({ traceId: "trace-123" }, () => {
      return getLogContext()?.traceId;
    });

    expect(result).toBe("trace-123");
  });

  it("works with async functions", async () => {
    const result = await withRequestContext({ traceId: "trace-123" }, async () => {
      await Promise.resolve();
      return getLogContext()?.traceId;
    });

    expect(result).toBe("trace-123");
  });
});

describe("createRequestContext", () => {
  it("creates context with requestId in labels", () => {
    const context = createRequestContext("req-123");

    expect(context.labels?.requestId).toBe("req-123");
  });

  it("merges additional context", () => {
    const context = createRequestContext("req-123", {
      traceId: "trace-456",
      labels: { userId: "user-789" },
    });

    expect(context.labels?.requestId).toBe("req-123");
    expect(context.labels?.userId).toBe("user-789");
    expect(context.traceId).toBe("trace-456");
  });

  it("requestId overwrites existing in additional labels", () => {
    const context = createRequestContext("req-new", {
      labels: { requestId: "req-old" },
    });

    expect(context.labels?.requestId).toBe("req-new");
  });
});

describe("getRequestId", () => {
  it("returns requestId from context labels", () => {
    runWithLogContext({ labels: { requestId: "req-123" } }, () => {
      expect(getRequestId()).toBe("req-123");
    });
  });

  it("returns undefined when no context", () => {
    expect(getRequestId()).toBeUndefined();
  });

  it("returns undefined when no requestId in labels", () => {
    runWithLogContext({ traceId: "trace-123" }, () => {
      expect(getRequestId()).toBeUndefined();
    });
  });
});
