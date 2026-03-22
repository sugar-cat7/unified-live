import type { Meter, MeterProvider } from "@opentelemetry/api";
import { noopMeterProvider } from "./otel-types";

declare const __SDK_VERSION__: string;

const METER_NAME = "unified-live";
const METER_VERSION = __SDK_VERSION__;

/**
 * Returns the SDK meter instance.
 * When no provider is passed, returns a no-op meter with zero overhead.
 * Pass the global `metrics` object from @opentelemetry/api for real metrics.
 *
 * @param provider - optional MeterProvider (e.g., `metrics` from @opentelemetry/api)
 * @returns the SDK meter instance
 * @precondition none
 * @postcondition returns a Meter instance (possibly no-op)
 * @idempotency Safe — always returns the same meter for the same provider
 * @category Observability
 */
export const getMeter = (provider?: MeterProvider): Meter => {
  const mp = provider ?? noopMeterProvider;
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
