---
name: Feature Specification Planning
description: Generate structured specification documents in docs/plan/<feature>/ from ambiguous requirements.
user_invocable: true
---

# Overview

A skill for planning feature development specifications.
It gathers ambiguous requirements through a hearing process and generates specification documents aligned with SDK layers in `docs/plan/<feature>/`.

# Execution Steps

## Step 1: Requirements Hearing

Confirm the following items in a single question.

1. Feature name (English kebab-case: e.g. `user-profile`)
2. Purpose and background of the feature (why are we building this)
3. Target users and usage scenarios
4. In Scope / Out of Scope
5. Affected types (new or modifications to existing)
6. Key public API methods (1-5)
7. Platform plugin changes (if any)
8. Infrastructure changes (RestManager, rate limiting, auth, OTel)
9. Undecided items

## Step 2: Specification Document Generation

Based on the answers, create the following files in `docs/plan/<feature>/`.
Refer to `docs/plan/README.md` for the specification file overview of items to include in each file.

- `00_OVERVIEW.md` - Feature overview, purpose, scope
- `01_TYPES.md` - Type definitions, Zod schemas
- `02_PLUGINS.md` - Platform plugin specifications
- `03_CLIENT_API.md` - Public API surface
- `04_INFRASTRUCTURE.md` - RestManager, rate limiting, auth, OTel
- `05_PACKAGE_STRUCTURE.md` - Monorepo layout, build, packaging

For features that only affect some layers, files for unnecessary layers may be omitted.
Mark undecided sections as `TBD`.

## Step 3: Specification Review Summary

After generation, present the following.

1. List of generated files
2. Summary of confirmed items
3. Undecided items and issues to resolve next
4. Guidance on reflecting changes to `docs/reference/` if needed

# Rules

- Specifications are consolidated in `docs/plan/<feature>/` (do not scatter them elsewhere)
- Type definitions follow Zod Schema First
- Important decisions should also be noted for transfer to `docs/reference/decisions.md`

# Reference Documents

- `docs/plan/README.md`
- `docs/reference/README.md`
- `docs/backend/sdk-architecture.md`
