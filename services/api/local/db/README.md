# Local DB Setup (Server)

## DATABASE_URL

For local development, set `DATABASE_URL` to the following:

```
mysql://root@127.0.0.1:4000/test
```

`services/api` reads `.env.local` from the repository root.

## Migrate

```bash
pnpm --filter server db:migrate
```

## Seed Prompts

```bash
pnpm --filter server tsx --env-file=../../.env.local local/db/seed-prompts.ts
```

If `DATABASE_URL` is not set, `seed-prompts.ts` uses the default value
(`mysql://root@127.0.0.1:4000/test`).
