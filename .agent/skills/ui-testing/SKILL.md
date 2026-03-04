---
name: ui-testing
description: Used to implement UI tests with Testing Library priority queries and table-driven approach, verifying from the user's perspective with minimal mocks.
---

# Trigger Conditions

- When adding behavior tests for React components/screens
- When you want to verify UI from the user's perspective rather than implementation details

# Execution Checklist

1. Review `docs/testing/ui-testing.md`
2. Retrieve elements with `getByRole` as the preferred query
3. Enumerate state/props variations using `it.each`
4. Fix only network boundaries with the bare minimum

# Reference Documents

- `docs/testing/ui-testing.md`
- `docs/web-frontend/twada-tdd.md`
