import type { Tracer, TracerProvider } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";

declare const __SDK_VERSION__: string;

const TRACER_NAME = "unified-live";
const TRACER_VERSION = __SDK_VERSION__;

/**
 * Returns the SDK tracer instance.
 * When no OTel SDK is registered, this returns a no-op tracer automatically
 * (built into @opentelemetry/api).
 *
 * @param provider - optional TracerProvider override (defaults to global)
 * @returns the SDK tracer instance
 * @precondition none
 * @postcondition returns a Tracer instance (possibly no-op)
 * @idempotency Safe — always returns the same tracer for the same provider
 * @category Observability
 */
export const getTracer = (provider?: TracerProvider): Tracer => {
  const tp = provider ?? trace;
  return tp.getTracer(TRACER_NAME, TRACER_VERSION);
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

  // HTTP semantic conventions (opt-in)
  URL_FULL: "url.full",
  URL_SCHEME: "url.scheme",

  // Rate limit attributes
  RATE_LIMIT_REMAINING: "unified_live.rate_limit.remaining",
  RATE_LIMIT_LIMIT: "unified_live.rate_limit.limit",

  // Error attributes (namespaced to avoid OTel convention collision)
  ERROR_CODE: "unified_live.error.code",
  ERROR_TYPE: "error.type",
  ERROR_HAS_CAUSE: "unified_live.error.has_cause",

  // Retry attributes
  RETRY_COUNT: "unified_live.retry.count",

  // Client-level span attributes
  OPERATION: "unified_live.operation",
  BATCH_SIZE: "unified_live.batch.size",
} as const;
