# Testing Strategy Overview

This directory is the Single Source of Truth for implementation policies per test type.

## Common Principles

- Follow t_wada-based `Red-Green-Refactor` in short cycles
- Use table-driven tests (`it.each` / `test.each`) as the default pattern
- Default is "no mocking." Pass through internal dependencies with real implementations
- Exception: only mock boundaries you cannot control, such as external SaaS, payment, or email services
- Verify behavior visible to the consumer, not implementation details

## Test Types and Responsibilities

| Type | Purpose | Primary Tools | Policy |
| --- | --- | --- | --- |
| Unit | Verify localized behavior of functions/domain | Vitest | Fast, pure, minimal side effects |
| Integration | Verify multi-module collaboration | Vitest + real DB | Pass through Repository/UseCase/DB |
| API | Endpoint contract and input/output guarantees | Hono testClient + OpenAPI | Hit routes with real implementations |
| UI | Verify components from the user's perspective | Vitest + Testing Library | Role-based selection, real DOM focus |
| VRT | Detect visual regressions | Storybook + Playwright | Stabilize snapshots |
| E2E | Guarantee entire user flows | Playwright | Verify paths in production-equivalent environment |

## Coverage Policy

| Target Package | Minimum Coverage | CI Enforced |
| --- | --- | --- |
| `services/api/domain/**` | 60% | Yes |
| `packages/**` | 60% | Yes |
| `services/web/shared/lib/**` | 50% | No (recommended) |

- PRs that fall below coverage thresholds will fail in CI
- Thresholds will be raised incrementally (initial settings are conservative)
- Do not write meaningless tests just for coverage. Reach coverage naturally through tests that verify behavior

## Document List

- [unit-testing.md](./unit-testing.md)
- [integration-testing.md](./integration-testing.md)
- [api-testing.md](./api-testing.md)
- [ui-testing.md](./ui-testing.md)
- [vrt-testing.md](./vrt-testing.md)
- [e2e-testing.md](./e2e-testing.md)
