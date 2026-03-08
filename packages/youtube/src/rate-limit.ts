import {
  QuotaExhaustedError,
  type RateLimitStrategy,
  type RestRequest,
} from "@unified-live/core";

/**
 * Creates a YouTube-specific rate limit handler.
 * Handles 403 (quota/rate limit) and 429 responses.
 *
 * @precondition quotaStrategy is initialized
 * @postcondition returned handler detects YouTube quota exhaustion and rate limiting
 */
export function createYouTubeRateLimitHandler(
  quotaStrategy: RateLimitStrategy,
): (response: Response, req: RestRequest, attempt: number) => Promise<boolean> {
  return async (response, _req, _attempt) => {
    if (response.status === 403) {
      const body = (await response
        .clone()
        .json()
        .catch(() => null)) as {
        error?: { errors?: Array<{ reason?: string }> };
      } | null;
      const reason = body?.error?.errors?.[0]?.reason;

      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        const status = quotaStrategy.getStatus();
        throw new QuotaExhaustedError("youtube", {
          consumed: status.limit - status.remaining,
          limit: status.limit,
          resetsAt: status.resetsAt,
          requestedCost: 0,
        });
      }

      if (reason === "rateLimitExceeded") {
        const retryAfter = Number.parseInt(
          response.headers.get("Retry-After") ?? "5",
          10,
        );
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return true;
      }
    }

    if (response.status === 429) {
      const retryAfter = Number.parseInt(
        response.headers.get("Retry-After") ?? "1",
        10,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return true;
    }

    return false;
  };
}
