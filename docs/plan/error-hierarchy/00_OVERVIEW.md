# Error Hierarchy — Overview

## Purpose

Establish a comprehensive, type-safe error hierarchy for the unified-live SDK that supports production debugging, monitoring, and programmatic error handling.

## Background

The current error system has 5 error classes with a loose `string` code field, no `cause` chain, no structured context, and missing coverage for common failure scenarios (network errors, parse errors, validation errors, timeouts).

## Goals

1. **Type-safe error codes**: String literal union, not loose `string`
2. **Hierarchical codes**: Category prefix + specific name (e.g., `NETWORK_TIMEOUT`)
3. **`cause` chain**: Wrap original errors using ES2022 `Error.cause`
4. **Structured context**: Include request path, HTTP status, method in every error
5. **Complete coverage**: Add error types for all known failure scenarios
6. **Backward compatible**: Existing `instanceof` checks continue to work

## Success Criteria

- All `throw` statements in the codebase use SDK error types (no generic `Error`)
- `error.code` is narrowed by TypeScript to specific literals per error class
- `error.cause` preserves the original error for debugging
- `error.context` provides structured metadata for logging/monitoring
- All existing tests pass after migration

## In Scope

- Error code string union type (`ErrorCode`)
- `cause` chain via ES2022 `Error.cause`
- Structured context (`ErrorContext`)
- New error classes: `NetworkError`, `ParseError`, `ValidationError`, `TimeoutError`
- Hierarchical error codes (`NETWORK_TIMEOUT`, `NETWORK_DNS`, etc.)
- Migration of all existing `throw` statements

## Out of Scope

- i18n error messages
- HTTP response mapping (server-side usage)
- Custom error class extension API for external plugin authors
