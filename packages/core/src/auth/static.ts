import { AuthenticationError } from "../errors.js";
import type { TokenManager } from "./types.js";

/**
 * Creates a TokenManager for static credentials that never change.
 *
 * @precondition header is a non-empty auth header value (e.g., "Basic abc123")
 * @postcondition getAuthHeader always returns the same header
 * @postcondition invalidate always throws AuthenticationError
 * @idempotency Safe — no side effects
 */
export function createStaticTokenManager(header: string): TokenManager {
  return {
    getAuthHeader: () => Promise.resolve(header),
    invalidate() {
      throw new AuthenticationError("unknown", {
        code: "AUTHENTICATION_EXPIRED",
        message: "Static token invalidated. Check credentials.",
      });
    },
  };
}
