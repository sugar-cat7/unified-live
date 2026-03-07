---
name: unit-testing
description: Used to implement unit tests with Vitest table-driven approach, verifying domain/utility behavior with minimal mocks.
---

# Trigger Conditions

- When adding or updating unit tests in `*.test.ts`
- When implementing domain models or pure functions with TDD

# Execution Checklist

1. Review `docs/testing/unit-testing.md`
2. Write a failing test (Red) for one behavior first
3. Expand cases using `it.each` / `test.each`
4. Re-run all cases after refactoring

# Reference Documents

- `docs/testing/unit-testing.md`
