# Lint / Quality Check

## Overview

This document defines the minimum set of quality checks performed in this repository.
Run the same steps before a PR for both code and documentation changes.

## Required Checks (Common to All Changes)

After making changes, always run the following command.

```bash
./scripts/post-edit-check.sh
```

`post-edit-check.sh` runs the following in order.

```bash
pnpm build
pnpm lint
pnpm format:check
pnpm knip
pnpm type-check
pnpm test:run
```

## Additional Checks for Documentation Changes

When updating `docs/`, also verify the following.

1. Heading structure (`#` -> `##` -> `###`) is not broken
2. No terminology inconsistencies (use terms from `docs/reference/glossary.md`)
3. Referenced links exist and relative paths are correct

See [docs/security/textlint.md](./textlint.md) for textlint operational guidelines and setup examples.

## Architecture Lint Rules (AI Review Targets)

The following rules cannot be fully detected by automated linting, but are verified during code review.
The `/code-review` skill checks these rules.

| Rule                                                               | Target            | Detection Method |
| ------------------------------------------------------------------ | ----------------- | ---------------- |
| JSDoc (preconditions/postconditions) required for public functions | `packages/*/src/` | AI review        |
| Direct interface definitions prohibited (Zod Schema First)         | Entire codebase   | AI review        |
| Error hierarchy must extend `UnifiedLiveError`                     | `packages/*/src/` | AI review        |

See the following for details.

- [Function Documentation Conventions](../backend/function-documentation.md)
- [SDK Architecture](../backend/sdk-architecture.md)
