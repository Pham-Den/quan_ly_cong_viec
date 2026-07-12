#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"
BACKEND_LOG="$STATE_DIR/backend.log"
FRONTEND_LOG="$STATE_DIR/frontend.log"

mkdir -p "$STATE_DIR"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:$FRONTEND_PORT}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:$BACKEND_PORT}"
DATABASE_URL="${DATABASE_URL:-}"
RUST_LOG="${PRISMA_RUST_LOG:-info}"
export RUST_LOG

is_running() {
  pid_file="$1"

  [ -f "$pid_file" ] || return 1
  pid="$(cat "$pid_file")"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null
}

port_in_use() {
  port="$1"

  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$port" | tail -n +2 | grep -q .
    return
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$port" >/dev/null 2>&1
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi

  return 1
}

ensure_port_free() {
  name="$1"
  port="$2"
  pid_file="$3"

  if ! is_running "$pid_file" && port_in_use "$port"; then
    echo "$name port $port is already in use. Run sh stop.sh first or close that process."
    exit 1
  fi
}

start_service() {
  name="$1"
  pid_file="$2"
  log_file="$3"
  shift 3

  if is_running "$pid_file"; then
    echo "$name is already running with PID $(cat "$pid_file")."
    return
  fi

  rm -f "$pid_file"
  : > "$log_file"

  (
    cd "$ROOT_DIR"
    if command -v setsid >/dev/null 2>&1; then
      setsid "$@" > "$log_file" 2>&1 < /dev/null &
    else
      nohup "$@" > "$log_file" 2>&1 < /dev/null &
    fi
    echo $! > "$pid_file"
  )

  sleep 1

  if ! is_running "$pid_file"; then
    if { [ "$name" = "Backend" ] && port_in_use "$BACKEND_PORT"; } || { [ "$name" = "Frontend" ] && port_in_use "$FRONTEND_PORT"; }; then
      echo "$name started. Log: $log_file"
      return
    fi

    echo "$name failed to start. Recent log:"
    tail -n 40 "$log_file"
    exit 1
  fi

  echo "$name started with PID $(cat "$pid_file"). Log: $log_file"
}

ensure_port_free "Backend" "$BACKEND_PORT" "$BACKEND_PID_FILE"
ensure_port_free "Frontend" "$FRONTEND_PORT" "$FRONTEND_PID_FILE"

if [ "${SKIP_DB_SETUP:-0}" != "1" ]; then
  echo "Preparing local database..."
  npm --workspace backend run db:ensure
  (
    cd "$ROOT_DIR/backend"
    RESOLVED_DATABASE_URL="$(DATABASE_URL="$DATABASE_URL" npx tsx src/db/print-database-url.ts)"
    DATABASE_URL="$RESOLVED_DATABASE_URL" npx prisma generate --schema prisma/schema.prisma
    RUST_LOG="$RUST_LOG" DATABASE_URL="$RESOLVED_DATABASE_URL" npx prisma db push --schema prisma/schema.prisma
    DATABASE_URL="$RESOLVED_DATABASE_URL" npx tsx prisma/seed.ts
    printf '%s' "$RESOLVED_DATABASE_URL" > "$STATE_DIR/backend.database-url"
  )
else
  (
    cd "$ROOT_DIR/backend"
    RESOLVED_DATABASE_URL="$(DATABASE_URL="$DATABASE_URL" npx tsx src/db/print-database-url.ts)"
    printf '%s' "$RESOLVED_DATABASE_URL" > "$STATE_DIR/backend.database-url"
  )
fi

DATABASE_URL="$(cat "$STATE_DIR/backend.database-url")"

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
echo "Stop:     sh stop.sh"
