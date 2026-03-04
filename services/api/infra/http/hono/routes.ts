import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Schema } from "hono";
import { newApp } from "./app";
import type { HonoEnv } from "./env";

export const registerRoutes = <S extends Schema, BasePath extends string>(
  app: OpenAPIHono<HonoEnv, S, BasePath>,
) => app;

const _createAppForClient = () => registerRoutes(newApp());

const appForClient = registerRoutes(newApp());

/** @lintignore */
export type AppType = typeof appForClient;
