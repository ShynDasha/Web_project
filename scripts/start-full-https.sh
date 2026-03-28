#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT_DIR/certs"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/run"

mkdir -p "$CERT_DIR" "$LOG_DIR" "$PID_DIR"

if [[ ! -f "$CERT_DIR/localhost-key.pem" || ! -f "$CERT_DIR/localhost.pem" ]]; then
  echo "Generating local TLS certificate..."
  openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 \
    -keyout "$CERT_DIR/localhost-key.pem" \
    -out "$CERT_DIR/localhost.pem" \
    -subj "/CN=localhost" >/dev/null 2>&1
fi

start_service() {
  local name="$1"
  local workdir="$2"
  local pidfile="$PID_DIR/$name.pid"
  shift 2

  if [[ -f "$pidfile" ]]; then
    local existing_pid
    existing_pid="$(cat "$pidfile")"
    if kill -0 "$existing_pid" 2>/dev/null; then
      echo "$name is already running with PID $existing_pid"
      return
    fi
    rm -f "$pidfile"
  fi

  (
    cd "$workdir"
    "$@" >"$LOG_DIR/$name.log" 2>&1
  ) &

  local pid=$!
  echo "$pid" >"$pidfile"
  echo "Started $name on PID $pid"
}

start_service "auth-service" "$ROOT_DIR/services/auth-service" \
  env ENABLE_HTTPS=true PORT=4101 node server.js

start_service "product-service" "$ROOT_DIR/services/product-service" \
  env ENABLE_HTTPS=true PORT=4102 node server.js

start_service "notification-service" "$ROOT_DIR/services/notification-service" \
  env ENABLE_HTTPS=true PORT=4104 node server.js

start_service "order-service" "$ROOT_DIR/services/order-service" \
  env NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4103 \
  PRODUCT_SERVICE_URL=https://localhost:4102 \
  NOTIFICATION_SERVICE_URL=https://localhost:4104 \
  node server.js

start_service "api-gateway" "$ROOT_DIR/api-gateway" \
  env NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4450 \
  AUTH_SERVICE_URL=https://localhost:4101 \
  PRODUCT_SERVICE_URL=https://localhost:4102 \
  ORDER_SERVICE_URL=https://localhost:4103 \
  node server.js

start_service "frontend" "$ROOT_DIR/frontend" \
  env ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4450 \
  node server.js

echo ""
echo "Application is starting."
echo "Open: https://localhost:3443"
echo "Logs: $LOG_DIR"
echo "Stop all services with: ./scripts/stop-full-https.sh"
