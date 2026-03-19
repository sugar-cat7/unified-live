import type { Tracer } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";

const TRACER_NAME = "unified-live";
const TRACER_VERSION = "0.1.0";

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
  return trace.getTracer(TRACER_NAME, TRACER_VERSION);
};

/**
 * Standard span attribute keys used by the SDK.
 *
 * @category Observability
 */
export const SpanAttributes = {
  // Platform attributes
  PLATFORM: "unified_live.platform",

  // HTTP semantic conventions (stable)
  HTTP_METHOD: "http.request.method",
  URL_PATH: "url.path",
  HTTP_STATUS: "http.response.status_code",
  SERVER_ADDRESS: "server.address",
  SERVER_PORT: "server.port",

  // Rate limit attributes
  RATE_LIMIT_REMAINING: "unified_live.rate_limit.remaining",
  RATE_LIMIT_LIMIT: "unified_live.rate_limit.limit",

  // Error attributes (namespaced to avoid OTel convention collision)
  ERROR_CODE: "unified_live.error.code",
  ERROR_TYPE: "error.type",
  ERROR_HAS_CAUSE: "unified_live.error.has_cause",

  // Retry attributes
  RETRY_COUNT: "unified_live.retry.count",
} as const;
