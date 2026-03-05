---
name: SDK Reference Kickoff
description: Initialize docs/reference through a single hearing session, organizing the MVP and undecided items.
user_invocable: true
---

# Overview

A skill used when starting a new SDK project.
It initializes `docs/reference/` with project-specific content through a single hearing session.

# Execution Steps

## Step 1: Batch Hearing

Confirm the following items in a single question.

1. Project name (display name / identifier)
2. Problem to solve and value proposition
3. Target users
4. In Scope / Out of Scope
5. Key types (3-5)
6. Supported platforms
7. Glossary (SDK terminology)
8. Undecided items and decision deadlines

## Step 2: Initialize docs/reference

Based on the answers, update the following.

- `docs/reference/overview.md`
- `docs/reference/glossary.md`
- `docs/reference/decisions.md`

Do not leave undecided items as just `TBD`; record them as discussion points in `decisions.md`.

## Step 3: Pre-Implementation Check

After the update, clarify and present the following.

1. Scope to implement in MVP
2. Scope to defer
3. Issues to decide next (with deadlines)

# Reference Documents

- `docs/reference/README.md`
- `docs/backend/sdk-architecture.md`
