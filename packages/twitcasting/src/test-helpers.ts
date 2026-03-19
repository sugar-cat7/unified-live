/**
 * Shared test utilities for @unified-live/twitcasting tests.
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
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): typeof globalThis.fetch => {
  let callIndex = 0;
  return vi.fn(async () => {
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
 * Creates a mock RestManager for TwitCasting method tests.
 *
 * @param response - The data to return from `request()`.
 * @returns A RestManager stub with vi.fn() for all function properties.
 */
export const createMockRest = (response: unknown): RestManager => ({
  platform: "twitcasting",
  baseUrl: "https://apiv2.twitcasting.tv",
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
