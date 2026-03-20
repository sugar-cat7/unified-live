#!/usr/bin/env bash
set -euo pipefail

PORT=8787

# Start wrangler in background
npx wrangler dev --config tests/runtime/workerd/wrangler.jsonc --port "$PORT" &
WRANGLER_PID=$!
trap "kill $WRANGLER_PID 2>/dev/null || true" EXIT

# Poll until ready, capturing the first successful response
RESPONSE=""
for i in $(seq 1 30); do
  RESULT=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT" 2>/dev/null) || true
  HTTP_STATUS=$(echo "$RESULT" | tail -1)
  if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" != "000" ] && [ "$HTTP_STATUS" != "" ]; then
    RESPONSE="$RESULT"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Timeout waiting for wrangler dev"
    exit 1
  fi
  sleep 1
done

BODY=$(echo "$RESPONSE" | sed '$d')
echo "$BODY" | jq .

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "Runtime compat test failed (HTTP $HTTP_STATUS)"
  exit 1
fi

echo "Runtime compat test passed"
