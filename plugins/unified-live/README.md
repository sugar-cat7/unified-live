# unified-live (Claude Code plugin)

AI-queryable docs for the [unified-live](https://github.com/sugar-cat7/unified-live)
TypeScript SDK. When you discuss unified-live with Claude, it will fetch
the canonical docs and cite them.

## Install

```bash
/plugin marketplace add sugar-cat7/unified-live
/plugin install unified-live@sugar-cat7
```

## What it provides

- `/unified-live:docs` — model-invoked skill that loads the full doc
  surface on demand from `llms-full.txt`.

## Uninstall

```bash
/plugin uninstall unified-live@sugar-cat7
```
