---
name: integration-testing
description: Used to build integration tests that verify plugin-core collaboration with minimal mocks only at external boundaries.
---

# Trigger Conditions

- When verifying the collaboration between plugins and core
- When adding or updating integration tests

# Execution Checklist

1. Review `docs/testing/integration-testing.md`
2. Define scenarios as tables
3. Replace only external dependencies at the boundary
4. Verify reproducibility with `pnpm test:run`

# Reference Documents

- `docs/testing/integration-testing.md`
