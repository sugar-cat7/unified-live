import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { DB } from "../../repository/mysql/db";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTable,
} from "../../repository/mysql/schema";

export const createAuth = (db: DB) => {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "https://localhost:4001",
    database: drizzleAdapter(db, {
      provider: "mysql",
      schema: {
        user: usersTable,
        session: sessionsTable,
        account: accountsTable,
        verification: verificationTable,
      },
    }),
    socialProviders: {
      google: {
        clientId: process.env.AUTH_GOOGLE_ID || "",
        clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      },
    },
    trustedOrigins: [
      process.env.FRONTEND_URL || "https://localhost:3001",
      "https://localhost:3001",
    ],
  });
};

export type Auth = ReturnType<typeof createAuth>;
