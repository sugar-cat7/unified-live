---
name: vrt-testing
description: Used to implement VRT with Storybook + Playwright, detecting UI regressions through snapshot diffs. Stabilizes non-deterministic elements and operates with minimal mocks.
---

# Trigger Conditions

- When you want to verify UI visual regressions
- When adding or updating VRT for Storybook stories

# Execution Checklist

1. Review `docs/testing/vrt-testing.md`
2. Add VRT cases per story
3. Stabilize time/animations/viewport
4. Update snapshots with an explanation of intent

# Reference Documents

- `docs/testing/vrt-testing.md`
- `docs/design/design-review.md`
