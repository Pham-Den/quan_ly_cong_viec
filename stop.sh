#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

stop_pid() {
  name="$1"
  pid="$2"

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  echo "Stopping $name PID $pid..."
  kill -TERM "-$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null || true

  i=0
  while [ "$i" -lt 20 ]; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return
    fi
    sleep 0.2
    i=$((i + 1))
  done

  echo "$name PID $pid did not stop, forcing..."
  kill -KILL "-$pid" 2>/dev/null || true
  kill -9 "$pid" 2>/dev/null || true
}

stop_pid_file() {
  name="$1"
  pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    return
  fi

  stop_pid "$name" "$(cat "$pid_file")"
  rm -f "$pid_file"
}

pids_for_port() {
  port="$1"

  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | sed '/^$/d'
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :$port" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | sort -u
    return
  fi
}

stop_port() {
  name="$1"
  port="$2"

  pids="$(pids_for_port "$port" | sort -u || true)"

  if [ -z "$pids" ]; then
    return
  fi

  printf '%s\n' "$pids" | while IFS= read -r pid; do
    [ -n "$pid" ] && stop_pid "$name on port $port" "$pid"
  done
}

stop_pid_file "Backend" "$BACKEND_PID_FILE"
stop_pid_file "Frontend" "$FRONTEND_PID_FILE"

stop_port "Backend" "$BACKEND_PORT"
stop_port "Frontend" "$FRONTEND_PORT"

echo "Stopped backend/frontend dev servers."
