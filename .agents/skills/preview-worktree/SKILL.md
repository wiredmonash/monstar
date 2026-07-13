---
name: preview-worktree
description: Spin up live preview servers (frontend + backend) for an offshoot worktree on its own port slot (localhost:4201-4209), and tear them down after checking. Use when the user wants to preview a worktree's changes in the UI, see a branch running live, or stop a running preview.
---

# Preview Worktree

Run a worktree's frontend and backend on their own ports so its changes can be checked in the browser without touching the main checkout's servers (4200/8080 stay reserved for main).

## Port slots

Slot X (1-9) maps to frontend `4200+X` and backend `8080+X`. The scripts pick the lowest slot where both ports are free. One slot per worktree; re-running `preview-up.sh` on a worktree with a live preview reuses its slot.

## Start

```bash
bash <this-skill-dir>/preview-up.sh <worktree-path>
```

The script allocates a slot, writes `<worktree>/.preview/` (generated proxy config, PIDs, logs), starts both servers detached, waits until they answer, and prints the URL. Report the URL to the user. Logs: `.preview/backend.log`, `.preview/frontend.log`.

## Visual verification

For UI changes, do not stop at HTTP status checks — screenshot the changed pages and look at them (the `webapp-testing` skill has the Playwright patterns). Conventions here:

- Python with Playwright lives in the dedicated venv: `~/.venvs/playwright/bin/python`. If it's missing on this machine, run `bash <this-skill-dir>/ensure-playwright.sh` once — it creates the venv and downloads Chromium.
- Save screenshots to `<worktree>/.preview/shots/` — it is inside the gitignored `.preview/` dir and gets wiped by `preview-down.sh`. Never scatter shots in `/tmp` or the repo.
- Point the browser at the slot URL (`http://localhost:4200+X`), wait for `networkidle`, then `page.screenshot(path=..., full_page=True)` and view the PNG with the Read tool. Compare against main's UI on 4200 when a before/after matters.
- Skip `with_server.py` from webapp-testing — `preview-up.sh`/`preview-down.sh` already manage the servers.
- Signed-in flows hit the Google OAuth origin limitation below; verify those on main's 4200 or skip.

## Stop — always, once checking is done

```bash
bash <this-skill-dir>/preview-down.sh <worktree-path>
```

Kills both server process groups and deletes `.preview/`. Never leave a preview running after the user finishes checking; if the conversation moves on, stop it.

## Considerations beyond the port

- **Build configuration**: previews must NOT use the default `development` build config — its fileReplacement swaps in `environment.development.ts`, which hardcodes `http://localhost:8080` and bypasses the proxy (that's main's backend: wrong server and a CORS block). The up script serves the `preview` configuration (relative `/api` URLs via `environment.preview.ts`, dev-speed build), falling back to `production` for worktrees branched before that config existed.
- **Proxy config**: the frontend reaches the backend through the dev-server proxy. The up script generates a per-slot proxy file (`/api` prefix, no path rewrite — the backend mounts its routes under `/api`) targeting `localhost:8080+X`, passed via `--proxy-config`. The checked-in `frontend/src/proxy.conf.json` stays untouched; note its `pathRewrite` stripping `/api` does not match the backend's mounts, so don't copy it.
- **CORS**: the backend allows only `http://localhost:4200`. Proxied `/api` calls are same-origin so previews work, but code that calls the backend port from the browser will be blocked. Treat that as a signal the code should use the proxy path.
- **Google sign-in**: the OAuth client lists authorized JavaScript origins. If `http://localhost:4201`-`4209` are not registered in the Google Cloud console, sign-in fails with an origin mismatch on preview ports. Features behind auth need those origins added once, or must be checked on main's 4200.
- **Shared MongoDB and Redis**: the worktree copies `backend/.env`, so previews hit the same Atlas database and Upstash cache as main dev. Writes are real, and cache invalidations affect the shared cache. Do not run destructive flows just to "see" them.
- **swagger.json**: a backend dev boot can regenerate `backend/swagger.json` and dirty the worktree. Do not commit that churn; if the branch did not intend swagger changes, restore the file before committing.
- **Dependencies**: previews need `node_modules` in both `frontend/` and `backend/` (the offshoot setup script installs them). The up script refuses to start without them rather than half-booting.
