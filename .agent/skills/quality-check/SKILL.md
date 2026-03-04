---
name: Quality Check
description: Run the project's quality checks and report only failures that require action. Use when the user requests running checks, verifying code changes, or identifying the first failing gate.
---

# Trigger Conditions

- When the user requests running checks or verifying code
- When you want to confirm the status of quality gates after code changes
- When you want to quickly identify the first failing check

# Execution Checklist

1. Run `./scripts/post-edit-check.sh`
2. If it fails, identify the first failing command and its root cause
3. Suggest a minimal, safe fix
4. Do not commit automatically
