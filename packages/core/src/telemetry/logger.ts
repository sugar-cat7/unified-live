/** @category Observability */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** @category Observability */
export type Logger = {
  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void;
};

/** @category Observability */
export type LoggerProvider = {
  getLogger(name: string): Logger;
};

let globalLoggerProvider: LoggerProvider | undefined;

/**
 * Set or clear the global logger provider for SDK internal logging.
 * @param provider - the LoggerProvider to install globally, or `undefined` to clear
 * @precondition none
 * @postcondition SDK internal log calls will be routed to the provider if set, or no-op if cleared
 * @idempotency Safe — last call wins
 * @category Observability
 */
export const setLoggerProvider = (provider: LoggerProvider | undefined): void => {
  globalLoggerProvider = provider;
};

/**
 * Get a logger instance. Returns no-op logger when no provider is set.
 * @param name - the logger name (typically the module or component name)
 * @returns a Logger instance (possibly no-op)
 * @precondition none
 * @postcondition returns a Logger (possibly no-op)
 * @idempotency Safe
 * @category Observability
 */
export const getLogger = (name: string): Logger => {
  if (globalLoggerProvider) return globalLoggerProvider.getLogger(name);
  return { log: () => {} };
};
