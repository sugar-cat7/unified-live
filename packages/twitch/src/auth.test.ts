import { AuthenticationError } from "@unified-live/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientCredentialsTokenManager } from "./auth";

const makeMockFetch = (
  overrides: Partial<{
    accessToken: string;
    expiresIn: number;
    status: number;
    ok: boolean;
    rejectWith: Error;
  }> = {},
) => {
  const {
    accessToken = "test-access-token",
    expiresIn = 3600,
    status = 200,
    ok = true,
    rejectWith,
  } = overrides;

  return vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
    if (rejectWith) throw rejectWith;
    return {
      ok,
      status,
      json: async () => ({
        access_token: accessToken,
        expires_in: expiresIn,
        token_type: "bearer",
      }),
    } as Response;
  });
};

describe("createClientCredentialsTokenManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns Bearer token", async () => {
    const mockFetch = makeMockFetch({ accessToken: "abc123" });
    const manager = createClientCredentialsTokenManager({
      clientId: "id",
      clientSecret: "secret",
      fetch: mockFetch,
    });

    const header = await manager.getAuthHeader();

    expect(header).toBe("Bearer abc123");
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://id.twitch.tv/oauth2/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("caches token and reuses it within expiry window", async () => {
    const mockFetch = makeMockFetch({ expiresIn: 3600 });
    const manager = createClientCredentialsTokenManager({
      clientId: "id",
      clientSecret: "secret",
      fetch: mockFetch,
    });

    const first = await manager.getAuthHeader();
    const second = await manager.getAuthHeader();

    expect(first).toBe(second);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it.each([
    {
      scenario: "network failure",
      fetchOverrides: { rejectWith: new Error("Network error") },
      expectedMessagePattern: /Token fetch failed: Network error/,
    },
    {
      scenario: "non-200 response",
      fetchOverrides: { ok: false, status: 401 },
      expectedMessagePattern: /Token fetch failed: 401/,
    },
  ])(
    "throws AuthenticationError on $scenario",
    async ({ fetchOverrides, expectedMessagePattern }) => {
      const mockFetch = makeMockFetch(fetchOverrides);
      const manager = createClientCredentialsTokenManager({
        clientId: "id",
        clientSecret: "secret",
        fetch: mockFetch,
      });

      await expect(manager.getAuthHeader()).rejects.toThrow(AuthenticationError);
      await expect(manager.getAuthHeader()).rejects.toThrow(expectedMessagePattern);
    },
  );

  it("invalidate clears cached token, forcing re-fetch", async () => {
    const mockFetch = makeMockFetch();
    const manager = createClientCredentialsTokenManager({
      clientId: "id",
      clientSecret: "secret",
      fetch: mockFetch,
    });

    await manager.getAuthHeader();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    manager.invalidate();

    await manager.getAuthHeader();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("concurrent getAuthHeader calls deduplicate the fetch", async () => {
    const mockFetch = makeMockFetch({ accessToken: "deduped" });
    const manager = createClientCredentialsTokenManager({
      clientId: "id",
      clientSecret: "secret",
      fetch: mockFetch,
    });

    const [a, b, c] = await Promise.all([
      manager.getAuthHeader(),
      manager.getAuthHeader(),
      manager.getAuthHeader(),
    ]);

    expect(a).toBe("Bearer deduped");
    expect(b).toBe("Bearer deduped");
    expect(c).toBe("Bearer deduped");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("concurrent calls during refresh share the same promise", async () => {
    let callCount = 0;
    const mockFetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
      callCount++;
      // Simulate slow token fetch
      await new Promise((r) => setTimeout(r, 50));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: `token-${callCount}`,
          expires_in: 3600,
          token_type: "bearer",
        }),
      } as Response;
    });

    const manager = createClientCredentialsTokenManager({
      clientId: "id",
      clientSecret: "secret",
      fetch: mockFetch,
    });

    // First call to populate cache
    await manager.getAuthHeader();
    expect(callCount).toBe(1);

    // Invalidate and immediately fire concurrent calls
    manager.invalidate();
    const results = await Promise.all([manager.getAuthHeader(), manager.getAuthHeader()]);

    // Both should get the same token from the shared refresh
    expect(results[0]).toBe(results[1]);
    expect(callCount).toBe(2); // Only one additional fetch
  });

  it("falls back to globalThis.fetch when config.fetch is omitted", async () => {
    const mockGlobalFetch = makeMockFetch({ accessToken: "global-token" });
    const original = globalThis.fetch;
    globalThis.fetch = mockGlobalFetch;
    try {
      const manager = createClientCredentialsTokenManager({
        clientId: "id",
        clientSecret: "secret",
      });

      const header = await manager.getAuthHeader();

      expect(header).toBe("Bearer global-token");
      expect(mockGlobalFetch).toHaveBeenCalledOnce();
    } finally {
      globalThis.fetch = original;
    }
  });

  it("sends correct content type and body parameters", async () => {
    const mockFetch = makeMockFetch();
    const manager = createClientCredentialsTokenManager({
      clientId: "my-client",
      clientSecret: "my-secret",
      fetch: mockFetch,
    });

    await manager.getAuthHeader();

    const callArgs = mockFetch.mock.calls[0];
    const init = callArgs?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );

    const body = init.body as URLSearchParams;
    expect(body.get("client_id")).toBe("my-client");
    expect(body.get("client_secret")).toBe("my-secret");
    expect(body.get("grant_type")).toBe("client_credentials");
  });
});
