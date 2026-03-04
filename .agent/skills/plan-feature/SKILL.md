---
name: Feature Specification Planning
description: Generate structured specification documents in docs/plan/<feature>/ from ambiguous requirements.
user_invocable: true
---

# Overview

A skill for planning feature development specifications.
It gathers ambiguous requirements through a hearing process and generates specification documents aligned with Clean Architecture layers in `docs/plan/<feature>/`.

# Execution Steps

## Step 1: Requirements Hearing

Confirm the following items in a single question.

1. Feature name (English kebab-case: e.g. `user-profile`)
2. Purpose and background of the feature (why are we building this)
3. Target users and usage scenarios
4. In Scope / Out of Scope
5. Affected entities (new or modifications to existing)
6. Key use cases (1-5)
7. API endpoints (expected)
8. Frontend screen structure (expected)
9. Undecided items

## Step 2: Specification Document Generation

Based on the answers, create the following files in `docs/plan/<feature>/`.
Refer to `docs/plan/README.md` for the specification file overview of items to include in each file.

- `00_OVERVIEW.md` - Feature overview, purpose, scope
- `01_DOMAIN_MODEL.md` - Entity changes, business rules
- `02_DATA_ACCESS.md` - Repository and DB changes
- `03_USECASE.md` - UseCase layer changes
- `04_API_INTERFACE.md` - API endpoint specifications
- `05_FRONTEND.md` - Frontend UI specifications

For backend-only or frontend-only features, files for unnecessary layers may be omitted.
Mark undecided sections as `TBD`.

## Step 3: Specification Review Summary

After generation, present the following.

1. List of generated files
2. Summary of confirmed items
3. Undecided items and issues to resolve next
4. Guidance on reflecting changes to `docs/domain/` if needed

# Rules

- Specifications are consolidated in `docs/plan/<feature>/` (do not scatter them elsewhere)
- Entity definitions follow Zod Schema First (per `docs/backend/domain-modeling.md`)
- Important decisions should also be noted for transfer to `docs/domain/decisions.md`

# Reference Documents

- `docs/plan/README.md`
- `docs/domain/README.md`
- `docs/backend/server-architecture.md`
- `docs/backend/domain-modeling.md`
- `docs/backend/api-design.md`
- `docs/web-frontend/architecture.md`
