# 00: Plugin Companion Object

## Purpose

Refactor `PlatformPlugin` to use the companion object pattern with a declarative `PluginDefinition`, reducing boilerplate for new platform plugins and centralizing common infrastructure logic in `@unified-live/core`.

## Background

The current `PlatformPlugin` is a plain TypeScript type. Each plugin (e.g., `createYouTubePlugin`) manually:

1. Calls `createRestManager()`
2. Overrides `rest.request` for auth injection
3. Overrides `rest.handleRateLimit` for platform-specific error handling
4. Returns a hand-crafted object literal implementing all methods

This is error-prone and repetitive. When adding Twitch or TwitCasting plugins, the same boilerplate patterns (request transformation, rate limit handling, disposal) must be re-implemented.

## Goals

1. **Companion object**: `PlatformPlugin.create(definition)` constructs a fully wired plugin from a declarative definition
2. **Declarative definition**: URL matching, request transformation, rate limit handling expressed as data/config rather than imperative overrides
3. **Type guard**: `PlatformPlugin.is(value)` for runtime type checking
4. **Backward compatibility**: `createYouTubePlugin` continues to work, internally using `PlatformPlugin.create`

## In Scope

- `PluginDefinition` type design (declarative plugin configuration)
- `PlatformPlugin` companion object (`create`, `is`)
- Migration of `createYouTubePlugin` to the new architecture
- Existing test maintenance and updates

## Out of Scope

- Twitch / TwitCasting plugin implementations (not yet created)
- `RestManager` design changes (overridable function object pattern is kept as-is)
- `UnifiedClient` public API changes
- New features or endpoints

## Success Criteria

1. `PlatformPlugin.create(definition)` produces a working plugin equivalent to current `createYouTubePlugin`
2. All 134 existing tests pass without modification (or with minimal adaptation)
3. `createYouTubePlugin` is a thin wrapper around `PlatformPlugin.create`
4. Adding a hypothetical new platform requires only a `PluginDefinition` object, not manual RestManager overrides
