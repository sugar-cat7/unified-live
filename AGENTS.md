# Full-stack Template (Next.js 16 + Hono API)

## Guiding Principles

- Error handling: Use `Result` types (`import { wrap, Ok, Err, AppError } from "@my-app/errors"`). No try-catch.
- Type definitions: Zod Schema First (`z.infer<typeof schema>`). No explicit interfaces.
- Simplicity: Remove unnecessary code, only abstract when duplicated 3+ times, no premature optimization.
- UseCase implementation: Sequential top-to-bottom execution. No UseCase-to-UseCase calls, no direct env variable access.
- Function documentation: Write JSDoc with preconditions, postconditions, and idempotency for public Domain/UseCase functions.
- Run `./scripts/post-edit-check.sh` after code changes.

## References

- Detailed technical documentation: `docs/`
- AI agent skills: `.agent/skills/`

## Spec-Driven Development

- Feature development follows: spec drafting -> checklist generation -> phased implementation.
- Spec documents are placed in `docs/plan/<feature>/`.
- **Spec update -> Implementation**: When specs change, update `docs/plan/` first, then modify code. Verbal agreements are not specs.
- Implementation order is bottom-up: Domain -> Data Access -> UseCase -> API -> Frontend.
- Skills: `/plan-feature` (spec drafting), `/init-impl` (checklist generation).

## Claude Code Operations

- Permission policies and hooks are managed in `.claude/settings.json`.
- Custom `/` skills are placed in `.claude/skills/` (which points to `.agent/skills/`).
- `PreToolUse` hook blocks dangerous Bash operations (`git push`, `git add -A`, `git reset --hard`).
- On code edits, a hook sets `.claude/.post_edit_check_pending`, and `./scripts/post-edit-check.sh` runs at the end of the response.
