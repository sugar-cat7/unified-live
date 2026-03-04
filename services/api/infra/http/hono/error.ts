import { z } from "@hono/zod-openapi";
import { AppError, isDomainErrorCode } from "@my-app/errors";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { logger } from "../../logger";
import type { HonoEnv } from "./env";

/** Schema for Zod error message array */
const zodErrorArraySchema = z.array(
  z.object({
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
  }),
);

const ErrorSchema = z.object({
  error: z.object({
    code: z.string().openapi({
      description: "A machine readable error code.",
      example: "E2001",
    }),
    message: z.string().openapi({
      description: "Debug message (not for user display)",
    }),
    requestId: z.string().openapi({
      description: "Please always include the requestId in your error report",
      example: "req_1234",
    }),
    context: z
      .record(z.string(), z.unknown())
      .optional()
      .openapi({ description: "Typed context data for the error" }),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorSchema>;

export const handleError = (err: Error, c: Context<HonoEnv>): Response => {
  const requestId = c.get("requestId");
  logger.error("Request error", err, { requestId });
  if (err instanceof AppError) {
    // Include context only for domain errors
    const code = err.code as string;
    const includeContext = isDomainErrorCode(code) && err.context != null;

    return c.json<ErrorResponse, ContentfulStatusCode>(
      {
        error: {
          code: err.code,
          message: err.message,
          requestId,
          ...(includeContext ? { context: err.context } : {}),
        },
      },
      err.status as ContentfulStatusCode,
    );
  }

  if (err instanceof ZodError) {
    return c.json<ErrorResponse, ContentfulStatusCode>(
      {
        error: {
          code: "BAD_REQUEST",
          message: parseZodErrorMessage(err),
          requestId,
        },
      },
      400,
    );
  }

  return c.json<ErrorResponse, ContentfulStatusCode>(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message ?? "something unexpected happened",
        requestId,
      },
    },
    500,
  );
};

const parseZodErrorMessage = (err: z.ZodError): string => {
  try {
    const parseResult = zodErrorArraySchema.safeParse(JSON.parse(err.message));
    if (!parseResult.success || parseResult.data.length === 0) {
      return err.message;
    }
    const { path, message } = parseResult.data[0];
    return `${path.join(".")}: ${message}`;
  } catch {
    return err.message;
  }
};

export const handleZodError = (
  result:
    | {
        success: true;
        data: unknown;
      }
    | {
        success: false;
        error: ZodError;
      },
  c: Context<HonoEnv>,
) => {
  if (!result.success) {
    logger.error("Zod validation error", result.error);
    return c.json<ErrorResponse, ContentfulStatusCode>(
      {
        error: {
          code: "BAD_REQUEST",
          message: parseZodErrorMessage(result.error),
          requestId: c.get("requestId"),
        },
      },
      400,
    );
  }
};

/** @lintignore */
export const errorSchemaFactory = (
  codes: z.ZodEnum<Readonly<Record<string, string>>>,
) =>
  z.object({
    error: z.object({
      code: codes.openapi({
        description: "A machine readable error code.",
        example: "INTERNAL_SERVER_ERROR",
      }),
      message: z.string().openapi({
        description: "A human readable explanation of what went wrong",
      }),
    }),
  });
