# unified-live SDK

## Guiding Principles

- Error handling: Public API uses thrown exceptions (`UnifiedLiveError` hierarchy). Internal logic may use `Result<V, E>` / `Ok` / `Err` / `wrap` / `unwrap` for readability, but Result must never appear in public return types.
- Type definitions: Plain TypeScript types (no runtime schema library). No explicit interfaces.
- Simplicity: Remove unnecessary code, only abstract when duplicated 3+ times, no premature optimization.
- Architecture: discordeno pattern (factory functions, overridable function objects). No class inheritance hierarchies.
- Function style: All functions use arrow function syntax (`const fn = () => {}`). No `function` declarations (avoid hoisting). Exception: TypeScript overload signatures require `function` (e.g., `Ok` in `result.ts`).
- Function documentation: Write JSDoc with preconditions, postconditions, and idempotency for public functions.
- Test files: Colocate with source (`foo.test.ts` next to `foo.ts`). No `__tests__/` folders. Use table-driven tests (`it.each`) as the default pattern.
- Run `./scripts/post-edit-check.sh` after code changes.

## References

- User-facing documentation: `apps/docs/src/content/docs/`
- AI agent skills (maintainer-internal, currently empty): `.agent/skills/`
- User-facing Claude Code plugin: `.claude-plugin/marketplace.json` + `plugins/unified-live/`

## Development

- Implementation order is bottom-up: Types -> Infrastructure -> Plugins -> Client API.
- Feature planning: write specs under `docs/plan/<feature>.md` by hand.

## Releasing

- All 4 packages use **fixed (lockstep) versioning** via `@changesets/cli`.
- Run `pnpm changeset` for user-facing changes in PRs. Not needed for CI/test/tooling-only changes.
- On merge to `main`, `changesets/action` creates a "Version Packages" PR (CHANGELOG + version bump only).
- Merging the Version Packages PR auto-creates a git tag (`v*`), which triggers `publish.yaml` via OIDC Trusted Publishing.
- Release config: `.changeset/config.json`

## Claude Code Operations

- Permission policies and hooks are managed in `.claude/settings.json`.
- Maintainer-side Claude Code skills belong in `.agent/skills/` (exposed via the `.claude/skills/` symlink). This directory is currently empty.
- User-facing plugin skills (distributed via `/plugin marketplace add sugar-cat7/unified-live`) live in `plugins/unified-live/skills/`; the marketplace manifest is at `.claude-plugin/marketplace.json`.
- `PreToolUse` hook blocks dangerous Bash operations (`git push`, `git add -A`, `git reset --hard`).
- On code edits, a hook sets `.claude/.post_edit_check_pending`, and `./scripts/post-edit-check.sh` runs at the end of the response.
