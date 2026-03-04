#!/bin/bash
set -e

# Start static server in background
http-server /app/storybook-static -p 6006 -s &

# Wait for server startup
sleep 2

# Run Playwright tests
cd /app
npx playwright test -c vrt/playwright.config.ts "$@"
