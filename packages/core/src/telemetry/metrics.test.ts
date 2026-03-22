import { describe, expect, it, vi } from "vitest";
import { getMeter, MetricNames } from "./metrics.js";

describe("getMeter", () => {
  it("returns a no-op meter by default", () => {
    const meter = getMeter();
    expect(meter).toBeDefined();
    expect(typeof meter.createHistogram).toBe("function");
  });

  it("no-op meter creates a working histogram", () => {
    const meter = getMeter();
    const histogram = meter.createHistogram("test");
    expect(() => histogram.record(1.0)).not.toThrow();
  });

  it("accepts a custom MeterProvider", () => {
    const mockMeter = {
      createHistogram: vi.fn(),
      createCounter: vi.fn(),
      createUpDownCounter: vi.fn(),
      createObservableGauge: vi.fn(),
      createObservableCounter: vi.fn(),
      createObservableUpDownCounter: vi.fn(),
      createGauge: vi.fn(),
    };
    const mockProvider = {
      getMeter: vi.fn().mockReturnValue(mockMeter),
    };

    const meter = getMeter(mockProvider);
    expect(meter).toBe(mockMeter);
    expect(mockProvider.getMeter).toHaveBeenCalledWith("unified-live", expect.any(String));
  });

  it("uses OTel MeterProvider when passed", () => {
    const { metrics } = require("@opentelemetry/api");
    const spy = vi.spyOn(metrics, "getMeter");
    getMeter(metrics);
    expect(spy).toHaveBeenCalledWith("unified-live", expect.any(String));
    spy.mockRestore();
  });
});

describe("MetricNames", () => {
  it("has HTTP_CLIENT_REQUEST_DURATION = http.client.request.duration", () => {
    expect(MetricNames.HTTP_CLIENT_REQUEST_DURATION).toBe("http.client.request.duration");
  });

  it("has exactly 1 metric name", () => {
    expect(Object.keys(MetricNames)).toHaveLength(1);
  });
});
