# Full-stack Template (Next.js 16 + Hono API)

## Guiding Principles

- Error handling: Use `Result` types (`import { wrap, Ok, Err, AppError } from "@my-app/errors"`). No try-catch.
- Type definitions: Zod Schema First (`z.infer<typeof schema>`). No explicit interfaces.
- Simplicity: Remove unnecessary code, only abstract when duplicated 3+ times, no premature optimization.
- UseCase implementation: Sequential top-to-bottom execution. No UseCase-to-UseCase calls, no direct env variable access.
- Function documentation: Write JSDoc with preconditions, postconditions, and idempotency for public Domain/UseCase functions.
- Run `./scripts/post-edit-check.sh` after code changes.

## Copilot Review Output Rules

- Every issue must clearly state "what rule in which document is violated."
- Issues must follow this format:
  - `Violation location`: `path/to/file:line` (location in the PR diff)
  - `Violated rule`: `rule source file` + `heading/item name`
  - `Violation details`: One sentence specifically describing what violates the rule
  - `Fix suggestion`: Minimal change to resolve the issue
- `Violated rule` must reference only the following primary sources:
  - `.github/copilot-instructions.md`
  - `AGENTS.md`
  - Relevant documents under `docs/`
- If no rule source can be cited, separate it as a "suggestion" and do not assert it as a violation.

## Reference Documents

- `docs/domain/` - Domain specs (overview, entities, use cases, glossary)
- `docs/web-frontend/` - Frontend (architecture, hooks, CSS, a11y, testing, error handling, TypeScript)
- `docs/backend/` - Backend (server architecture, domain model, API design, UseCase rules, function documentation conventions, PR guidelines, datetime handling)
- `docs/design/` - Design system (tokens, colors, typography, UI patterns)
- `docs/infra/` - Infrastructure (Terraform, CI/CD)
- `docs/security/` - Security
- `.agent/skills/` - AI agent skill definitions
