---
name: api-testing
description: Used to build API tests using Hono testClient and OpenAPI contract verification, ensuring endpoint contracts with minimal mocks.
---

# Trigger Conditions

- When adding or modifying API endpoint tests
- When you want to lock down route input/output contracts

# Execution Checklist

1. Review `docs/testing/api-testing.md`
2. Enumerate success/error cases in a table
3. Hit the route directly using `testClient` or `app.request()`
4. Update `/doc`-based contract check targets

# Reference Documents

- `docs/testing/api-testing.md`
- `docs/web-frontend/twada-tdd.md`
