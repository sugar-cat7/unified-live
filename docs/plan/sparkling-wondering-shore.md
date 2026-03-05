# Plan: OSS SDK Architecture Alignment

## Context

The unified-live SDK documentation was written using the monorepo template's DDD/Clean Architecture conventions. While the underlying architecture (discordeno-style factory functions, overridable RestManager, multi-package monorepo) is sound, the **terminology and framing** don't match standard OSS TypeScript SDK conventions.

Research into discordeno, Octokit, Stripe SDK, and AWS SDK v3 confirms:
- All use "types" not "entities", "plugins" not "adapters"
- All throw exceptions (none use Result types in public API)
- None use DDD/Clean Architecture language

This plan aligns the docs with OSS SDK conventions. The architecture itself does not change — only terminology, one design decision (D-008), and file structure.

## Changes

### 1. Resolve D-008: Thrown Exceptions (not Result types)

**File**: `docs/domain/decisions.md`

- Change D-008 status from `Proposed (TBD)` to `Accepted`
- Decision: SDK throws `UnifiedLiveError` hierarchy. Does NOT use `@my-app/errors` Result type.
- Rationale: Every major OSS TypeScript SDK throws exceptions. Result types add consumer friction.
- Add D-009: "Remove DDD/Clean Architecture Terminology" decision

### 2. Rename plan spec files

| Old | New |
|---|---|
| `01_DOMAIN_MODEL.md` | `01_TYPES.md` |
| `02_PLATFORM_ADAPTERS.md` | `02_PLUGINS.md` |
| `03_CLIENT_API.md` | unchanged |
| `04_INFRASTRUCTURE.md` | unchanged |
| `05_PACKAGE_STRUCTURE.md` | unchanged |

### 3. Rename `docs/domain/` to `docs/reference/`

"Domain" carries DDD connotations. "Reference" is neutral.

- **Keep**: `overview.md`, `glossary.md`, `decisions.md`, `README.md`
- **Delete**: `entities.md` (content is in `01_TYPES.md`), `usecases.md` (content is in `03_CLIENT_API.md`)

### 4. Terminology replacements across all docs

| Find | Replace |
|---|---|
| "Domain Model" (heading) | "Type Definitions" |
| "Entity" / "Entities" (DDD sense) | "Type" / "Types" |
| "Aggregate Root" / "Aggregate" | remove or "Type" |
| "Value Object" | "Type" |
| "Companion Object" | "Type Guard" |
| "Business Rules" | "Constraints" |
| "Adapter" (platform integration) | "Plugin" |
| "Dependency Rules" | "Package Dependencies" |
| "UseCase" (architectural layer) | "Client Method" / "Public API" |
| Result type / `@my-app/errors` | thrown exceptions |

### 5. File-by-file changes

#### `docs/reference/README.md` (was `docs/domain/README.md`)

Rewrite: Remove DDD language ("Domain Specification", "Ubiquitous Language", entity references). Keep structure table with `overview.md`, `glossary.md`, `decisions.md` only.

#### `docs/reference/overview.md` (was `docs/domain/overview.md`)

- Tech stack: `Error handling: Result type (@my-app/errors)` -> `Error handling: Thrown exceptions (UnifiedLiveError hierarchy)`
- "Platform adapters" -> "Platform plugins"

#### `docs/reference/glossary.md` (was `docs/domain/glossary.md`)

- Header: Remove "Ubiquitous Language" (DDD term)
- PlatformPlugin description: "adapter" -> "plugin"
- Naming rules: "Reflect domain concepts" -> "Use terms from the Glossary consistently"

#### `docs/reference/decisions.md` (was `docs/domain/decisions.md`)

- D-001 impact: "entities" -> "types", "adapters" -> "plugins"
- D-005 impact: "adapters" -> "plugins"
- D-008: Resolve as accepted (thrown exceptions)
- Add D-009: Terminology alignment decision

#### `01_TYPES.md` (was `01_DOMAIN_MODEL.md`)

- Title: "Domain Model" -> "Type Definitions"
- Remove cross-reference to deleted `entities.md`
- "Entity Schemas" -> "Type Schemas"
- "Companion Objects" -> "Type Guards"
- "Adapter Mapping Examples" -> "Plugin Mapping Examples"
- "Business Rules" -> "Constraints"

#### `02_PLUGINS.md` (was `02_PLATFORM_ADAPTERS.md`)

- Title: "Platform Adapters" -> "Platform Plugins"
- Remove "Replaces the standard `02_DATA_ACCESS.md`" line
- Section headers: "YouTube Adapter" -> "YouTube Plugin" (same for Twitch, TwitCasting)
- Table column: "SDK Entity" -> "SDK Type"

#### `03_CLIENT_API.md`

- Remove "Replaces the standard `03_USECASE.md`" line
- Error Handling section: Remove TBD, remove Option B (Result type), keep only thrown exceptions with `try/catch` example
- Reference D-008 in `docs/reference/decisions.md`

#### `04_INFRASTRUCTURE.md`

- Remove "Replaces the standard `04_API_INTERFACE.md`" line

#### `05_PACKAGE_STRUCTURE.md`

- Remove "Replaces the standard `05_FRONTEND.md`" line
- `@my-app/errors` row: "TBD" -> "Remove. SDK uses thrown exceptions (D-008)."
- Testing table: "Domain (types, companions)" -> "Types (schemas, type guards)"

#### `00_OVERVIEW.md`

- Update file references to new names (`01_TYPES.md`, `02_PLUGINS.md`)
- `docs/domain/` -> `docs/reference/`

#### `docs/backend/sdk-architecture.md`

- "Dependency Rules" -> "Package Dependencies"
- "TBD: Result Type vs Thrown Exceptions" -> resolved text
- Testing table: "Domain" -> "Types"
- Reference paths: `docs/domain/` -> `docs/reference/`
- Layer diagram: "Domain Types" -> "Types"

#### `CLAUDE.md`

Rewrite for SDK project:
- Title: "Full-stack Template (Next.js 16 + Hono API)" -> "unified-live SDK"
- Error handling: Result type mandate -> thrown exceptions
- Remove UseCase rules entirely
- Implementation order: "Domain -> Data Access -> UseCase -> API -> Frontend" -> "Types -> Infrastructure -> Plugins -> Client API"
- References: point to SDK docs, not web-app docs

### 6. Delete web-app template files

Files/directories to remove (no longer applicable to SDK-only repo):

- `docs/domain/entities.md` (content in `01_TYPES.md`)
- `docs/domain/usecases.md` (content in `03_CLIENT_API.md`)
- `docs/web-frontend/` (entire directory)
- `docs/design/` (entire directory)
- `docs/backend/server-architecture.md`
- `docs/backend/domain-modeling.md`
- `docs/backend/usecase-rules.md`
- `docs/backend/api-design.md`
- `docs/backend/sql-antipatterns.md`
- `docs/testing/ui-testing.md`
- `docs/testing/vrt-testing.md`
- `docs/testing/e2e-testing.md`

## Execution Order

```
Step 1: Resolve D-008 + add D-009 in decisions.md
Step 2: Rename docs/domain/ -> docs/reference/, delete entities.md + usecases.md
Step 3: Rename plan spec files (01_TYPES, 02_PLUGINS)
Step 4: Apply terminology changes across all docs (parallel edits)
Step 5: Rewrite CLAUDE.md for SDK conventions
Step 6: Delete web-app template files
Step 7: Update all cross-references
```

## Verification

1. `grep -r "Domain Model\|Entity\|Aggregate\|UseCase\|Adapter" docs/` returns no DDD terminology
2. `grep -r "@my-app/errors\|Result type\|Ok(\|Err(" docs/` returns no Result type references
3. All cross-references (`docs/domain/` -> `docs/reference/`, old file names -> new) are updated
4. CLAUDE.md reflects SDK conventions (thrown exceptions, no UseCase rules)
