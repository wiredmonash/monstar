#!/usr/bin/env bash
# Idempotent bootstrap for the Playwright venv used in visual verification.
# Creates ~/.venvs/playwright, installs playwright + Chromium if missing.
set -euo pipefail

venv="$HOME/.venvs/playwright"
py="$venv/bin/python"

if [ ! -x "$py" ]; then
  python3 -m venv "$venv"
fi

"$py" -c 'import playwright' 2>/dev/null || "$venv/bin/pip" install -q playwright

# Chromium: try a launch; install browsers only when it fails.
if ! "$py" - <<'EOF' 2>/dev/null
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    p.chromium.launch(headless=True).close()
EOF
then
  "$venv/bin/playwright" install chromium \
    || { echo "Chromium install needs system deps; run:" >&2
         echo "  $venv/bin/playwright install --with-deps chromium" >&2
         exit 1; }
fi

echo "playwright ready: $py"
