#!/usr/bin/env bash
set -euo pipefail

PORT=8787

# Start wrangler in background
npx wrangler dev --config tests/runtime/workerd/wrangler.jsonc --port "$PORT" &
WRANGLER_PID=$!
trap "kill $WRANGLER_PID 2>/dev/null || true" EXIT

# Wait for server ready (max 30s)
for i in $(seq 1 30); do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Timeout waiting for wrangler dev"
    exit 1
  fi
  sleep 1
done

# Fetch results (single request)
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT")
HTTP_STATUS=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$BODY" | jq .

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "Runtime compat test failed (HTTP $HTTP_STATUS)"
  exit 1
fi

echo "Runtime compat test passed"
