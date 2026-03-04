import {
  type AppError,
  type BaseError,
  createAppError,
  Err,
  type Result,
  wrap,
} from "@my-app/errors";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { getDb } from "./mysql/db";
import type * as schema from "./mysql/schema";

export type Transaction = Parameters<
  MySql2Database<typeof schema>["transaction"]
>[0] extends (tx: infer T) => Promise<unknown>
  ? T
  : never;

export type TxManager = Readonly<{
  runTx<T, E extends BaseError>(
    operation: (tx: Transaction) => Promise<Result<T, E>>,
  ): Promise<Result<T, E | AppError>>;
}>;

export const TxManager = {
  runTx: async <T, E extends BaseError>(
    operation: (tx: Transaction) => Promise<Result<T, E>>,
  ): Promise<Result<T, E | AppError>> => {
    const dbResult = await getDb();
    if ("err" in dbResult) {
      return dbResult as Result<T, E | AppError>;
    }
    const db = dbResult.val;

    const txResult = await wrap(
      db.transaction(async (tx) => operation(tx)),
      (error): E | AppError => {
        // If the error is already a Result type, extract and return err
        if (
          error &&
          typeof error === "object" &&
          "err" in error &&
          (error as { err: unknown }).err
        ) {
          return (error as { err: E | AppError }).err;
        }
        return createAppError({
          message: "Transaction failed",
          code: "INTERNAL_SERVER_ERROR",
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      },
    );

    if (txResult.err) {
      return Err(txResult.err);
    }
    // On wrap success, val is guaranteed to exist
    // biome-ignore lint/style/noNonNullAssertion: Result pattern guarantees val exists when err is null
    return txResult.val!;
  },
} as const;
