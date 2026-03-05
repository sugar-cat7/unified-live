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

- `docs/reference/` - SDK reference (overview, glossary, decisions)
- `docs/plan/` - Feature specifications (Spec-Driven Development, per-feature specs and checklists)
- `docs/testing/` - Testing strategy (Unit/Integration)
- `docs/backend/` - SDK architecture, function documentation conventions, PR guidelines, datetime handling
- `docs/infra/` - Infrastructure (CI/CD)
- `docs/security/` - Security (lint, scanning)
