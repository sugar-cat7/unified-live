/**
 * Shared test utilities for @unified-live/core tests.
 * NOT exported from index.ts — test-only.
 */
import { vi } from "vitest";

/**
 * Creates a mock fetch function that returns pre-configured responses in order.
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
