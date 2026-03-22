# unified-live SDK

## Guiding Principles

- Error handling: Thrown exceptions (`UnifiedLiveError` hierarchy). No Result types.
- Type definitions: Plain TypeScript types (no runtime schema library). No explicit interfaces.
- Simplicity: Remove unnecessary code, only abstract when duplicated 3+ times, no premature optimization.
- Architecture: discordeno pattern (factory functions, overridable function objects). No class inheritance hierarchies.
- Function documentation: Write JSDoc with preconditions, postconditions, and idempotency for public functions.
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
  - `CLAUDE.md`
  - Relevant documents under `docs/`
- If no rule source can be cited, separate it as a "suggestion" and do not assert it as a violation.

## Reference Documents

- `docs/reference/` - Glossary, decisions, overview
- `docs/plan/unified-live-sdk/` - Feature specifications
- `docs/backend/` - SDK architecture reference
- `docs/testing/` - Testing guidelines
- `docs/security/` - Security
- `.agent/skills/` - AI agent skill definitions
