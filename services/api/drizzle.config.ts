import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./infra/repository/mysql/migrations",
  schema: "./infra/repository/mysql/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "mysql://root@127.0.0.1:4000/test",
  },
});
