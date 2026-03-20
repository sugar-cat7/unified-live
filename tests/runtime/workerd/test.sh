#!/usr/bin/env bash
set -euo pipefail

PORT=8787
WRANGLER_LOG=$(mktemp)

# Check port availability
if command -v lsof &>/dev/null && lsof -i ":$PORT" -sTCP:LISTEN -t &>/dev/null; then
  echo "Port $PORT is already in use"
  exit 1
fi

# Start wrangler in background, redirect output to log
npx wrangler dev --config tests/runtime/workerd/wrangler.jsonc --port "$PORT" --ip 127.0.0.1 > "$WRANGLER_LOG" 2>&1 &
WRANGLER_PID=$!
trap "kill $WRANGLER_PID 2>/dev/null; pkill -P $WRANGLER_PID 2>/dev/null || true; rm -f $WRANGLER_LOG" EXIT

# Poll until ready, capturing the first successful response
RESPONSE=""
READY=0
for i in $(seq 1 30); do
  # Check wrangler is still alive
  if ! kill -0 "$WRANGLER_PID" 2>/dev/null; then
    echo "wrangler process exited unexpectedly:"
    cat "$WRANGLER_LOG"
    exit 1
  fi

  RESULT=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT" 2>/dev/null) || true
  HTTP_STATUS=$(echo "$RESULT" | tail -1)
  if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" != "000" ]; then
    RESPONSE="$RESULT"
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "Timeout waiting for wrangler dev after 30s"
  echo "--- wrangler log ---"
  cat "$WRANGLER_LOG"
  echo "--- end of wrangler log ---"
  exit 1
fi

BODY=$(echo "$RESPONSE" | head -n -1)
if command -v jq &>/dev/null; then
  echo "$BODY" | jq .
else
  echo "$BODY"
fi

if [ "$HTTP_STATUS" != "200" ]; then
  echo "Runtime compat test failed (HTTP $HTTP_STATUS)"
  exit 1
fi

echo "Runtime compat test passed"
