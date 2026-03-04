---
name: Domain Specification Kickoff
description: Initialize docs/domain through a single hearing session, organizing the MVP and undecided items.
user_invocable: true
---

# Overview

A skill used when starting a template repository as a new project.
It initializes `docs/domain/` with project-specific content through a single hearing session.

# Execution Steps

## Step 1: Batch Hearing

Confirm the following items in a single question.

1. Project name (display name / identifier)
2. Problem to solve and value proposition
3. Target users
4. In Scope / Out of Scope
5. Key entities (3-5)
6. MVP use cases (3-5)
7. Glossary (ubiquitous language)
8. Undecided items and decision deadlines

## Step 2: Initialize docs/domain

Based on the answers, update the following.

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

Do not leave undecided items as just `TBD`; record them as discussion points in `usecases.md` or `decisions.md`.

## Step 3: Pre-Implementation Check

After the update, clarify and present the following.

1. Scope to implement in MVP
2. Scope to defer
3. Issues to decide next (with deadlines)

# Reference Documents

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
