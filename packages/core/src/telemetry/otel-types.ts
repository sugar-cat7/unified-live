/**
 * No-op OpenTelemetry implementations.
 *
 * Types are re-exported from @opentelemetry/api (type-only imports, stripped
 * at build time) so we automatically track upstream changes.
 * Only the no-op runtime stubs live here — no runtime import from
 * @opentelemetry/api exists in the production bundle.
 *
 * @module
 * @internal
 */
import type { Meter, MeterProvider, Span, Tracer, TracerProvider } from "@opentelemetry/api";

// ---------------------------------------------------------------------------
// Re-export types from @opentelemetry/api (compile-time only)
// ---------------------------------------------------------------------------

export type { Meter, MeterProvider, Span, Tracer, TracerProvider };

// ---------------------------------------------------------------------------
// OTel spec constants (avoid importing @opentelemetry/api at runtime)
// ---------------------------------------------------------------------------

/** SpanKind.CLIENT = 3 per OTel spec */
export const SPAN_KIND_CLIENT = 3;

/** SpanStatusCode.ERROR = 2 per OTel spec */
export const SPAN_STATUS_ERROR = 2;

// ---------------------------------------------------------------------------
// No-op implementations
// ---------------------------------------------------------------------------

const noopSpan: Span = {
  spanContext: () => ({
    traceId: "",
    spanId: "",
    traceFlags: 0,
  }),
  setAttribute: () => noopSpan,
  setAttributes: () => noopSpan,
  setStatus: () => noopSpan,
  updateName: () => noopSpan,
  recordException: () => {},
  addEvent: () => noopSpan,
  addLink: () => noopSpan,
  addLinks: () => noopSpan,
  isRecording: () => false,
  end: () => {},
};

const noopTracer: Tracer = {
  startSpan: () => noopSpan,
  startActiveSpan: ((_name: string, ...args: unknown[]): unknown => {
    const fn = args[args.length - 1] as (span: Span) => unknown;
    return fn(noopSpan);
  }) as Tracer["startActiveSpan"],
};

/** @internal */
export const noopTracerProvider: TracerProvider = {
  getTracer: () => noopTracer,
};

const noop = () => {};

const noopMeter: Meter = {
  createHistogram: () => ({ record: noop }) as ReturnType<Meter["createHistogram"]>,
  createCounter: () => ({ add: noop }) as ReturnType<Meter["createCounter"]>,
  createUpDownCounter: () => ({ add: noop }) as ReturnType<Meter["createUpDownCounter"]>,
  createGauge: () => ({ record: noop }) as ReturnType<Meter["createGauge"]>,
  createObservableGauge: () =>
    ({ addCallback: noop, removeCallback: noop }) as ReturnType<Meter["createObservableGauge"]>,
  createObservableCounter: () =>
    ({ addCallback: noop, removeCallback: noop }) as ReturnType<Meter["createObservableCounter"]>,
  createObservableUpDownCounter: () =>
    ({
      addCallback: noop,
      removeCallback: noop,
    }) as ReturnType<Meter["createObservableUpDownCounter"]>,
  addBatchObservableCallback: noop,
  removeBatchObservableCallback: noop,
};

/** @internal */
export const noopMeterProvider: MeterProvider = {
  getMeter: () => noopMeter,
};
