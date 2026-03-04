---
name: e2e-testing
description: Used to build E2E tests with Playwright, ensuring major user flows through production-equivalent paths. Avoids internal mocks and limits to minimal mocks only at external boundaries.
---

# Trigger Conditions

- When you want to guarantee regression coverage for major user flows
- When adding scenarios that span screens/API/authentication before a release

# Execution Checklist

1. Review `docs/testing/e2e-testing.md`
2. Split cases by business scenario
3. Reuse authentication state via `storageState`
4. Stabilize only external dependencies using `page.route()`

# Reference Documents

- `docs/testing/e2e-testing.md`
- `docs/web-frontend/twada-tdd.md`
