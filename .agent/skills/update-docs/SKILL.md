---
name: Documentation Update
description: Update docs/ in response to code changes. Keep docs/ always up to date.
---

# Trigger Conditions

- After implementing a new feature or making architectural changes
- After modifying existing specifications or conventions
- When the user requests a docs update

# Rules

- `docs/` is the Single Source of Truth for all technical documentation
- Always update related docs/ files when code changes are made
- When introducing new concepts or patterns, create the corresponding docs/ file
- SKILL.md files in skills should only be pointers to docs/. Do not write details in skills

# docs Structure

- `docs/domain/` - Domain specifications (overview, entities, use cases, glossary)
- `docs/plan/` - Feature specifications (Spec-Driven Development, per-feature specs and checklists)
- `docs/testing/` - Testing strategy (Unit/Integration/API/UI/VRT/E2E)
- `docs/web-frontend/` - Frontend (architecture, hooks, CSS, a11y, testing, error handling, TypeScript)
- `docs/backend/` - Backend (server architecture, domain modeling, API design, UseCase implementation rules, function documentation conventions, PR guidelines, date/time handling)
- `docs/design/` - Design system (tokens, colors, typography, UI patterns, principles, a11y)
- `docs/security/` - Security (lint, scanning)
