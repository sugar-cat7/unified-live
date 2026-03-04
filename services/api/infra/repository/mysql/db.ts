import {
  type AppError,
  createAppError,
  Err,
  Ok,
  type Result,
  wrap,
} from "@my-app/errors";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export type DB = MySql2Database<typeof schema>;

let connection: mysql.Connection | null = null;

export const getDb = async (): Promise<Result<DB, AppError>> => {
  if (!connection) {
    const result = await wrap(
      mysql.createConnection({
        uri: process.env.DATABASE_URL,
      }),
      (err) =>
        createAppError({
          message: "Failed to connect to database",
          code: "INTERNAL_SERVER_ERROR",
          cause: err,
        }),
    );
    if (result.err) {
      return Err(result.err);
    }
    connection = result.val;
  }

  return Ok(drizzle(connection, { schema, mode: "default" }));
};
