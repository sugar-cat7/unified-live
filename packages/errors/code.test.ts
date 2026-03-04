import { describe, expect, it } from "vitest";
import type { ErrorCode } from "./code";
import { ErrorCodeSchema, codeToStatus } from "./code";

// ============================================
// ErrorCodeSchema tests
// ============================================

describe("ErrorCodeSchema", () => {
  const validCodes = [
    "BAD_REQUEST",
    "FORBIDDEN",
    "INTERNAL_SERVER_ERROR",
    "USAGE_EXCEEDED",
    "DISABLED",
    "NOT_FOUND",
    "NOT_UNIQUE",
    "RATE_LIMITED",
    "UNAUTHORIZED",
    "PRECONDITION_FAILED",
    "INSUFFICIENT_PERMISSIONS",
    "METHOD_NOT_ALLOWED",
  ];

  it.each(validCodes)("'%s' is a valid error code", (code) => {
    const result = ErrorCodeSchema.safeParse(code);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(code);
    }
  });

  const invalidCodes = [
    { value: "INVALID_CODE", description: "non-existent code" },
    { value: "bad_request", description: "lowercase" },
    { value: "BadRequest", description: "camelCase" },
    { value: "", description: "empty string" },
    { value: null, description: "null" },
    { value: undefined, description: "undefined" },
    { value: 123, description: "number" },
    { value: {}, description: "object" },
  ];

  it.each(invalidCodes)("$description ('$value') is an invalid error code", ({ value }) => {
    const result = ErrorCodeSchema.safeParse(value);

    expect(result.success).toBe(false);
  });
});

// ============================================
// codeToStatus tests
// ============================================

describe("codeToStatus", () => {
  const statusMappingTestCases: Array<{
    code: ErrorCode;
    expectedStatus: number;
    description: string;
  }> = [
    { code: "BAD_REQUEST", expectedStatus: 400, description: "400 Bad Request" },
    { code: "FORBIDDEN", expectedStatus: 403, description: "403 Forbidden" },
    { code: "DISABLED", expectedStatus: 403, description: "403 Forbidden (disabled)" },
    { code: "UNAUTHORIZED", expectedStatus: 403, description: "403 Forbidden (unauthorized)" },
    {
      code: "INSUFFICIENT_PERMISSIONS",
      expectedStatus: 403,
      description: "403 Forbidden (insufficient permissions)",
    },
    { code: "USAGE_EXCEEDED", expectedStatus: 403, description: "403 Forbidden (usage exceeded)" },
    { code: "NOT_FOUND", expectedStatus: 404, description: "404 Not Found" },
    { code: "METHOD_NOT_ALLOWED", expectedStatus: 405, description: "405 Method Not Allowed" },
    { code: "NOT_UNIQUE", expectedStatus: 409, description: "409 Conflict" },
    { code: "PRECONDITION_FAILED", expectedStatus: 412, description: "412 Precondition Failed" },
    { code: "RATE_LIMITED", expectedStatus: 429, description: "429 Too Many Requests" },
    {
      code: "INTERNAL_SERVER_ERROR",
      expectedStatus: 500,
      description: "500 Internal Server Error",
    },
  ];

  it.each(statusMappingTestCases)(
    "$code -> $expectedStatus ($description)",
    ({ code, expectedStatus }) => {
      expect(codeToStatus(code)).toBe(expectedStatus);
    },
  );
});
