# unified-live

A TypeScript SDK providing a unified interface for live streaming platform APIs (YouTube, Twitch, TwitCasting).

## Documentation

| Category                                                   | Overview                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [docs/reference/](docs/reference/)                         | Glossary, decisions, overview                                                  |
| [docs/plan/unified-live-sdk/](docs/plan/unified-live-sdk/) | Feature specifications (types, plugins, client API, infrastructure, packaging) |
| [docs/backend/](docs/backend/)                             | SDK architecture reference                                                     |
| [docs/testing/](docs/testing/)                             | Testing guidelines                                                             |
| [docs/security/](docs/security/)                           | Security and linting                                                           |

## Skills

Key skills are located in `.agent/skills/`.

- `plan-feature`: Generate specification documents from requirements
- `init-impl`: Generate phased implementation checklist from specifications
- `unit-testing` / `integration-testing`: Implementation guidelines for each test type
- `update-docs`: Sync docs with code changes

## Quality Check

Always run the following after code changes.

```bash
./scripts/post-edit-check.sh
```

## Claude Code

- Project instructions: `CLAUDE.md`
- Permission/Hook settings: `.claude/settings.json`
- Custom `/` skills: `.claude/skills/`
- `PreToolUse` blocks dangerous Bash commands (`git push`, `git add -A`, `git reset --hard`)
