#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for f in \
  "$ROOT/runtime/viaproxy/viaproxy.pid" \
  "$ROOT/runtime/minecraft-26.3/server.pid"
do
  if [ -f "$f" ]; then
    pid="$(cat "$f")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PID $pid"
      kill -TERM "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  fi
done
echo "Stop signals sent. Check runtime/logs if a process remains."
