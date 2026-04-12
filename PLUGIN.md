# Claude Code plugin

This repo doubles as a Claude Code plugin marketplace
(`name: sugar-cat7`) hosting a single plugin for AI-queryable
unified-live docs.

## Install (Claude Code users)

```bash
/plugin marketplace add sugar-cat7/unified-live
/plugin install unified-live@sugar-cat7
```

See [`plugins/unified-live/README.md`](plugins/unified-live/README.md)
for details.

## What gets installed

- `/unified-live:docs` — a model-invoked skill that loads the full
  unified-live documentation on demand from
  `https://sugar-cat7.github.io/unified-live/llms-full.txt` and cites
  it when answering questions about the SDK.

## Related

- [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) —
  the marketplace manifest
- [`plugins/unified-live/`](plugins/unified-live/) — the plugin source
- [`context7.json`](context7.json) — Context7 registration for the
  same docs via an independent MCP
