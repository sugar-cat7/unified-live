# Translate All Japanese Content to English

## Context

The project is named `tempalte-services-en` and is intended as an English-language template. However, all documentation (`docs/`), agent skills (`.agent/skills/`), instruction files (`AGENTS.md`, `README.md`), and GitHub config (`.github/`) are written in Japanese. This task translates everything to English so the template is usable by English-speaking teams.

## Scope

**~86 files** across 5 categories:

| Category | Files | Key paths |
|---|---|---|
| Project instructions | 4 | `AGENTS.md`, `README.md`, `.github/copilot-instructions.md`, `.github/pull_request_template.md` |
| Agent skills | 26 | `.agent/skills/*/SKILL.md` |
| Documentation | ~50 | `docs/backend/`, `docs/design/`, `docs/domain/`, `docs/plan/`, `docs/security/`, `docs/testing/`, `docs/web-frontend/` |
| Service/Package READMEs | 4 | `services/web/README.md`, `services/api/README.md`, `services/api/local/db/README.md`, `packages/dayjs/README.md` |
| Config | 1 | `.textlintrc.json` (remove Japanese-only preset) |

**Symlinks (no direct edit needed):**
- `CLAUDE.md` -> `AGENTS.md` (auto-reflects)
- `.codex/AGENTS.md` -> `../AGENTS.md` (auto-reflects)
- `.codex/skills` -> `../.agent/skills` (auto-reflects)

## Approach

Translate files in batches grouped by directory. For each file: read the full content, translate all Japanese text to English while preserving code blocks, file paths, markdown structure, and YAML frontmatter format, then write the complete replacement.

### Phase 1: Project-Level Files

Translate the foundation files first to establish consistent English terminology.

1. `AGENTS.md` (CLAUDE.md will auto-update via symlink)
2. `README.md`
3. `.github/copilot-instructions.md`
4. `.github/pull_request_template.md`

### Phase 2: Agent Skills (26 files)

Translate all `.agent/skills/*/SKILL.md` files. Each has YAML frontmatter (`name`, `description`) and markdown body with sections like execution steps, rules, and references.

Batch by topic for terminology consistency:
- **Workflow skills** (7): plan-feature, init-impl, init-project, domain-spec-kickoff, domain-doc-evolution, update-docs, research
- **Testing skills** (7): testing, unit-testing, integration-testing, api-testing, ui-testing, vrt-testing, e2e-testing
- **Backend/architecture skills** (6): backend-development, code-review, error-handling, sql-antipatterns, typescript-conventions, twada-tdd
- **Frontend/design skills** (3): frontend-development, design-system, quality-check

### Phase 3: Documentation (docs/)

Translate all markdown files by directory:
- `docs/backend/` (8 files)
- `docs/web-frontend/` (10 files)
- `docs/design/` (13 files)
- `docs/domain/` (5 files)
- `docs/testing/` (7 files)
- `docs/plan/` (1 file - `README.md`)
- `docs/security/` (2 files)

### Phase 4: Service/Package READMEs

- `services/web/README.md`
- `services/api/README.md`
- `services/api/local/db/README.md`
- `packages/dayjs/README.md`

### Phase 5: Config Cleanup

Update `.textlintrc.json`: remove `preset-ja-technical-writing` rules (all Japanese-specific). Replace with a minimal English-compatible config or empty rules.

## Translation Rules

- Preserve all code blocks, variable names, file paths, and technical identifiers exactly
- Translate Japanese comments inside code blocks
- Preserve markdown heading levels, link targets, and table structure
- Translate YAML frontmatter values (`name:`, `description:`) but keep keys unchanged
- Keep `TBD` placeholders as-is
- Sections already in English should be left unchanged
- ASCII art diagrams: translate Japanese labels while maintaining alignment

## Current Status (resumed session)

Phases 1-5 are largely complete. ~86 markdown files translated. Remaining items:

### Completed

1. ~~Commit all translated files~~ - Done (commit `8c76f76`)
2. ~~Translate `docs/web-frontend/api-testing.md`~~ - Done (commit `4bc9b6e`)
3. ~~Translate source code comments/strings~~ - Done (commit `4bc9b6e`, 42 files)
4. ~~Translate GitHub workflow files~~ - Done (security-scan.yaml, create-release-pr.yml)

### Remaining Work (Phase 6: Missed files)

Translate ~48 Japanese comments across 7 files missed in earlier passes:

1. `services/api/Dockerfile` - 17 comments (build stage descriptions)
2. `services/web/app/globals.css` - 23 comments (color names, utility descriptions)
3. `services/web/vrt/Dockerfile` - 2 comments
4. `services/web/vrt/docker-entrypoint.sh` - 3 comments
5. ~~`infrastructure/terraform/modules/terraform_backend/terraform.tf`~~ - removed
6. ~~`infrastructure/terraform/modules/terraform_backend/state_bucket.tf`~~ - removed
7. ~~`infrastructure/terraform/modules/terraform_backend/github_oidc.tf`~~ - removed

After translation: commit, then final grep verification.

### Files to skip (acceptable Japanese)
- `services/api/pkg/textNormalizer.test.ts` - Japanese test fixture data
- `services/api/pkg/textNormalizer.ts` - Regex character ranges for Japanese
- `services/web/shared/lib/escapeRegExp.test.ts` - Japanese test input
- `packages/dayjs/schema.ts` - Language name labels in native script
- `packages/dayjs/dayjs.test.ts` - Japanese locale date assertions
- `docs/backend/datetime-handling.md` line 86 - Japanese date format output example

## Verification

1. Run `./scripts/post-edit-check.sh` after completion
2. Grep for remaining Japanese characters: `grep -rP '[\x{3000}-\x{9FFF}]' docs/ .agent/ AGENTS.md README.md .github/`
3. Verify symlinks still work: `cat CLAUDE.md` should show English content
4. Spot-check internal markdown links still resolve (heading anchors change when translated)
