import type { UnifiedLiveError } from "./errors.js";

export type OkResult<V> = {
  val: V;
  err?: never;
};

export type ErrResult<E extends UnifiedLiveError> = {
  val?: never;
  err: E;
};

export type Result<V, E extends UnifiedLiveError = UnifiedLiveError> =
  | OkResult<V>
  | ErrResult<E>;

export function Ok(): OkResult<never>;
export function Ok<V>(val: V): OkResult<V>;
export function Ok<V>(val?: V): OkResult<V> {
  return { val } as OkResult<V>;
}

export function Err<E extends UnifiedLiveError>(err: E): ErrResult<E> {
  return { err };
}

/**
 * Wrap a promise into a Result, catching thrown errors.
 *
 * @precondition errorFactory converts any caught Error into a UnifiedLiveError subclass
 * @postcondition returns Ok on success, Err on failure — never throws
 * @idempotency Safe — pure wrapper
 */
export async function wrap<T, E extends UnifiedLiveError>(
  p: Promise<T>,
  errorFactory: (err: Error) => E,
): Promise<Result<T, E>> {
  try {
    return Ok(await p);
  } catch (e) {
    return Err(errorFactory(e as Error));
  }
}

/**
 * Unwrap a Result — returns the value or throws the error.
 * Use at public API boundaries to convert Result back to thrown exceptions.
 *
 * @precondition result is a valid Result
 * @postcondition returns val if Ok, throws err if Err
 */
export function unwrap<V, E extends UnifiedLiveError>(result: Result<V, E>): V {
  if (result.err) {
    throw result.err;
  }
  return result.val as V;
}
