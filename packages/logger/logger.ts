import { Logger as TsLogger, type ISettingsParam } from "tslog";
import { getLogContext } from "./context";
import { createGcpTransport, type TslogLogObj } from "./formatter";
import type { LogContext, LoggerConfig } from "./schema";
import { LoggerConfigSchema } from "./schema";

/**
 * Log object interface for type-safe logging
 */
interface LogObj {
  context?: LogContext;
  [key: string]: unknown;
}

/**
 * Logger class wrapping tslog with Google Cloud Logging support
 */
export class Logger {
  private readonly tsLogger: TsLogger<LogObj>;
  private readonly config: LoggerConfig;
  private contextProvider: (() => LogContext | undefined) | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    const validatedConfig = LoggerConfigSchema.parse(config ?? {});
    this.config = validatedConfig;

    const settings: ISettingsParam<LogObj> = {
      minLevel: validatedConfig.minLevel,
      type: "json",
      overwrite: {
        transportJSON: (json: unknown) => {
          const transport = createGcpTransport(validatedConfig, () =>
            this.contextProvider?.(),
          );
          transport(json as TslogLogObj);
        },
      },
    };
    if (validatedConfig.name) {
      settings.name = validatedConfig.name;
    }
    this.tsLogger = new TsLogger<LogObj>(settings);
  }

  /**
   * Sets a context provider function that will be called for each log entry
   * Useful for async local storage integration
   */
  setContextProvider(provider: () => LogContext | undefined): void {
    this.contextProvider = provider;
  }

  /**
   * Creates a child logger with additional default configuration
   */
  child(name: string, additionalLabels?: Record<string, string>): Logger {
    const childConfig: Partial<LoggerConfig> = {
      ...this.config,
      name: this.config.name ? `${this.config.name}.${name}` : name,
      defaultLabels: {
        ...this.config.defaultLabels,
        ...additionalLabels,
      },
    };

    const childLogger = new Logger(childConfig);
    childLogger.contextProvider = this.contextProvider;
    return childLogger;
  }

  /**
   * Log at silly level (0)
   */
  silly(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.silly(message, data ?? {});
  }

  /**
   * Log at trace level (1)
   */
  trace(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.trace(message, data ?? {});
  }

  /**
   * Log at debug level (2)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.debug(message, data ?? {});
  }

  /**
   * Log at info level (3)
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.info(message, data ?? {});
  }

  /**
   * Log at warn level (4)
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.warn(message, data ?? {});
  }

  /**
   * Log at error level (5)
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (error) {
      this.tsLogger.error(message, error, data ?? {});
    } else {
      this.tsLogger.error(message, data ?? {});
    }
  }

  /**
   * Log at fatal level (6)
   */
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (error) {
      this.tsLogger.fatal(message, error, data ?? {});
    } else {
      this.tsLogger.fatal(message, data ?? {});
    }
  }

  /**
   * Log with explicit context override
   */
  withContext(context: LogContext): ContextLogger {
    return new ContextLogger(this.tsLogger, context);
  }
}

/**
 * Logger instance with explicit context
 */
class ContextLogger {
  constructor(
    private readonly tsLogger: TsLogger<LogObj>,
    private readonly context: LogContext,
  ) {}

  silly(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.silly(message, { ...data, context: this.context });
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.trace(message, { ...data, context: this.context });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.debug(message, { ...data, context: this.context });
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.info(message, { ...data, context: this.context });
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.tsLogger.warn(message, { ...data, context: this.context });
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (error) {
      this.tsLogger.error(message, error, { ...data, context: this.context });
    } else {
      this.tsLogger.error(message, { ...data, context: this.context });
    }
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (error) {
      this.tsLogger.fatal(message, error, { ...data, context: this.context });
    } else {
      this.tsLogger.fatal(message, { ...data, context: this.context });
    }
  }
}

/**
 * Creates a new logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

/**
 * Creates a logger instance with AsyncLocalStorage context provider pre-configured
 * This logger will automatically include context from runWithLogContext calls
 *
 * @example
 * ```ts
 * const logger = createLoggerWithContext();
 *
 * runWithLogContext({ labels: { requestId: "req-123" } }, () => {
 *   logger.info("Request received"); // Will include requestId in labels
 * });
 * ```
 */
export function createLoggerWithContext(
  config?: Partial<LoggerConfig>,
): Logger {
  const logger = new Logger(config);
  logger.setContextProvider(getLogContext);
  return logger;
}

export type { ContextLogger };
