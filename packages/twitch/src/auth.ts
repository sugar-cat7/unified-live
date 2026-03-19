import { AuthenticationError, type TokenManager } from "@unified-live/core";

/** Refresh at 90% of token lifetime to avoid edge-case expiry. */
const REFRESH_MARGIN = 0.9;

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

/**
 * Creates a TokenManager for Twitch Client Credentials Grant flow.
 *
 * @param config - Twitch client credentials and optional fetch override
 * @returns token manager that auto-refreshes before expiry
 * @precondition clientId and clientSecret are valid Twitch app credentials
 * @postcondition auto-fetches app access token and refreshes before expiry
 */
export const createClientCredentialsTokenManager = (config: {
  clientId: string;
  clientSecret: string;
  fetch?: typeof globalThis.fetch;
}): TokenManager => {
  const fetchFn = config.fetch ?? globalThis.fetch;
  let token: string | null = null;
  let expiresAt: Date | null = null;
  let refreshPromise: Promise<string> | null = null;

  const fetchAndCacheToken = async (): Promise<string> => {
    let res: Response;
    try {
      res = await fetchFn("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "client_credentials",
        }),
      });
    } catch (e) {
      throw new AuthenticationError("twitch", {
        code: "AUTHENTICATION_INVALID",
        message: `Token fetch failed: ${(e as Error).message}`,
        cause: e as Error,
      });
    }

    if (!res.ok) {
      throw new AuthenticationError("twitch", {
        code: "AUTHENTICATION_INVALID",
        message: `Token fetch failed: ${res.status}`,
      });
    }

    const data = (await res.json()) as TwitchTokenResponse;
    token = data.access_token;
    // Refresh at 90% of expiry
    expiresAt = new Date(Date.now() + data.expires_in * 1000 * REFRESH_MARGIN);
    return token;
  };

  return {
    async getAuthHeader(): Promise<string> {
      if (token && expiresAt && new Date() < expiresAt) {
        return `Bearer ${token}`;
      }
      if (!refreshPromise) {
        refreshPromise = fetchAndCacheToken();
      }
      try {
        const t = await refreshPromise;
        return `Bearer ${t}`;
      } finally {
        refreshPromise = null;
      }
    },
    invalidate(): void {
      token = null;
      expiresAt = null;
    },
  };
};
