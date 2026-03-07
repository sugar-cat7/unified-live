---
name: Code Review
description: PR/code review based on SDK architecture rules. Detects violations of Zod Schema First, error hierarchy, and JSDoc conventions.
user_invocable: true
---

# Trigger Conditions

- When a user requests a code review
- When reviewing PR diffs

# Review Checklist

## Architecture Violations

1. Are there direct interface/type definitions? (Zod Schema First is required)
2. Does the error hierarchy extend `UnifiedLiveError`?
3. Are factory functions used instead of class inheritance? (discordeno pattern)
4. Are new abstractions introduced without 3+ duplications?

## Code Conventions

5. Do public functions have JSDoc (preconditions and postconditions)?
6. Are errors thrown as exceptions (not Result types)?
7. Are type definitions derived from Zod schemas using `z.infer<typeof schema>`?

## Testing

8. Are tests included for additions or changes?

# Output Format

Output each finding in the following format:

- `Violation Location`: File path + line number
- `Violated Rule`: Corresponding document in docs/ + section name
- `Violation Details`: Describe specifically in one sentence
- `Suggested Fix`: Fix approach with minimal changes

If you cannot cite a rule source, separate it as an "Improvement Suggestion" and do not assert it as a violation.

# Reference Documents

- `docs/backend/sdk-architecture.md` - SDK architecture (discordeno pattern)
- `docs/backend/function-documentation.md` - Function documentation conventions
- `docs/security/lint.md` - Lint / Quality Check
