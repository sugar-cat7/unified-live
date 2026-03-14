# Testing Strategy Overview

This directory is the Single Source of Truth for implementation policies per test type.

## Common Principles

- Follow t_wada-based `Red-Green-Refactor` in short cycles
- Use table-driven tests (`it.each` / `test.each`) as the default pattern
- Default is "no mocking." Pass through internal dependencies with real implementations
- Exception: only mock boundaries you cannot control (platform API responses via mock fetch)
- Verify behavior visible to the consumer, not implementation details

## Test Types and Responsibilities

| Type        | Purpose                                                                        | Primary Tools       | Policy                                     |
| ----------- | ------------------------------------------------------------------------------ | ------------------- | ------------------------------------------ |
| Unit        | Verify Zod schemas, mappers, URL parsers, rate limit strategies, error classes | Vitest              | Fast, pure, minimal side effects           |
| Integration | Verify plugin + RestManager + client end-to-end flow                           | Vitest + mock fetch | Real SDK wiring with mocked HTTP responses |

## Coverage Policy

| Target Package        | Minimum Coverage | CI Enforced |
| --------------------- | ---------------- | ----------- |
| `packages/core/**`    | 60%              | Yes         |
| `packages/youtube/**` | 60%              | Yes         |

- PRs that fall below coverage thresholds will fail in CI
- Thresholds will be raised incrementally (initial settings are conservative)
- Do not write meaningless tests just for coverage. Reach coverage naturally through tests that verify behavior

## Document List

- [unit-testing.md](./unit-testing.md)
- [integration-testing.md](./integration-testing.md)
