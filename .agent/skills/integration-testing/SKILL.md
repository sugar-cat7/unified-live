---
name: integration-testing
description: Used to build integration tests with a real DB and real app wiring, verifying without mocking internals and applying minimal mocks only at external boundaries.
---

# Trigger Conditions

- When verifying the collaboration between UseCases and Repositories
- When adding or updating integration tests that involve a DB

# Execution Checklist

1. Review `docs/testing/integration-testing.md`
2. Define scenarios as tables assuming a real DB
3. Replace only external dependencies at the boundary
4. Verify reproducibility with `test:integration`

# Reference Documents

- `docs/testing/integration-testing.md`
- `docs/web-frontend/twada-tdd.md`
