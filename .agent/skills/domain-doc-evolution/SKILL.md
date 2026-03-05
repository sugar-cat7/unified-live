---
name: Reference Documentation Evolution
description: Update docs/reference in response to feature additions or specification changes, maintaining a history of specification decisions.
user_invocable: true
---

# Overview

A skill for continuously evolving SDK reference documentation during implementation.
It keeps `docs/reference` consistent with code changes.

# Execution Steps

## Step 1: Identify Changes

- Identify the target feature and scope of impact (types / plugins / glossary terms)
- Verify there are no contradictions with existing `docs/reference/*.md`

## Step 2: Update docs/reference

Update only the necessary files with minimal diffs.

- `overview.md`: Update only if the purpose or scope changes
- `glossary.md`: Add new terms, consolidate synonyms
- `decisions.md`: Append architecture decisions

## Step 3: Record Decision Rationale

When an architecture decision is made, always record the following in `decisions.md`.

1. Decision
2. Rationale
3. Alternatives considered
4. Scope of impact

# Reference Documents

- `docs/reference/README.md`
- `docs/backend/sdk-architecture.md`
