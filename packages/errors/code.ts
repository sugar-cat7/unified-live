import { z } from "zod";
import {
  DomainErrorCodeSchema,
  domainCodeToStatus,
  isDomainErrorCode,
} from "./domain-code";

/**
 * Generic HTTP error codes
 */
export const HttpErrorCodeSchema = z.enum([
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
]);

export type HttpErrorCode = z.infer<typeof HttpErrorCodeSchema>;

/**
 * Unified error codes (generic + domain)
 */
export const ErrorCodeSchema = z.union([
  HttpErrorCodeSchema,
  DomainErrorCodeSchema,
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/**
 * Error code to HTTP status
 */
export const codeToStatus = (code: ErrorCode): number => {
  if (isDomainErrorCode(code)) {
    return domainCodeToStatus(code);
  }

  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "FORBIDDEN":
    case "DISABLED":
    case "UNAUTHORIZED":
    case "INSUFFICIENT_PERMISSIONS":
    case "USAGE_EXCEEDED":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "METHOD_NOT_ALLOWED":
      return 405;
    case "NOT_UNIQUE":
      return 409;
    case "PRECONDITION_FAILED":
      return 412;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL_SERVER_ERROR":
      return 500;
    default:
      return 500;
  }
};

export { isDomainErrorCode } from "./domain-code";
