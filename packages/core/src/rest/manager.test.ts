import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, NotFoundError, UnifiedLiveError } from "../errors";
import { createRestManager, parseRetryAfter } from "./manager";
import type { RateLimitHandle, RateLimitStrategy } from "./strategy";
import type { RestRequest } from "./types";

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
    [Symbol.dispose]: vi.fn(),
  };
};

const createMockFetch = (
  responses: Array<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch => {
  let callIndex = 0;
  return vi.fn(async () => {
    const r = responses[callIndex];
    if (!r)
      throw new Error(
        `createMockFetch: unexpected call #${callIndex} (only ${responses.length} responses defined)`,
      );
    callIndex++;
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: r.headers,
    });
  }) as unknown as typeof globalThis.fetch;
};

describe("createRestManager", () => {
  let strategy: RateLimitStrategy;

  afterEach(() => {
    strategy?.[Symbol.dispose]();
  });

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
      [Symbol.dispose]: vi.fn(),
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
      [Symbol.dispose]: vi.fn(),
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

  it("throws after [Symbol.dispose] is called", async () => {
    strategy = createMockStrategy();
    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: createMockFetch([]),
    });

    manager[Symbol.dispose]();

    await expect(manager.request({ method: "GET", path: "/test" })).rejects.toThrow(
      "has been disposed",
    );
  });

  it("[Symbol.dispose] cleans up strategy and tokenManager", () => {
    const tokenDispose = vi.fn();
    strategy = createMockStrategy();

    const manager = createRestManager({
      platform: "test",
      baseUrl: "https://api.example.com",
      rateLimitStrategy: strategy,
      fetch: createMockFetch([]),
      tokenManager: {
        getAuthHeader: async () => "",
        invalidate: vi.fn(),
        [Symbol.dispose]: tokenDispose,
      },
    });

    manager[Symbol.dispose]();
    expect(strategy[Symbol.dispose]).toHaveBeenCalledTimes(1);
    expect(tokenDispose).toHaveBeenCalledTimes(1);
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
});
