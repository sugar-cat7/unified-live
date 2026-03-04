---
name: Code Review
description: PR/code review based on architecture rules. Detects violations of UseCase implementation rules, Result type, and JSDoc conventions.
user_invocable: true
---

# Trigger Conditions

- When a user requests a code review
- When reviewing PR diffs

# Review Checklist

## Architecture Violations

1. Is a UseCase calling another UseCase?
2. Is a UseCase directly accessing environment variables?
3. Is a UseCase directly operating PubSub/message queues?
4. Does the UseCase follow "top-to-bottom sequential execution"?
5. Are there multiple conditional branches inside a loop?

## Code Conventions

6. Is try-catch being used? (Result type is mandatory)
7. Are interfaces being defined directly? (Zod Schema First is required)
8. Do public functions in Domain/UseCase have JSDoc (preconditions and postconditions)?
9. Do UseCase functions document idempotency (`@idempotent`)?

## Testing

10. Are tests included for additions or changes to Domain functions?

# Output Format

Output each finding in the following format:

- `Violation Location`: File path + line number
- `Violated Rule`: Corresponding document in docs/ + section name
- `Violation Details`: Describe specifically in one sentence
- `Suggested Fix`: Fix approach with minimal changes

If you cannot cite a rule source, separate it as an "Improvement Suggestion" and do not assert it as a violation.

# Reference Documents

- `docs/backend/usecase-rules.md` - UseCase implementation rules
- `docs/backend/function-documentation.md` - Function documentation conventions
- `docs/backend/server-architecture.md` - Overall architecture
- `docs/backend/domain-modeling.md` - Domain model design
- `docs/backend/pr-guidelines.md` - PR guidelines
- `docs/security/lint.md` - Lint / Quality Check
