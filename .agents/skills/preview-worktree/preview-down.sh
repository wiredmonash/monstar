#!/usr/bin/env bash
# Stop the preview servers for a monstar worktree and clean up .preview/.
# Usage: preview-down.sh <worktree-path>
set -euo pipefail

wt="${1:?usage: preview-down.sh <worktree-path>}"
wt="$(cd "$wt" && pwd)"
pv="$wt/.preview"

[ -d "$pv" ] || { echo "no preview state at $pv; nothing to stop"; exit 0; }

if [ -f "$pv/pids" ]; then
  while read -r pid; do
    kill -TERM -- "-$pid" 2>/dev/null || true   # whole process group (setsid)
  done < "$pv/pids"
  sleep 2
  while read -r pid; do
    kill -KILL -- "-$pid" 2>/dev/null || true
  done < "$pv/pids"
fi

rm -rf "$pv"
echo "preview stopped and $pv removed"

if [ -n "$(git -C "$wt" status --porcelain backend/swagger.json 2>/dev/null)" ]; then
  echo "warning: backend/swagger.json is modified (dev boot regenerates it)."
  echo "  restore with: git -C $wt checkout -- backend/swagger.json"
fi
