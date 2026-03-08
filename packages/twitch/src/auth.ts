import { AuthenticationError, type TokenManager } from "@unified-live/core";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

/**
 * Creates a TokenManager for Twitch Client Credentials Grant flow.
 *
 * @precondition clientId and clientSecret are valid Twitch app credentials
 * @postcondition auto-fetches app access token and refreshes before expiry
 */
export function createClientCredentialsTokenManager(config: {
  clientId: string;
  clientSecret: string;
  fetch?: typeof globalThis.fetch;
}): TokenManager {
  const fetchFn = config.fetch ?? globalThis.fetch;
  let token: string | null = null;
  let expiresAt: Date | null = null;
  let refreshPromise: Promise<string> | null = null;

  async function fetchToken(): Promise<string> {
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
      throw new AuthenticationError(
        "twitch",
        `Token fetch failed: ${(e as Error).message}`,
      );
    }

    if (!res.ok) {
      throw new AuthenticationError(
        "twitch",
        `Token fetch failed: ${res.status}`,
      );
    }

    const data = (await res.json()) as TwitchTokenResponse;
    token = data.access_token;
    // Refresh at 90% of expiry
    expiresAt = new Date(Date.now() + data.expires_in * 900);
    return token;
  }

  async function getToken(): Promise<string> {
    if (token && expiresAt && new Date() < expiresAt) {
      return token;
    }
    if (refreshPromise) return refreshPromise;
    refreshPromise = fetchToken();
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  return {
    async getAuthHeader(): Promise<string> {
      const t = await getToken();
      return `Bearer ${t}`;
    },
    invalidate(): void {
      token = null;
      expiresAt = null;
    },
  };
}
