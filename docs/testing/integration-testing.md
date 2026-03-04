# Integration Testing Implementation Policy

## Purpose

- Guarantee the behavior of multi-module collaboration including UseCase, Repository, and DB
- Detect boundary mismatches (persistence, transactions, transformations) invisible to unit tests

## Scope

- `services/api/usecase/**`
- `services/api/infra/repository/**`
- Application flows involving the DB

## Implementation Rules

1. Use real implementations for application internals (UseCase/Repository/DB)
2. Only mock external service dependencies at the boundary
3. Enumerate business scenarios with table-driven tests
4. Keep each test independent; do not depend on data from previous cases

## Data Management

- Run migrate/seed before tests
- Create required data per test and avoid unnecessary shared state
- Ensure reproducibility in CI via `compose.test.yaml`

## Mocking Policy

- Default: no mocking (especially use real DB)
- Exception: only for uncontrollable external boundaries such as payment, email, and external SaaS

## File Placement

- `services/api/test/integration/**/*.test.ts`
- Align with the `include` in `services/api/vitest.integration.config.ts`

## Execution Commands

- All: `pnpm test:integration`
- API only: `pnpm --filter api test:integration`

## References (Primary Sources)

- Playwright Test Isolation: https://playwright.dev/docs/browser-contexts
- Next.js Testing (organizing test types): https://nextjs.org/docs/app/guides/testing
- t_wada policy: `docs/web-frontend/twada-tdd.md`
