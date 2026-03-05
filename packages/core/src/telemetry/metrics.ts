import type { Meter } from "@opentelemetry/api";
import { metrics } from "@opentelemetry/api";

const METER_NAME = "unified-live";

/**
 * Returns the SDK meter instance.
 * When no OTel SDK is registered, this returns a no-op meter automatically
 * (built into @opentelemetry/api).
 *
 * @precondition none
 * @postcondition returns a Meter instance (possibly no-op)
 * @idempotency Safe — always returns the same meter
 */
export function getMeter(): Meter {
  return metrics.getMeter(METER_NAME);
}

/** Standard metric names used by the SDK. */
export const MetricNames = {
  REQUEST_COUNT: "unified_live.request.count",
  REQUEST_DURATION: "unified_live.request.duration",
  RATE_LIMIT_REMAINING: "unified_live.rate_limit.remaining",
  RATE_LIMIT_WAIT_TIME: "unified_live.rate_limit.wait_time",
  RETRY_COUNT: "unified_live.retry.count",
  PLUGIN_ERRORS: "unified_live.plugin.errors",
  QUOTA_CONSUMED: "unified_live.quota.consumed",
  QUOTA_DAILY_LIMIT: "unified_live.quota.daily_limit",
  TOKEN_REFRESH_COUNT: "unified_live.token.refresh_count",
  TOKEN_REFRESH_ERRORS: "unified_live.token.refresh_errors",
} as const;
