# VRT (Visual Regression Testing) Implementation Policy

## Purpose

- Detect UI visual regressions through diffs
- Maintain the ability to determine whether design changes per component are intentional

## Scope

- `services/web/vrt/storybook.spec.ts`
- Storybook stories (design system, key UI)

## Implementation Rules

1. Treat each Storybook story as one VRT case
2. Compare diffs using Playwright's `toHaveScreenshot()`
3. Fix viewport, fonts, time, and animations to eliminate non-determinism
4. Only update snapshots in "specification change PRs"

## Mocking Policy

- Default: no mocking
- Exception: only return fixed responses via MSW when a story depends on an external API
- Goal: stabilize regression detection for layout/color/typography

## Operational Rules

- When updating baselines, include the "intent of the diff" in the PR
- If changes are significant, verify impact on UI/E2E in addition to VRT

## Execution Commands

- `pnpm --filter web vrt`
- Update: `pnpm --filter web vrt:update`

## References (Primary Sources)

- Playwright Visual Comparisons: https://playwright.dev/docs/test-snapshots
- Storybook Visual Testing: https://storybook.js.org/docs/writing-tests/visual-testing
