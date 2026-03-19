import { metrics } from "@opentelemetry/api";
import { describe, expect, it, vi } from "vitest";
import { getMeter, MetricNames } from "./metrics.js";

describe("getMeter", () => {
  it("returns a meter object", () => {
    const meter = getMeter();
    expect(meter).toBeDefined();
    expect(typeof meter.createHistogram).toBe("function");
    expect(typeof meter.createCounter).toBe("function");
  });

  it("passes meter name and version to metrics.getMeter", () => {
    const spy = vi.spyOn(metrics, "getMeter");
    getMeter();
    expect(spy).toHaveBeenCalledWith("unified-live", expect.any(String));
    spy.mockRestore();
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
});

describe("MetricNames", () => {
  it("has HTTP_CLIENT_REQUEST_DURATION = http.client.request.duration", () => {
    expect(MetricNames.HTTP_CLIENT_REQUEST_DURATION).toBe("http.client.request.duration");
  });

  it("has exactly 1 metric name", () => {
    expect(Object.keys(MetricNames)).toHaveLength(1);
  });
});
