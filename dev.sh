#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"
BACKEND_LOG="$STATE_DIR/backend.log"
FRONTEND_LOG="$STATE_DIR/frontend.log"

mkdir -p "$STATE_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:$FRONTEND_PORT}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:$BACKEND_PORT}"
DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

is_running() {
  local pid_file="$1"

  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

port_in_use() {
  local port="$1"

  ss -ltn "sport = :$port" | tail -n +2 | grep -q .
}

ensure_port_free() {
  local name="$1"
  local port="$2"
  local pid_file="$3"

  if ! is_running "$pid_file" && port_in_use "$port"; then
    echo "$name port $port is already in use. Run ./stop.sh first or close that process."
    exit 1
  fi
}

start_service() {
  local name="$1"
  local pid_file="$2"
  local log_file="$3"
  shift 3

  if is_running "$pid_file"; then
    echo "$name is already running with PID $(cat "$pid_file")."
    return
  fi

  rm -f "$pid_file"
  : > "$log_file"

  (
    cd "$ROOT_DIR"
    nohup "$@" > "$log_file" 2>&1 &
    echo $! > "$pid_file"
  )

  sleep 1

  if ! is_running "$pid_file"; then
    echo "$name failed to start. Recent log:"
    tail -n 40 "$log_file"
    exit 1
  fi

  echo "$name started with PID $(cat "$pid_file"). Log: $log_file"
}

ensure_port_free "Backend" "$BACKEND_PORT" "$BACKEND_PID_FILE"
ensure_port_free "Frontend" "$FRONTEND_PORT" "$FRONTEND_PID_FILE"

if [[ "${SKIP_DB_SETUP:-0}" != "1" ]]; then
  echo "Preparing local database..."
  DATABASE_URL="$DATABASE_URL" npm --workspace backend run db:push
  DATABASE_URL="$DATABASE_URL" npm --workspace backend run db:seed
fi

start_service \
  "Backend" \
  "$BACKEND_PID_FILE" \
  "$BACKEND_LOG" \
  env \
  "BACKEND_PORT=$BACKEND_PORT" \
  "FRONTEND_ORIGIN=$FRONTEND_ORIGIN" \
  "DATABASE_URL=$DATABASE_URL" \
  npm --workspace backend run dev

start_service \
  "Frontend" \
  "$FRONTEND_PID_FILE" \
  "$FRONTEND_LOG" \
  env \
  "VITE_API_BASE_URL=$VITE_API_BASE_URL" \
  npm --workspace frontend run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort

echo
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend:  http://localhost:$BACKEND_PORT"
echo "Stop:     ./stop.sh"
