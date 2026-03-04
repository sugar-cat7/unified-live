import type { LogContext } from "./schema";

/**
 * Parses X-Cloud-Trace-Context header into trace context
 * Format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
 * @see https://cloud.google.com/trace/docs/setup#force-trace
 */
export function parseCloudTraceContext(
  header: string | undefined | null,
): Pick<LogContext, "traceId" | "spanId" | "traceSampled"> | undefined {
  if (!header) {
    return undefined;
  }

  // Format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
  const match = header.match(/^([a-f0-9]+)(?:\/(\d+))?(?:;o=(\d))?$/i);

  if (!match) {
    return undefined;
  }

  const [, traceId, spanIdRaw, traceSampledRaw] = match;

  return {
    traceId,
    spanId: spanIdRaw,
    traceSampled: traceSampledRaw === "1",
  };
}

/**
 * Parses traceparent header (W3C Trace Context format)
 * Format: VERSION-TRACE_ID-PARENT_ID-FLAGS
 * @see https://www.w3.org/TR/trace-context/
 */
export function parseTraceparent(
  header: string | undefined | null,
): Pick<LogContext, "traceId" | "spanId" | "traceSampled"> | undefined {
  if (!header) {
    return undefined;
  }

  // Format: VERSION-TRACE_ID-PARENT_ID-FLAGS
  const match = header.match(
    /^([a-f0-9]{2})-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/i,
  );

  if (!match) {
    return undefined;
  }

  const [, version, traceId, spanId, flags] = match;

  // Version 00 is the only currently defined version
  if (version !== "00") {
    return undefined;
  }

  // Bit 0 of flags indicates trace is sampled
  const traceSampled = (Number.parseInt(flags, 16) & 0x01) === 0x01;

  return {
    traceId,
    spanId,
    traceSampled,
  };
}

/**
 * Creates a trace context from HTTP headers
 * Tries X-Cloud-Trace-Context first, then falls back to traceparent
 */
export function createTraceContext(headers: {
  "x-cloud-trace-context"?: string | null;
  traceparent?: string | null;
}): Pick<LogContext, "traceId" | "spanId" | "traceSampled"> | undefined {
  // Prefer Google Cloud trace header
  const cloudTrace = parseCloudTraceContext(headers["x-cloud-trace-context"]);
  if (cloudTrace) {
    return cloudTrace;
  }

  // Fall back to W3C traceparent
  return parseTraceparent(headers.traceparent);
}

/**
 * Generates a random trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a random span ID (16 hex characters)
 */
export function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
