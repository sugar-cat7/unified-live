import type { TokenManager } from "@unified-live/core";

/**
 * Creates a TokenManager for TwitCasting Basic Auth.
 *
 * @param config - TwitCasting client credentials
 * @returns token manager using Basic auth
 * @precondition clientId and clientSecret are valid TwitCasting app credentials
 * @postcondition returns Authorization header using Basic auth (base64-encoded)
 * @idempotency Safe — credentials are static
 */
export const createBasicAuthTokenManager = (config: {
  clientId: string;
  clientSecret: string;
}): TokenManager => {
  const encoded = btoa(`${config.clientId}:${config.clientSecret}`);

  return {
    async getAuthHeader(): Promise<string> {
      return `Basic ${encoded}`;
    },
    invalidate(): void {
      // No-op — Basic auth credentials don't expire
    },
  };
};
