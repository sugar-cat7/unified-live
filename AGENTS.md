# unified-live SDK

## Guiding Principles

- Error handling: Public API uses thrown exceptions (`UnifiedLiveError` hierarchy). Internal logic may use `Result<V, E>` / `Ok` / `Err` / `wrap` / `unwrap` for readability, but Result must never appear in public return types.
- Type definitions: Zod Schema First (`z.infer<typeof schema>`). No explicit interfaces.
- Simplicity: Remove unnecessary code, only abstract when duplicated 3+ times, no premature optimization.
- Architecture: discordeno pattern (factory functions, overridable function objects). No class inheritance hierarchies.
- Function style: All functions use arrow function syntax (`const fn = () => {}`). No `function` declarations (avoid hoisting). Exception: TypeScript overload signatures require `function` (e.g., `Ok` in `result.ts`).
- Function documentation: Write JSDoc with preconditions, postconditions, and idempotency for public functions.
- Test files: Colocate with source (`foo.test.ts` next to `foo.ts`). No `__tests__/` folders. Use table-driven tests (`it.each`) as the default pattern.
- Run `./scripts/post-edit-check.sh` after code changes.

## References

- Detailed technical documentation: `docs/`
- Architecture reference: `docs/backend/sdk-architecture.md`
- Glossary & decisions: `docs/reference/`
- Type definitions: `docs/plan/unified-live-sdk/01_TYPES.md`
- Platform plugins: `docs/plan/unified-live-sdk/02_PLUGINS.md`
- Public API: `docs/plan/unified-live-sdk/03_CLIENT_API.md`
- AI agent skills: `.agent/skills/`

## Spec-Driven Development

- Feature development follows: spec drafting -> checklist generation -> phased implementation.
- Spec documents are placed in `docs/plan/<feature>/`.
- **Spec update -> Implementation**: When specs change, update `docs/plan/` first, then modify code. Verbal agreements are not specs.
- Implementation order is bottom-up: Types -> Infrastructure -> Plugins -> Client API.
- Skills: `/plan-feature` (spec drafting), `/init-impl` (checklist generation).

## Releasing

- All 4 packages use **fixed (lockstep) versioning** via `@changesets/cli`.
- Run `pnpm changeset` for user-facing changes in PRs. Not needed for CI/test/tooling-only changes.
- On merge to `main`, `changesets/action` creates a "Version Packages" PR (CHANGELOG + version bump only).
- Publishing is triggered by pushing a git tag (`v*`), which runs `publish.yaml` via OIDC Trusted Publishing.
- Release config: `.changeset/config.json`

## Claude Code Operations

- Permission policies and hooks are managed in `.claude/settings.json`.
- Custom `/` skills are placed in `.claude/skills/` (which points to `.agent/skills/`).
- `PreToolUse` hook blocks dangerous Bash operations (`git push`, `git add -A`, `git reset --hard`).
- On code edits, a hook sets `.claude/.post_edit_check_pending`, and `./scripts/post-edit-check.sh` runs at the end of the response.
