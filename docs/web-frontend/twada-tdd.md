# t_wada-Style TDD Strategy

This document defines the minimal rules for practicing t_wada-based TDD in this template.

## Purpose

- Grow code that is resilient to change through small steps
- Add a regression-prevention test first when fixing bugs
- Extract design decisions at test creation time, not after implementation

## Core Principles

- Run Red-Green-Refactor in short cycles
- Verify only one behavior per test
- Create a test list first and fix the implementation order
- In Green, add only the minimal implementation; defer generalization
- Refactor only when tests are passing

## Implementation Patterns

### Start with a Fake Implementation

- Achieve Green first with a fake implementation such as returning a constant
- Confirm the breakage by adding the next case, then evolve the implementation

### Triangulate to Generalize

- Converge toward an implementation that passes two or more concrete examples
- Avoid abstracting too early

### Choose the Obvious Implementation

- Write the real implementation directly when it is sufficiently obvious
- However, never break test-first discipline

## Application Order in This Template

1. Domain models
2. Use cases
3. Hono endpoints
4. Important frontend use cases

Use the table-driven tests from `docs/web-frontend/unit-testing.md` as the base format.

## How to Proceed Through One Story

1. Pick the next item from the test list
2. Write a failing test (Red)
3. Make it pass with the minimal implementation (Green)
4. Remove duplication and improve naming (Refactor)
5. If needed, add the next case and triangulate

## Bug Fix Flow

1. Add a failing test that reproduces the bug first
2. Apply the minimal fix to make only that test pass
3. Add neighboring cases to reduce regression risk

## Operational Checklist

- Are test names written as readable specification sentences?
- Is test data duplication organized with `it.each`?
- Are external dependencies mocked at the boundary, while domain logic is verified with real objects?
- Does refactoring preserve existing behavior?

## References

- https://speakerdeck.com/twada/growing-reliable-code-php-conference-fukuoka-2025
