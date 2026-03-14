import { AuthenticationError } from "../errors.js";

/**
 * Manages authentication credentials for a platform.
 *
 * @precondition An implementation must be provided per platform
 * @postcondition getAuthHeader always returns a valid Authorization header value
 */
export type TokenManager = {
  /** Returns a valid auth header value (e.g., "Bearer <token>"). */
  getAuthHeader(): Promise<string>;
  /** Invalidate current token (called on 401 response). */
  invalidate(): void;
  /** Release resources (timers, etc.). */
  dispose?(): void;
};

/**
 * Companion object for the TokenManager type.
 * Provides factory utilities for common auth patterns.
 *
 * @example
 * ```ts
 * const tm = TokenManager.static("Bearer my-token");
 * ```
 */
export const TokenManager = {
  /**
   * Creates a TokenManager for static credentials that never change.
   *
   * @precondition header is a non-empty auth header value (e.g., "Basic abc123")
   * @postcondition getAuthHeader always returns the same header
   * @postcondition invalidate always throws AuthenticationError
   * @idempotency Safe — no side effects
   */
  static(header: string, platform?: string): TokenManager {
    return {
      getAuthHeader: () => Promise.resolve(header),
      invalidate() {
        throw new AuthenticationError(platform ?? "unknown", {
          code: "AUTHENTICATION_EXPIRED",
          message: "Static token invalidated. Check credentials.",
        });
      },
    };
  },
} as const;
