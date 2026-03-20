import { afterEach, describe, expect, it, vi } from "vitest";
import { getLogger, setLoggerProvider } from "./logger.js";

describe("getLogger", () => {
  afterEach(() => {
    setLoggerProvider(undefined);
  });

  it("returns no-op logger when no provider set", () => {
    const logger = getLogger("test");
    expect(() => logger.log("info", "hello")).not.toThrow();
  });

  it("returns provider logger when set", () => {
    const logSpy = vi.fn();
    setLoggerProvider({ getLogger: () => ({ log: logSpy }) });
    const logger = getLogger("test");
    logger.log("info", "hello", { key: "val" });
    expect(logSpy).toHaveBeenCalledWith("info", "hello", { key: "val" });
  });

  it("reverts to no-op after clearing provider", () => {
    const logSpy = vi.fn();
    setLoggerProvider({ getLogger: () => ({ log: logSpy }) });
    setLoggerProvider(undefined);
    const logger = getLogger("test");
    logger.log("info", "should not reach spy");
    expect(logSpy).not.toHaveBeenCalled();
  });
});
