import fs from "node:fs";
import { createServer } from "node:https";
import { serve } from "@hono/node-server";
import { newApp } from "../infra/http/hono/app";
import { authHandler, init, requireAuth } from "../infra/http/hono/middleware";
import { registerRoutes } from "../infra/http/hono/routes";
import { logger } from "../infra/logger";

const app = newApp();

// Base middleware
app.use("*", init);

// Better Auth handler (OAuth flow processing)
app.on(["POST", "GET"], "/api/auth/*", authHandler);

// Debug logging
app.use("*", async (c, next) => {
  logger.debug(`--> ${c.req.method} ${c.req.url}`);
  await next();
  logger.debug(`<-- ${c.req.method} ${c.req.url} ${c.res.status}`);
});

// Authentication required (except public paths)
app.use("*", requireAuth());

const appWithRoutes = registerRoutes(app);

const PORT = Number(process.env.SERVER_PORT) || 4001;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "";
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "";

if (SSL_KEY_PATH && SSL_CERT_PATH) {
  serve(
    {
      fetch: appWithRoutes.fetch,
      port: PORT,
      createServer,
      serverOptions: {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      },
    },
    (info) => {
      logger.info(`Server is running on https://localhost:${info.port}`);
    },
  );
} else {
  serve(
    {
      fetch: appWithRoutes.fetch,
      port: PORT,
    },
    (info) => {
      logger.info(`Server is running on http://localhost:${info.port}`);
    },
  );
}
