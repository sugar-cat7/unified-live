#!/bin/bash
# Post-edit hook: Run build, lint, type checks, and tests after file edits

set -e

pnpm build
pnpm lint
pnpm format:check
# textlint skipped: no rules configured yet (see .textlintrc.json)
pnpm knip
pnpm type-check
pnpm test:run
