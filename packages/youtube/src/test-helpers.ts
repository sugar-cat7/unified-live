/**
 * Shared test utilities for @unified-live/youtube tests.
 * NOT exported from index.ts — test-only.
 */
import type { RestManager } from "@unified-live/core";
import { vi } from "vitest";

/**
 * Creates a mock fetch that returns pre-configured responses in order.
 *
 * @param responses - Array of response definitions to return sequentially.
 * @returns A vi.fn()-wrapped fetch function.
 * @precondition `responses` length must match expected call count.
 * @postcondition Each call returns the next response; extra calls throw.
 */
export const createMockFetch = (
  responses: Array<{
    body: unknown;
    status?: number;
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
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json", ...r.headers },
    });
  }) as unknown as typeof globalThis.fetch;
};

/**
 * Creates a mock RestManager for YouTube method tests.
 *
 * @returns A RestManager stub with vi.fn() for all function properties.
 */
export const createMockRest = (): RestManager => ({
  platform: "youtube",
  baseUrl: "https://www.googleapis.com/youtube/v3",
  rateLimitStrategy: {} as RestManager["rateLimitStrategy"],
  tokenManager: undefined,
  request: vi.fn(),
  createHeaders: vi.fn(),
  runRequest: vi.fn(),
  handleResponse: vi.fn(),
  handleRateLimit: vi.fn(),
  parseRateLimitHeaders: vi.fn(),
});
