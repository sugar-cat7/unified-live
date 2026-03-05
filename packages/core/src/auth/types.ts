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
