# Contributing to unified-live

Thank you for your interest in contributing to unified-live!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/sugar-cat7/unified-live.git
cd unified-live

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test:run
```

### Requirements

- Node.js 18+
- pnpm 10+

## Project Structure

```
packages/
├── core/           # Client, plugin system, types, errors, OTel tracing
├── youtube/        # YouTube Data API v3 plugin
├── twitch/         # Twitch Helix API plugin
└── twitcasting/    # TwitCasting API plugin
apps/
└── docs/           # Documentation site (Astro Starlight)
```

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run quality checks: `./scripts/post-edit-check.sh`
5. Create a changeset if needed: `pnpm changeset`
6. Commit using [Angular commit convention](#commit-messages)
7. Open a pull request

## Creating a Changeset

When your PR includes user-facing changes (new features, bug fixes, breaking changes), create a changeset:

```bash
pnpm changeset
```

Select the change type:

- **patch** — Bug fixes, internal refactors, documentation updates
- **minor** — New features, new exports, new optional parameters
- **major** — Breaking changes (removed exports, renamed types/methods, changed signatures)

Write a concise summary (this appears in CHANGELOG). The changeset file is committed with your PR.

> **Note:** Not every PR needs a changeset. Skip it for CI config, test-only changes, or dev tooling updates.

### How Releases Work

1. PRs with changesets merge to `main`
2. A "Version Packages" PR is automatically created/updated (CHANGELOG + version bump)
3. Merging that PR updates versions in `main` (no publish yet)
4. A maintainer cuts a git tag (`git tag v0.1.0 && git push --tags`) to trigger npm publish and GitHub Release

## Quality Checks

Always run the following before submitting a PR:

```bash
./scripts/post-edit-check.sh
```

This runs:

- `pnpm build` — Build all packages
- `pnpm lint` — Lint with oxlint
- `pnpm knip` — Check for unused exports
- `pnpm type-check` — TypeScript type checking
- `pnpm test:run` — Run all tests

## Commit Messages

Follow the [Angular commit convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format):

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`

**Scope:** Package name (`core`, `youtube`, `twitch`, `twitcasting`, `docs`)

**Examples:**

```
feat(core): add batch content fetching
fix(youtube): handle quota reset timezone
docs: update getting started guide
test(twitch): add URL matching edge cases
```

## Code Style

- **Arrow functions only** — No `function` declarations (avoids hoisting)
- **Zod Schema First** — Types derived from Zod schemas (`z.infer<typeof schema>`)
- **Colocated tests** — `foo.test.ts` next to `foo.ts`, no `__tests__/` folders
- **Table-driven tests** — Use `it.each` as the default test pattern
- **No premature abstraction** — Only abstract when duplicated 3+ times

## Adding a New Platform Plugin

1. Create a new package in `packages/<platform>/`
2. Implement `PluginDefinition` and `PluginMethods`
3. Use `PlatformPlugin.create(definition, methods)` factory
4. Add URL matching patterns
5. Add auth handling (implement `TokenManager` if needed)
6. Add rate limiting strategy
7. Write tests (colocated `.test.ts`)
8. Export factory function: `create<Platform>Plugin(config)`

See existing plugins for reference patterns.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
