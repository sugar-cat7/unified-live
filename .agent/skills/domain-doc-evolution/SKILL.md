---
name: Domain Specification Evolution
description: Update docs/domain in response to feature additions or specification changes, maintaining a history of specification decisions.
user_invocable: true
---

# Overview

A skill for continuously evolving domain specifications during implementation.
It keeps `docs/domain` consistent with code changes.

# Execution Steps

## Step 1: Identify Changes

- Identify the target feature and scope of impact (entities / use cases / terms)
- Verify there are no contradictions with existing `docs/domain/*.md`

## Step 2: Update docs/domain

Update only the necessary files with minimal diffs.

- `overview.md`: Update only if the purpose or scope changes
- `entities.md`: Reflect changes to attributes, rules, and relationships
- `usecases.md`: Add/modify use cases, update priorities
- `glossary.md`: Add new terms, consolidate synonyms
- `decisions.md`: Append specification decisions

## Step 3: Record Decision Rationale

When a specification decision is made, always record the following in `decisions.md`.

1. Decision
2. Rationale
3. Alternatives considered
4. Scope of impact

# Reference Documents

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
