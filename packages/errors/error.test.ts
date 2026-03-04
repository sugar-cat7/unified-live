import { describe, expect, it } from "vitest";
import type { ErrorCode } from "./code";
import { AppError } from "./error";

// ============================================
// AppError constructor tests
// ============================================

describe("AppError", () => {
  describe("constructor", () => {
    const constructorTestCases = [
      {
        name: "can create a basic error",
        input: {
          message: "Something went wrong",
          code: "INTERNAL_SERVER_ERROR" as const,
        },
        expected: {
          message: "Something went wrong",
          code: "INTERNAL_SERVER_ERROR",
          name: "AppError",
          retry: false,
          hasCause: false,
          hasContext: false,
        },
      },
      {
        name: "can set the retry flag",
        input: {
          message: "Temporary failure",
          code: "RATE_LIMITED" as const,
          retry: true,
        },
        expected: {
          message: "Temporary failure",
          code: "RATE_LIMITED",
          name: "AppError",
          retry: true,
          hasCause: false,
          hasContext: false,
        },
      },
      {
        name: "can set context",
        input: {
          message: "Authentication failed",
          code: "UNAUTHORIZED" as const,
          context: { userId: "123", action: "login" },
        },
        expected: {
          message: "Authentication failed",
          code: "UNAUTHORIZED",
          name: "AppError",
          retry: false,
          hasCause: false,
          hasContext: true,
          context: { userId: "123", action: "login" },
        },
      },
    ];

    it.each(constructorTestCases)("$name", ({ input, expected }) => {
      const error = new AppError(input);

      expect(error.message).toBe(expected.message);
      expect(error.code).toBe(expected.code);
      expect(error.name).toBe(expected.name);
      expect(error.retry).toBe(expected.retry);

      if (expected.hasContext) {
        expect(error.context).toEqual(expected.context);
      } else {
        expect(error.context).toBeUndefined();
      }

      if (expected.hasCause) {
        expect(error.cause).toBeDefined();
      } else {
        expect(error.cause).toBeUndefined();
      }
    });

    const causeTestCases = [
      {
        name: "can set an Error instance as cause",
        cause: new Error("Original error"),
        shouldHaveCause: true,
      },
      {
        name: "ignores cause when it is a string",
        cause: "string cause",
        shouldHaveCause: false,
      },
      {
        name: "ignores cause when it is a number",
        cause: 123,
        shouldHaveCause: false,
      },
      {
        name: "ignores cause when it is null",
        cause: null,
        shouldHaveCause: false,
      },
    ];

    it.each(causeTestCases)("$name", ({ cause, shouldHaveCause }) => {
      const error = new AppError({
        message: "Test",
        code: "INTERNAL_SERVER_ERROR",
        cause,
      });

      if (shouldHaveCause) {
        expect(error.cause).toBeDefined();
      } else {
        expect(error.cause).toBeUndefined();
      }
    });
  });

  // ============================================
  // Status code mapping tests
  // ============================================

  describe("status", () => {
    const statusTestCases: Array<{ code: ErrorCode; expectedStatus: number }> = [
      { code: "BAD_REQUEST", expectedStatus: 400 },
      { code: "UNAUTHORIZED", expectedStatus: 403 },
      { code: "FORBIDDEN", expectedStatus: 403 },
      { code: "DISABLED", expectedStatus: 403 },
      { code: "INSUFFICIENT_PERMISSIONS", expectedStatus: 403 },
      { code: "USAGE_EXCEEDED", expectedStatus: 403 },
      { code: "NOT_FOUND", expectedStatus: 404 },
      { code: "METHOD_NOT_ALLOWED", expectedStatus: 405 },
      { code: "NOT_UNIQUE", expectedStatus: 409 },
      { code: "PRECONDITION_FAILED", expectedStatus: 412 },
      { code: "RATE_LIMITED", expectedStatus: 429 },
      { code: "INTERNAL_SERVER_ERROR", expectedStatus: 500 },
    ];

    it.each(statusTestCases)(
      "$code maps to HTTP $expectedStatus",
      ({ code, expectedStatus }) => {
        const error = new AppError({ message: "Test", code });

        expect(error.status).toBe(expectedStatus);
      },
    );
  });

  // ============================================
  // toString tests
  // ============================================

  describe("toString", () => {
    const toStringTestCases = [
      {
        name: "can stringify a basic error",
        input: {
          message: "Something went wrong",
          code: "INTERNAL_SERVER_ERROR" as const,
        },
        expectedContains: ["AppError", "Something went wrong"],
      },
      {
        name: "can stringify an error with context",
        input: {
          message: "Not found",
          code: "NOT_FOUND" as const,
          context: { resourceId: "123" },
        },
        expectedContains: ["resourceId", "123"],
      },
    ];

    it.each(toStringTestCases)("$name", ({ input, expectedContains }) => {
      const error = new AppError(input);
      const str = error.toString();

      for (const expected of expectedContains) {
        expect(str).toContain(expected);
      }
    });

    it("can stringify an error with cause", () => {
      const originalError = new Error("Original");
      const error = new AppError({
        message: "Wrapped",
        code: "INTERNAL_SERVER_ERROR",
        cause: originalError,
      });

      const str = error.toString();
      expect(str).toContain("caused by");
      expect(str).toContain("Original");
    });
  });

  // ============================================
  // Error inheritance tests
  // ============================================

  describe("Error inheritance", () => {
    const inheritanceTestCases = [
      {
        name: "inherits from the Error class",
        check: (error: AppError) => error instanceof Error,
        expected: true,
      },
      {
        name: "has a stack trace",
        check: (error: AppError) =>
          error.stack !== undefined && error.stack.includes("AppError"),
        expected: true,
      },
    ];

    it.each(inheritanceTestCases)("$name", ({ check, expected }) => {
      const error = new AppError({
        message: "Test",
        code: "INTERNAL_SERVER_ERROR",
      });

      expect(check(error)).toBe(expected);
    });
  });
});
