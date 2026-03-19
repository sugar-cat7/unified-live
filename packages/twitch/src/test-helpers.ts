/**
 * Shared test utilities for @unified-live/twitch tests.
 * NOT exported from index.ts — test-only.
 */
import type { RestManager } from "@unified-live/core";
import { vi } from "vitest";

/**
 * Creates a mock fetch that returns pre-configured responses in order.
 * Automatically intercepts Twitch OAuth token endpoint requests.
 *
 * @param responses - Array of response definitions to return sequentially for API calls.
 * @returns A vi.fn()-wrapped fetch function that intercepts OAuth token requests.
 * @precondition `responses` length must match expected API call count (excluding token calls).
 * @postcondition Each API call returns the next response; token calls always succeed.
 */
export const createMockFetch = (
  responses: Array<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch => {
  let callIndex = 0;
  return vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    // Handle token endpoint
    if (url.includes("id.twitch.tv/oauth2/token")) {
      return new Response(
        JSON.stringify({
          access_token: "test-token",
          expires_in: 5000000,
          token_type: "bearer",
        }),
        { status: 200 },
      );
    }

    const r = responses[callIndex];
    if (!r) throw new Error(`Unexpected fetch call #${callIndex}`);
    callIndex++;
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: r.headers,
    });
  }) as unknown as typeof globalThis.fetch;
};

/**
 * Creates a mock RestManager for Twitch method tests.
 *
 * @param response - The data to return from `request()`.
 * @returns A RestManager stub with vi.fn() for all function properties.
 */
export const createMockRest = (response: unknown): RestManager => ({
  platform: "twitch",
  baseUrl: "https://api.twitch.tv/helix",
  rateLimitStrategy: {} as RestManager["rateLimitStrategy"],
  tokenManager: undefined,
  request: vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), data: response }),
  createHeaders: vi.fn(),
  runRequest: vi.fn(),
  handleResponse: vi.fn(),
  handleRateLimit: vi.fn(),
  parseRateLimitHeaders: vi.fn(),
  [Symbol.dispose]: vi.fn(),
});
