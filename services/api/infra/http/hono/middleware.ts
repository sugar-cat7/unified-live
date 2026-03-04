import { createAppError } from "@my-app/errors";
import type { MiddlewareHandler } from "hono";
import { uuid } from "../../../pkg/uuid";
import { createContainer } from "../../di/container";
import { getDb } from "../../repository/mysql/db";
import { type Auth, createAuth } from "../auth/config";

const container = createContainer();

let authInstance: Auth | null = null;

// Get Better Auth instance
const getAuth = async (): Promise<Auth> => {
  if (authInstance) {
    return authInstance;
  }
  const dbResult = await getDb();
  if (dbResult.err) {
    throw createAppError({
      message: "Failed to connect to database",
      code: "INTERNAL_SERVER_ERROR",
      cause: dbResult.err,
    });
  }
  authInstance = createAuth(dbResult.val);
  return authInstance;
};

// Better Auth handler
export const authHandler: MiddlewareHandler = async (c) => {
  const auth = await getAuth();
  return auth.handler(c.req.raw);
};

export const init: MiddlewareHandler = async (c, next) => {
  c.set("container", container);
  c.set("requestId", c.req.header("x-request-id") ?? uuid());
  await next();
};

// Public paths that do not require authentication
const DEFAULT_PUBLIC_PATHS = [
  "/api/auth", // OAuth flow
  "/health",
  "/openapi",
  "/doc",
];

// Optional authentication paths (set userId if authenticated, no error if not)
const OPTIONAL_AUTH_PATHS: string[] = [];

// Authentication required middleware (except public paths)
export const requireAuth = (
  publicPaths: string[] = DEFAULT_PUBLIC_PATHS,
  optionalAuthPaths: string[] = OPTIONAL_AUTH_PATHS,
): MiddlewareHandler => {
  return async (c, next) => {
    const path = new URL(c.req.url).pathname;

    // Skip if public path
    if (publicPaths.some((p) => path.startsWith(p))) {
      return next();
    }

    // Check if optional auth path
    const isOptionalAuth = optionalAuthPaths.some((p) => path.startsWith(p));

    // Perform authentication
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      // Continue without userId for optional auth paths
      if (isOptionalAuth) {
        return next();
      }
      throw createAppError({
        message: "User is not authenticated",
        code: "UNAUTHORIZED",
        context: { path },
      });
    }

    c.set("session", session.session);
    c.set("user", session.user);
    c.set("userId", session.user.id);
    await next();
  };
};
