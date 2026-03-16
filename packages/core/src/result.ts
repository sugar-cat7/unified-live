import type { UnifiedLiveError } from "./errors";

/** @internal */
export type OkResult<V> = {
  val: V;
  err?: never;
};

/** @internal */
export type ErrResult<E extends UnifiedLiveError> = {
  val?: never;
  err: E;
};

/** @internal */
export type Result<V, E extends UnifiedLiveError = UnifiedLiveError> = OkResult<V> | ErrResult<E>;

/** @internal */
export function Ok(): OkResult<never>;
export function Ok<V>(val: V): OkResult<V>;
export function Ok<V>(val?: V): OkResult<V> {
  return { val } as OkResult<V>;
}

/**
 * @internal
 * @param err - the error to wrap
 * @returns an ErrResult containing the error
 */
export const Err = <E extends UnifiedLiveError>(err: E): ErrResult<E> => {
  return { err };
};

/**
 * Wrap a promise into a Result, catching thrown errors.
 * @internal
 *
 * @param p - the promise to wrap
 * @param errorFactory - converts caught errors into UnifiedLiveError subclasses
 * @returns Ok on success, Err on failure
 * @precondition errorFactory converts any caught Error into a UnifiedLiveError subclass
 * @postcondition returns Ok on success, Err on failure — never throws
 * @idempotency Safe — pure wrapper
 */
export const wrap = async <T, E extends UnifiedLiveError>(
  p: Promise<T>,
  errorFactory: (err: Error) => E,
): Promise<Result<T, E>> => {
  try {
    return Ok(await p);
  } catch (e) {
    return Err(errorFactory(e as Error));
  }
};

/**
 * Unwrap a Result — returns the value or throws the error.
 * Use at public API boundaries to convert Result back to thrown exceptions.
 * @internal
 *
 * @param result - the Result to unwrap
 * @returns the contained value
 * @precondition result is a valid Result
 * @postcondition returns val if Ok, throws err if Err
 */
export const unwrap = <V, E extends UnifiedLiveError>(result: Result<V, E>): V => {
  if (result.err) {
    throw result.err;
  }
  return result.val as V;
};
