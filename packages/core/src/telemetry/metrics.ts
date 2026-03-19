import type { Meter, MeterProvider } from "@opentelemetry/api";
import { metrics } from "@opentelemetry/api";

declare const __SDK_VERSION__: string;

const METER_NAME = "unified-live";
const METER_VERSION = __SDK_VERSION__;

/**
 * Returns the SDK meter instance.
 * When no OTel SDK is registered, this returns a no-op meter automatically
 * (built into @opentelemetry/api).
 *
 * @param provider - optional MeterProvider override (defaults to global)
 * @returns the SDK meter instance
 * @precondition none
 * @postcondition returns a Meter instance (possibly no-op)
 * @idempotency Safe — always returns the same meter for the same provider
 * @category Observability
 */
export const getMeter = (provider?: MeterProvider): Meter => {
  const mp = provider ?? metrics;
  return mp.getMeter(METER_NAME, METER_VERSION);
};

/**
 * Standard metric names used by the SDK.
 *
 * @category Observability
 */
export const MetricNames = {
  HTTP_CLIENT_REQUEST_DURATION: "http.client.request.duration",
} as const;
