import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import type { HonoEnv } from "./env";
import { handleError, handleZodError } from "./error";

export const newApp = () => {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  });

  // CORS must be the first middleware to ensure headers are added to error responses
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      exposeHeaders: ["Set-Cookie"],
    }),
  );
  app.use(prettyJSON(), contextStorage());
  app.onError(handleError);
  app.use("/swagger-ui");
  app.use("/doc");
  app.doc("/doc", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "api",
      description: "API",
    },
  });
  app.get("/swagger-ui", swaggerUI({ url: "/doc" }));

  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
};
