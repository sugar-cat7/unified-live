import type { Tracer } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";

const TRACER_NAME = "unified-live";

/**
 * Returns the SDK tracer instance.
 * When no OTel SDK is registered, this returns a no-op tracer automatically
 * (built into @opentelemetry/api).
 *
 * @returns the SDK tracer instance
 * @precondition none
 * @postcondition returns a Tracer instance (possibly no-op)
 * @idempotency Safe — always returns the same tracer
 * @category Observability
 */
export const getTracer = (): Tracer => {
  return trace.getTracer(TRACER_NAME);
};

/**
 * Standard span attribute keys used by the SDK.
 *
 * @category Observability
 */
export const SpanAttributes = {
  PLATFORM: "unified_live.platform",
  HTTP_METHOD: "http.request.method",
  URL_PATH: "url.path",
  HTTP_STATUS: "http.response.status_code",
  RATE_LIMIT_REMAINING: "unified_live.rate_limit.remaining",
  RATE_LIMIT_LIMIT: "unified_live.rate_limit.limit",
  QUOTA_CONSUMED: "unified_live.quota.consumed",
  QUOTA_DAILY_REMAINING: "unified_live.quota.daily_remaining",
  ERROR_CODE: "error.code",
  ERROR_TYPE: "error.type",
  ERROR_HAS_CAUSE: "error.has_cause",
} as const;
