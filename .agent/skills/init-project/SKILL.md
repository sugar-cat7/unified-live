---
name: Project Initialization
description: Bootstrap a new SDK project. Define reference documentation through an interactive hearing and write to docs/reference/.
user_invocable: true
---

# Overview

A skill for initializing the SDK repository as a new project.
If `/domain-spec-kickoff` is available, prefer that skill. In unsupported environments, use this skill to perform equivalent initialization.

# Execution Steps

## Step 1: Hearing

Confirm the following items all at once.

1. Project name (display name / identifier)
2. Project overview (what are we building)
3. Target users
4. Key types (3-5)
5. Supported platforms
6. Glossary (SDK terminology)
7. In Scope / Out of Scope
8. Undecided items and decision deadlines

## Step 2: Reference Document Generation

Based on the answers, update the following.

- `docs/reference/overview.md`
- `docs/reference/glossary.md`
- `docs/reference/decisions.md`

## Step 3: Replacement Guide Output

Provide guidance on targets for replacing `@unified-live` with the project identifier.

- `package.json` (root + packages/\*)
- `pnpm-workspace.yaml`

# Reference Documents

- `docs/reference/README.md`
- `docs/backend/sdk-architecture.md`
