import { describe, expect, it, vi } from "vitest";
import { AuthenticationError, NetworkError, NotFoundError, UnifiedLiveError } from "../errors";
import { SPAN_KIND_CLIENT } from "../telemetry/otel-types";
import { createMockFetch } from "../test-helpers";
import { createRestManager, parseRetryAfter, RestManager } from "./manager";
import type { RateLimitHandle, RateLimitStrategy } from "./strategy";
import { createRateLimitHeaderParser, type RestRequest } from "./types";

const createMockStrategy = (): RateLimitStrategy => {
  return {
    acquire: vi.fn().mockResolvedValue({
      complete: vi.fn(),
      release: vi.fn(),
    } satisfies RateLimitHandle),
    getStatus: vi.fn().mockReturnValue({
      remaining: 100,
      limit: 100,
      resetsAt: new Date(),
      queued: 0,
    }),
  };
};

describe("createRestManager", () => {
  let strategy: RateLimitStrategy;

  it("makes a successful GET request", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: { id: "abc" } }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    const result = await manager.request<{ id: string }>({
      method: "GET",
      path: "/resources/abc",
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ id: "abc" });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("https://api.example.com/resources/abc");
  });

  it("includes query parameters in the URL", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({
      method: "GET",
      path: "/search",
      query: { q: "hello", limit: "10" },
    });

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("q")).toBe("hello");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  it("properly encodes special characters in query parameters", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({
      method: "GET",
      path: "/search",
      query: { q: "hello world", filter: "type=live&sort=new", emoji: "\u{1F44D}" },
    });

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("q")).toBe("hello world");
    expect(url.searchParams.get("filter")).toBe("type=live&sort=new");
    expect(url.searchParams.get("emoji")).toBe("\u{1F44D}");
  });

  it("builds URL with repeated query params for array values", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({
      method: "GET",
      path: "/streams",
      query: { user_id: ["1", "2", "3"], type: "live" },
    });

    const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.getAll("user_id")).toEqual(["1", "2", "3"]);
    expect(url.searchParams.get("type")).toBe("live");
    expect(calledUrl).toContain("user_id=1&user_id=2&user_id=3");
  });

  it("retries on 5xx server errors", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([
      { status: 500 },
      { status: 502 },
      { status: 200, body: { ok: true } },
    ]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      retry: { baseDelay: 1 }, // Fast retries for tests
    });

    const result = await manager.request<{ ok: boolean }>({
      method: "GET",
      path: "/flaky",
    });

    expect(result.data).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 with Retry-After header", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([
      { status: 429, headers: { "Retry-After": "0" } },
      { status: 200, body: { ok: true } },
    ]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    const result = await manager.request<{ ok: boolean }>({
      method: "GET",
      path: "/rate-limited",
    });

    expect(result.data).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("throws NotFoundError on 404", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 404 }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await expect(manager.request({ method: "GET", path: "/missing" })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws AuthenticationError on 401 after retries", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([
      { status: 401 },
      { status: 401 },
      { status: 401 },
      { status: 401 },
    ]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await expect(manager.request({ method: "GET", path: "/auth" })).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("calls rateLimitStrategy.acquire and handle.complete", async () => {
    const completeFn = vi.fn();
    strategy = {
      acquire: vi.fn().mockResolvedValue({
        complete: completeFn,
        release: vi.fn(),
      } satisfies RateLimitHandle),
      getStatus: vi.fn().mockReturnValue({
        remaining: 100,
        limit: 100,
        resetsAt: new Date(),
        queued: 0,
      }),
    };

    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({ method: "GET", path: "/test" });

    expect(strategy.acquire).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);
  });

  it("calls handle.release on error", async () => {
    const releaseFn = vi.fn();
    strategy = {
      acquire: vi.fn().mockResolvedValue({
        complete: vi.fn(),
        release: releaseFn,
      } satisfies RateLimitHandle),
      getStatus: vi.fn().mockReturnValue({
        remaining: 100,
        limit: 100,
        resetsAt: new Date(),
        queued: 0,
      }),
    };

    const fetchFn = createMockFetch([{ status: 404 }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await expect(manager.request({ method: "GET", path: "/missing" })).rejects.toThrow(
      NotFoundError,
    );
    expect(releaseFn).toHaveBeenCalledTimes(1);
  });

  it("allows overriding createHeaders", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    const origCreateHeaders = manager.createHeaders;
    manager.createHeaders = async (req: RestRequest) => {
      const headers = await origCreateHeaders(req);
      return { ...headers, "X-Custom": "value" };
    };

    await manager.request({ method: "GET", path: "/test" });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers["X-Custom"]).toBe("value");
  });

  it("includes auth header from tokenManager", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tokenManager: {
        getAuthHeader: async () => "Bearer test-token",
        invalidate: vi.fn(),
      },
    });

    await manager.request({ method: "GET", path: "/test" });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("throws UnifiedLiveError on non-JSON response", async () => {
    strategy = createMockStrategy();
    const fetchFn = vi.fn(async () => {
      return new Response("<html>502 Bad Gateway</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }) as unknown as typeof globalThis.fetch;

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await expect(manager.request({ method: "GET", path: "/broken" })).rejects.toThrow(
      UnifiedLiveError,
    );

    await expect(manager.request({ method: "GET", path: "/broken" })).rejects.toThrow(
      "Failed to parse JSON response",
    );
  });

  it("passes AbortSignal to fetch", async () => {
    strategy = createMockStrategy();
    const controller = new AbortController();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({ method: "GET", path: "/test", signal: controller.signal });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(calledInit.signal).toBe(controller.signal);
  });

  it("throws NetworkError with NETWORK_ABORT when signal is aborted", async () => {
    strategy = createMockStrategy();
    const controller = new AbortController();
    controller.abort();

    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      init?.signal?.throwIfAborted();
      throw new Error("unreachable");
    }) as unknown as typeof globalThis.fetch;

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    const err = await manager
      .request({ method: "GET", path: "/test", signal: controller.signal })
      .catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.code).toBe("NETWORK_ABORT");
  });

  it("applies timeout when configured", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      retry: { timeout: 5000 },
    });

    await manager.request({ method: "GET", path: "/test" });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(calledInit.signal).toBeDefined();
  });

  it.each([400, 408, 413, 415, 422])("throws immediately without retry on %d", async (status) => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await expect(manager.request({ method: "GET", path: "/test" })).rejects.toThrow(
      UnifiedLiveError,
    );
    expect(fetchFn).toHaveBeenCalledTimes(1); // No retries
  });

  it("sends raw body when bodyType is 'raw'", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    const formData = new URLSearchParams({ key: "value" });
    await manager.request({
      method: "POST",
      path: "/submit",
      body: formData,
      bodyType: "raw",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(calledInit.body).toBe(formData);
  });

  it("JSON-serializes body by default", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
    });

    await manager.request({
      method: "POST",
      path: "/data",
      body: { key: "value" },
    });

    const calledInit = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(calledInit.body).toBe('{"key":"value"}');
    const headers = calledInit.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes status in error context after retries exhausted", async () => {
    strategy = createMockStrategy();
    const fetchFn = createMockFetch([
      { status: 503 },
      { status: 503 },
      { status: 503 },
      { status: 503 },
    ]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      retry: { baseDelay: 1 },
    });

    try {
      await manager.request({ method: "GET", path: "/flaky" });
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(NetworkError);
      const err = e as NetworkError;
      expect(err.context.status).toBe(503);
      expect(err.context.method).toBe("GET");
      expect(err.context.path).toBe("/flaky");
    }
  });

  it("function properties are overridable but not deletable", () => {
    strategy = createMockStrategy();
    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: createMockFetch([]),
    });

    // Assignment still works (writable: true)
    const originalRequest = manager.request;
    manager.request = vi.fn() as typeof manager.request;
    expect(manager.request).not.toBe(originalRequest);
  });

});

describe("createRestManager OTel integration", () => {
  const createMockTracer = () => {
    const spans: Array<{
      name: string;
      options: unknown;
      attributes: Record<string, unknown>;
      status?: { code: number; message?: string };
      ended: boolean;
    }> = [];

    const tracer = {
      startActiveSpan: vi.fn((name: string, optionsOrFn: unknown, maybeFn?: unknown) => {
        const options = typeof maybeFn === "function" ? optionsOrFn : {};
        const fn = typeof maybeFn === "function" ? maybeFn : optionsOrFn;
        const spanRecord = {
          name,
          options,
          attributes: {} as Record<string, unknown>,
          status: undefined as { code: number; message?: string } | undefined,
          ended: false,
        };
        spans.push(spanRecord);
        const span = {
          setAttribute: vi.fn((k: string, v: unknown) => {
            spanRecord.attributes[k] = v;
          }),
          setAttributes: vi.fn(),
          setStatus: vi.fn((s: { code: number; message?: string }) => {
            spanRecord.status = s;
          }),
          addEvent: vi.fn(),
          recordException: vi.fn(),
          end: vi.fn(() => {
            spanRecord.ended = true;
          }),
        };
        return (fn as (s: typeof span) => unknown)(span);
      }),
      startSpan: vi.fn(),
    };

    return { tracer, spans, provider: { getTracer: vi.fn().mockReturnValue(tracer) } };
  };

  const createMockMeter = () => {
    const recordings: Array<{ value: number; attributes: Record<string, unknown> }> = [];
    const histogram = {
      record: vi.fn((value: number, attributes: Record<string, unknown>) => {
        recordings.push({ value, attributes });
      }),
    };
    const meter = {
      createHistogram: vi.fn().mockReturnValue(histogram),
      createCounter: vi.fn(),
      createUpDownCounter: vi.fn(),
      createObservableGauge: vi.fn(),
      createObservableCounter: vi.fn(),
      createObservableUpDownCounter: vi.fn(),
      createGauge: vi.fn(),
    };
    return { meter, histogram, recordings, provider: { getMeter: vi.fn().mockReturnValue(meter) } };
  };

  it("creates span with HTTP method name and SpanKind.CLIENT", async () => {
    const { spans, provider: tracerProvider } = createMockTracer();
    const { provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/resources" });

    expect(spans).toHaveLength(1);
    expect(spans[0]!.name).toBe("GET");
    expect(spans[0]!.options).toEqual({ kind: SPAN_KIND_CLIENT });
    expect(spans[0]!.ended).toBe(true);
  });

  it("sets required semconv attributes on span", async () => {
    const { spans, provider: tracerProvider } = createMockTracer();
    const { provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com:8443",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/resources" });

    const attrs = spans[0]!.attributes;
    expect(attrs["http.request.method"]).toBe("GET");
    expect(attrs["url.path"]).toBe("/resources");
    expect(attrs["url.full"]).toBe("https://api.example.com:8443/resources");
    expect(attrs["url.scheme"]).toBe("https");
    expect(attrs["server.address"]).toBe("api.example.com");
    expect(attrs["server.port"]).toBe(8443);
    expect(attrs["http.response.status_code"]).toBe(200);
    expect(attrs["unified_live.platform"]).toBe("test");
  });

  it("defaults server.port to 443 for HTTPS", async () => {
    const { spans, provider: tracerProvider } = createMockTracer();
    const { provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/test" });
    expect(spans[0]!.attributes["server.port"]).toBe(443);
  });

  it("records http.client.request.duration histogram on success", async () => {
    const { provider: tracerProvider } = createMockTracer();
    const { recordings, provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/test" });

    expect(recordings).toHaveLength(1);
    expect(recordings[0]!.value).toBeGreaterThan(0);
    expect(recordings[0]!.attributes["http.request.method"]).toBe("GET");
    expect(recordings[0]!.attributes["http.response.status_code"]).toBe(200);
    expect(recordings[0]!.attributes["server.address"]).toBe("api.example.com");
  });

  it("records histogram with error.type on failure", async () => {
    const { provider: tracerProvider } = createMockTracer();
    const { recordings, provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 404 }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/missing" }).catch(() => {});

    expect(recordings).toHaveLength(1);
    expect(recordings[0]!.attributes["error.type"]).toBe("404");
    expect(recordings[0]!.attributes["http.response.status_code"]).toBe(404);
  });

  it("sets error.type to status code string for HTTP errors", async () => {
    const { spans, provider: tracerProvider } = createMockTracer();
    const { provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 404 }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    await manager.request({ method: "GET", path: "/missing" }).catch(() => {});

    expect(spans[0]!.attributes["error.type"]).toBe("404");
    expect(spans[0]!.status?.code).toBe(2); // SpanStatusCode.ERROR
  });

  it("does not require @opentelemetry/api at runtime", async () => {
    const { provider: tracerProvider } = createMockTracer();
    const { provider: meterProvider } = createMockMeter();
    const strategy = createMockStrategy();
    const fetchFn = createMockFetch([{ status: 200, body: {} }]);

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: fetchFn,
      tracerProvider,
      meterProvider,
    });

    // Should work without propagation.inject — no runtime OTel dependency
    await expect(manager.request({ method: "GET", path: "/test" })).resolves.toBeDefined();
  });
});

describe("parseRetryAfter", () => {
  it.each([
    { header: "5", fallback: 1, expected: 5 },
    { header: "0", fallback: 1, expected: 0 },
    { header: "200", fallback: 1, expected: 120 },
    { header: null, fallback: 1, expected: 1 },
    { header: null, fallback: 5, expected: 5 },
    { header: "invalid", fallback: 3, expected: 3 },
    { header: "NaN", fallback: 1, expected: 1 },
    { header: "-5", fallback: 1, expected: 1 },
    { header: "60", fallback: 1, expected: 60 },
  ])('parseRetryAfter("$header", $fallback) = $expected', ({ header, fallback, expected }) => {
    expect(parseRetryAfter(header, fallback)).toBe(expected);
  });

  it("uses default fallback when none provided", () => {
    expect(parseRetryAfter(null)).toBe(1);
  });

  it("clamps negative fallback to 0", () => {
    expect(parseRetryAfter(null, -5)).toBe(0);
  });

  it("clamps large fallback to 120", () => {
    expect(parseRetryAfter(null, 300)).toBe(120);
  });
});

describe("RestManager.is", () => {
  it("returns false for non-objects", () => {
    expect(RestManager.is(null)).toBe(false);
    expect(RestManager.is("string")).toBe(false);
    expect(RestManager.is(42)).toBe(false);
  });

  it("returns true for a created RestManager", () => {
    const strategy = createMockStrategy();
    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: createMockFetch([]),
    });

    expect(RestManager.is(manager)).toBe(true);  });
});

describe("createRateLimitHeaderParser", () => {
  const parser = createRateLimitHeaderParser({
    limit: "X-RateLimit-Limit",
    remaining: "X-RateLimit-Remaining",
    reset: "X-RateLimit-Reset",
  });

  it("parses valid rate limit headers", () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "42",
      "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
    });
    const info = parser(headers);
    expect(info).toBeDefined();
    expect(info!.limit).toBe(100);
    expect(info!.remaining).toBe(42);
    expect(info!.resetsAt).toBeInstanceOf(Date);
  });

  it("returns undefined when headers are missing", () => {
    expect(parser(new Headers())).toBeUndefined();
  });

  it("returns undefined when only some headers are present", () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "100",
    });
    expect(parser(headers)).toBeUndefined();
  });

  it("handles NaN header values", () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "not-a-number",
      "X-RateLimit-Remaining": "42",
      "X-RateLimit-Reset": "also-not-a-number",
    });
    const info = parser(headers);
    expect(info).toBeDefined();
    expect(info!.limit).toBeNaN();
    expect(info!.remaining).toBe(42);
  });
});
