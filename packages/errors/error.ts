import { BaseError, type ErrorContext } from "./base";
import { codeToStatus, type ErrorCode } from "./code";
import type { DomainErrorCode } from "./domain-code";
import type { DomainErrorContextMap } from "./domain-context";

/**
 * Resolves the context type corresponding to an error code
 * - For domain error codes: retrieves the type from DomainErrorContextMap (excluding undefined)
 * - For generic error codes: any ErrorContext
 */
type ContextForCode<TCode extends ErrorCode> = TCode extends DomainErrorCode
  ? TCode extends keyof DomainErrorContextMap
    ? DomainErrorContextMap[TCode] extends undefined
      ? ErrorContext | undefined
      : DomainErrorContextMap[TCode]
    : ErrorContext
  : ErrorContext;

/**
 * Type definition for AppError options
 */
export type AppErrorOptions<TCode extends ErrorCode> = {
  code: TCode;
  message: string;
  cause?: unknown;
  context?: ContextForCode<TCode>;
  retry?: boolean;
};

/**
 * Option type for domain errors
 * - For codes requiring context: the context property is required
 * - For codes not requiring context: the context property is optional
 */
export type DomainErrorOptions<TCode extends DomainErrorCode> =
  DomainErrorContextMap[TCode] extends undefined
    ? AppErrorOptions<TCode>
    : Omit<AppErrorOptions<TCode>, "context"> & {
        context: DomainErrorContextMap[TCode];
      };

export class AppError<TCode extends ErrorCode = ErrorCode> extends BaseError {
  public readonly name = "AppError";
  public readonly retry: boolean;
  public readonly code: TCode;
  public readonly status: number;
  public override readonly context: ContextForCode<TCode> | undefined;

  constructor(opts: AppErrorOptions<TCode>) {
    super({
      message: opts.message,
      ...(opts.cause instanceof Error ? { cause: opts.cause } : {}),
    });
    this.retry = opts.retry ?? false;
    this.code = opts.code;
    this.status = codeToStatus(opts.code);
    this.context = opts.context;
  }
}

/**
 * Generic error creation factory function
 */
export const createAppError = <TCode extends ErrorCode>(
  opts: AppErrorOptions<TCode>,
): AppError<TCode> => new AppError(opts);

/**
 * Domain error factory function
 * - For error codes requiring context, the context property is required
 * - For error codes not requiring context, the context property is optional
 */
export const createDomainError = <TCode extends DomainErrorCode>(
  opts: DomainErrorOptions<TCode>,
): AppError<TCode> => new AppError(opts as AppErrorOptions<TCode>);
