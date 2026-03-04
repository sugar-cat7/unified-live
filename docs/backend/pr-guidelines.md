# PR Guidelines

## Overview

These are the conventions for maintaining consistent quality of Pull Requests.
By including the necessary information in the PR description, we aim to improve review efficiency and clarify the intent of changes.

## Required Sections in PR Description

The PR Description must include the following 3 sections.

### 1. Current State

Briefly describe the state before the change.

### 2. Problem

Describe the problem that will occur if the change is not made.
Clarify "why this change is necessary."

### 3. Implementation

Describe what was changed and how.
List the technical changes as bullet points.

## One PR, One Concern

Each PR should contain only one concern.

```
# Good: One concern
- PR: "Add item creation API"
  - domain/item.ts, usecase/item.ts, repository/item.ts, http/item.ts

# Bad: Multiple concerns mixed together
- PR: "Add item creation API + refactoring + test fixes"
```

Mixing multiple changes causes the following problems.

- Increased review burden
- Difficulty identifying the cause when bugs occur
- Difficulty reverting changes

## Impact Scope

If the change affects other modules or features, document the scope of impact.

## PR Template

Use the template defined in `.github/pull_request_template.md` (GitHub automatically applies it when creating a PR).

## Related Documents

- [Server Architecture](./server-architecture.md) - Overall architecture
- [UseCase Implementation Rules](./usecase-rules.md) - UseCase implementation conventions
- [Code Review Skill](../../.agent/skills/code-review/SKILL.md) - Run with `/code-review`
