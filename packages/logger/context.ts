import { AsyncLocalStorage } from "node:async_hooks";
import type { LogContext } from "./schema";

/**
 * AsyncLocalStorage instance for logger context
 * Allows automatic propagation of request-scoped data (requestId, traceId, etc.)
 */
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

/**
 * Gets the current log context from AsyncLocalStorage
 */
export function getLogContext(): LogContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Runs a function with the given log context
 * The context will be available to all code executed within the callback
 *
 * @example
 * ```ts
 * runWithLogContext({ requestId: "req-123", traceId: "trace-456" }, () => {
 *   // All logs within this callback will include requestId and traceId
 *   logger.info("Processing request");
 * });
 * ```
 */
export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Runs an async function with the given log context
 *
 * @example
 * ```ts
 * await runWithLogContextAsync({ requestId: "req-123" }, async () => {
 *   await someAsyncOperation();
 *   logger.info("Operation completed");
 * });
 * ```
 */
export function runWithLogContextAsync<T>(
  context: LogContext,
  fn: () => Promise<T>,
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Updates the current log context by merging with existing context
 * Must be called within a runWithLogContext callback
 *
 * @example
 * ```ts
 * runWithLogContext({ requestId: "req-123" }, () => {
 *   // Later in the code, add more context
 *   updateLogContext({ userId: "user-456" });
 *   // Now logs will include both requestId and userId
 * });
 * ```
 */
export function updateLogContext(partialContext: Partial<LogContext>): void {
  const currentContext = asyncLocalStorage.getStore();
  if (currentContext) {
    Object.assign(currentContext, partialContext);
  }
}

/**
 * Creates a middleware-style function for frameworks like Hono/Express
 * that automatically sets up log context for each request
 *
 * @example
 * ```ts
 * // Hono middleware
 * app.use(async (c, next) => {
 *   const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
 *   const traceContext = createTraceContext({
 *     "x-cloud-trace-context": c.req.header("x-cloud-trace-context"),
 *   });
 *
 *   await withRequestContext({
 *     requestId,
 *     ...traceContext,
 *     labels: { path: c.req.path },
 *   }, () => next());
 * });
 * ```
 */
export async function withRequestContext<T>(
  context: LogContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Extended log context with common request fields
 */
export interface RequestLogContext extends LogContext {
  /** Unique request identifier */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Session ID */
  sessionId?: string;
}

/**
 * Gets the current request ID from context
 */
export function getRequestId(): string | undefined {
  const context = asyncLocalStorage.getStore() as RequestLogContext | undefined;
  return context?.labels?.requestId;
}

/**
 * Creates a log context with request ID in labels
 */
export function createRequestContext(
  requestId: string,
  additionalContext?: Partial<LogContext>,
): LogContext {
  return {
    ...additionalContext,
    labels: {
      ...additionalContext?.labels,
      requestId,
    },
  };
}
