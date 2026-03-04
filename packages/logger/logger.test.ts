import { describe, expect, it, vi } from "vitest";
import { createLogger, Logger } from "./logger";

describe("Logger", () => {
	describe("Logger creation", () => {
		const testCases = [
			{
				name: "creates a logger with default settings",
				config: undefined,
			},
			{
				name: "creates a logger with custom settings",
				config: {
					name: "test-logger",
					minLevel: 2,
					projectId: "test-project",
					serviceName: "test-service",
				},
			},
		];

		it.each(testCases)("$name", ({ config }) => {
			const logger = createLogger(config);
			expect(logger).toBeInstanceOf(Logger);
		});
	});

	describe("Child logger", () => {
		const testCases = [
			{
				name: "creates a child logger",
				setup: (parent: Logger) => parent.child("child", { module: "auth" }),
			},
			{
				name: "child logger inherits context provider",
				setup: (parent: Logger) => {
					const contextProvider = vi.fn(() => ({ traceId: "test-trace" }));
					parent.setContextProvider(contextProvider);
					return parent.child("child");
				},
			},
		];

		it.each(testCases)("$name", ({ setup }) => {
			const parent = createLogger({ name: "parent" });
			const child = setup(parent);
			expect(child).toBeInstanceOf(Logger);
		});
	});

	describe("Log methods", () => {
		const testCases = [
			{
				name: "has all log level methods",
				action: (logger: Logger) => {
					expect(() => logger.silly("test")).not.toThrow();
					expect(() => logger.trace("test")).not.toThrow();
					expect(() => logger.debug("test")).not.toThrow();
					expect(() => logger.info("test")).not.toThrow();
					expect(() => logger.warn("test")).not.toThrow();
					expect(() => logger.error("test")).not.toThrow();
					expect(() => logger.fatal("test")).not.toThrow();
				},
			},
			{
				name: "accepts data parameter",
				action: (logger: Logger) => {
					expect(() => logger.info("test", { userId: "123" })).not.toThrow();
				},
			},
			{
				name: "error method accepts Error object",
				action: (logger: Logger) => {
					const error = new Error("Test error");
					expect(() => logger.error("An error occurred", error)).not.toThrow();
					expect(() =>
						logger.error("An error occurred", error, { context: "test" }),
					).not.toThrow();
				},
			},
			{
				name: "fatal method accepts Error object",
				action: (logger: Logger) => {
					const error = new Error("Fatal error");
					expect(() =>
						logger.fatal("Fatal error occurred", error),
					).not.toThrow();
					expect(() =>
						logger.fatal("Fatal error occurred", error, { context: "test" }),
					).not.toThrow();
				},
			},
		];

		it.each(testCases)("$name", ({ action }) => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const logger = createLogger({ minLevel: 6 });

			action(logger);

			consoleSpy.mockRestore();
		});
	});

	describe("withContext", () => {
		const testCases = [
			{
				name: "creates a context logger",
				action: (
					logger: Logger,
				): { contextLogger: ReturnType<Logger["withContext"]> } => {
					const contextLogger = logger.withContext({ traceId: "test-trace" });
					expect(contextLogger).toBeDefined();
					return { contextLogger };
				},
			},
			{
				name: "context logger has all log methods",
				action: (logger: Logger) => {
					const contextLogger = logger.withContext({ traceId: "test-trace" });
					expect(() => contextLogger.silly("test")).not.toThrow();
					expect(() => contextLogger.trace("test")).not.toThrow();
					expect(() => contextLogger.debug("test")).not.toThrow();
					expect(() => contextLogger.info("test")).not.toThrow();
					expect(() => contextLogger.warn("test")).not.toThrow();
					expect(() => contextLogger.error("test")).not.toThrow();
					expect(() => contextLogger.fatal("test")).not.toThrow();
				},
			},
			{
				name: "context logger error accepts Error object",
				action: (logger: Logger) => {
					const contextLogger = logger.withContext({ traceId: "test-trace" });
					const error = new Error("Test error");
					expect(() =>
						contextLogger.error("An error occurred", error),
					).not.toThrow();
				},
			},
		];

		it.each(testCases)("$name", ({ action }) => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const logger = createLogger({ minLevel: 6 });

			action(logger);

			consoleSpy.mockRestore();
		});
	});

	describe("GCP format output", () => {
		const testCases = [
			{
				name: "outputs JSON to stdout",
				logAction: (logger: Logger) => logger.info("Test message"),
				assertions: (consoleSpy: ReturnType<typeof vi.spyOn>) => {
					expect(consoleSpy).toHaveBeenCalled();
					const output = consoleSpy.mock.calls[0][0];
					expect(() => JSON.parse(output)).not.toThrow();

					const parsed = JSON.parse(output);
					expect(parsed.severity).toBe("INFO");
					expect(parsed.message).toContain("Test message");
				},
			},
			{
				name: "includes structured data in output",
				logAction: (logger: Logger) =>
					logger.info("Test message", { userId: "123", action: "login" }),
				assertions: (consoleSpy: ReturnType<typeof vi.spyOn>) => {
					const output = consoleSpy.mock.calls[0][0];
					const parsed = JSON.parse(output);
					expect(parsed.data).toBeDefined();
				},
			},
		];

		it.each(testCases)("$name", ({ logAction, assertions }) => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const logger = createLogger({
				name: "test",
				minLevel: 3,
			});

			logAction(logger);
			assertions(consoleSpy);

			consoleSpy.mockRestore();
		});
	});
});
