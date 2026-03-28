#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT_DIR/run"

if [[ ! -d "$PID_DIR" ]]; then
  echo "No running services found."
  exit 0
fi

for pidfile in "$PID_DIR"/*.pid; do
  [[ -e "$pidfile" ]] || continue

  pid="$(cat "$pidfile")"
  name="$(basename "$pidfile" .pid)"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "Stopped $name (PID $pid)"
  else
    echo "$name was not running"
  fi

  rm -f "$pidfile"
done

echo "All tracked services are stopped."
