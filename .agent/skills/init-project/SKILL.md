---
name: Project Initialization
description: Bootstrap a new project from the template. Define domain specifications through an interactive hearing and write them to docs/domain/.
user_invocable: true
---

# Overview

A skill for initializing the template repository as a new project.
If `/domain-spec-kickoff` is available, prefer that skill. In unsupported environments, use this skill to perform equivalent initialization.

# Execution Steps

## Step 1: Hearing

Confirm the following items all at once.

1. Project name (display name / identifier)
2. Project overview (what are we building)
3. Target users
4. Key entities (3-5)
5. MVP use cases (3-5)
6. Glossary (ubiquitous language)
7. In Scope / Out of Scope
8. Undecided items and decision deadlines

## Step 2: Domain Document Generation

Based on the answers, update the following.

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

## Step 3: Replacement Guide Output

Provide guidance on targets for replacing `@my-app` with the project identifier.

- `package.json` (root + packages/* + services/*)
- `infrastructure/terraform/`
- `renovate.json` / `renovate/default.json`
- `compose.test.yaml`
- `.github/workflows/`

# Reference Documents

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
