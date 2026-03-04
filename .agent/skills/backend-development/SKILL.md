---
name: Backend Development
description: Backend development with Hono API + Clean Architecture + DDD. Factory pattern DI, companion object pattern.
---

# Trigger Conditions

- When creating or editing files under `services/api/`
- When creating new domain models, use cases, or repositories
- When adding or modifying API endpoints

# Execution Checklist

1. Verify that the UseCase follows top-to-bottom sequential execution
2. Verify there are no UseCase-to-UseCase calls
3. Write JSDoc (preconditions and postconditions) for public functions in Domain/UseCase
4. Define new domain models using Zod Schema + companion object pattern
5. Return errors using the Result type (try-catch is prohibited)
6. Create repositories using the `from({ tx })` pattern

# Reference Documents

- `docs/backend/server-architecture.md` - Clean Architecture + DDD (Domain/UseCase/Infra layers)
- `docs/backend/usecase-rules.md` - UseCase implementation rules (sequential execution, prohibited patterns, idempotency)
- `docs/backend/domain-modeling.md` - Domain model design (aggregates, Zod Schema First, companion objects)
- `docs/backend/function-documentation.md` - Function documentation conventions (JSDoc, preconditions and postconditions)
- `docs/backend/api-design.md` - REST API design principles (resource-oriented URLs, CRUD naming conventions)
- `docs/backend/pr-guidelines.md` - PR guidelines (mandatory description of current state, problem, and implementation details)
- `docs/backend/datetime-handling.md` - UTC/JST datetime handling
