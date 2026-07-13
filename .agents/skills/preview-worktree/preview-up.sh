#!/usr/bin/env bash
# Start preview servers for a monstar worktree on its own port slot.
# Usage: preview-up.sh <worktree-path>
#   Slot X in 1..9 -> frontend 4200+X, backend 8080+X (main owns 4200/8080).
#   State lives in <worktree>/.preview/ (proxy.json, pids, logs, slot).
set -euo pipefail

wt="${1:?usage: preview-up.sh <worktree-path>}"
wt="$(cd "$wt" && pwd)"
[ -f "$wt/frontend/angular.json" ] && [ -f "$wt/backend/package.json" ] \
  || { echo "error: $wt is not a monstar checkout" >&2; exit 1; }
[ -d "$wt/frontend/node_modules" ] && [ -d "$wt/backend/node_modules" ] \
  || { echo "error: node_modules missing; run 'make install' in $wt first" >&2; exit 1; }

pv="$wt/.preview"

port_taken() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

alive() { kill -0 "$1" 2>/dev/null; }

# Reuse a running preview for this worktree.
if [ -f "$pv/slot" ] && [ -f "$pv/pids" ]; then
  slot="$(cat "$pv/slot")"
  if while read -r pid; do alive "$pid" || exit 1; done < "$pv/pids"; then
    echo "preview already running: http://localhost:$((4200 + slot))"
    exit 0
  fi
  rm -rf "$pv"
fi

slot=""
for x in 1 2 3 4 5 6 7 8 9; do
  if ! port_taken $((4200 + x)) && ! port_taken $((8080 + x)); then slot=$x; break; fi
done
[ -n "$slot" ] || { echo "error: no free port slot in 4201-4209" >&2; exit 1; }
fe_port=$((4200 + slot)); be_port=$((8080 + slot))

mkdir -p "$pv"
echo "$slot" > "$pv/slot"
# No pathRewrite: the backend mounts routes under /api (see backend/src/server.ts),
# and "/api" as a plain prefix matches nested paths where the "/api/*" glob did not.
cat > "$pv/proxy.json" <<EOF
{
  "/api": {
    "target": "http://localhost:$be_port",
    "secure": false,
    "changeOrigin": false
  }
}
EOF

# The frontend must build with relative /api URLs so calls stay same-origin and
# hit the proxy. The default (development) config swaps in
# environment.development.ts, which hardcodes http://localhost:8080 and bypasses
# the proxy entirely. Prefer the "preview" configuration (relative URLs, dev-speed
# build); fall back to "production" (also relative URLs) for worktrees branched
# before the preview config existed.
if grep -q '"preview"' "$wt/frontend/angular.json"; then
  fe_config=preview
else
  fe_config=production
  echo "note: no 'preview' config in this worktree's angular.json;" \
       "using production build (slower rebuilds)"
fi

setsid env PORT="$be_port" npm --prefix "$wt/backend" run dev \
  > "$pv/backend.log" 2>&1 &
be_pid=$!
setsid npx --prefix "$wt/frontend" ng serve --configuration "$fe_config" \
  --port "$fe_port" --proxy-config "$pv/proxy.json" > "$pv/frontend.log" 2>&1 &
fe_pid=$!
printf '%s\n%s\n' "$be_pid" "$fe_pid" > "$pv/pids"

wait_port() { # port timeout_s label
  for _ in $(seq 1 "$2"); do
    port_taken "$1" && return 0
    sleep 1
  done
  echo "error: $3 did not open port $1 within $2 s; see logs in $pv" >&2
  return 1
}
wait_port "$be_port" 60 backend
wait_port "$fe_port" 180 frontend

echo "preview up (slot $slot)"
echo "  ui:      http://localhost:$fe_port"
echo "  backend: http://localhost:$be_port"
echo "  logs:    $pv/{backend,frontend}.log"
echo "stop with: preview-down.sh $wt"
