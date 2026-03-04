#!/bin/bash
# Post-edit hook: Run build, lint, type checks, tests, and security scans after file edits

set -e

pnpm build
pnpm biome
pnpm textlint
pnpm knip
pnpm type-check
pnpm test
pnpm security-scan
