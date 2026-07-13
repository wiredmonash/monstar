---
title: Automate Linode deploys with a GitHub Actions workflow
status: superseded
superseded-by: 0010-migrate-to-vercel.md
date: 2025-09-24
tags: [infra, ci]
---

# Automate Linode deploys with a GitHub Actions workflow

## Context

The project lead deployed to the Linode VPS (ADR-0004) by hand: SSH in, git pull, reinstall. Each release waited on his availability.

## Decision

Add a GitHub Actions workflow (`deploy.yml`) that, on push to `main`, SSHes into the server, git-pulls, and reinstalls dependencies. Follow-up commits pinned the action SHA, serialized concurrent runs, and skipped deploys for docs-only changes.

## Consequences

- Merging to `main` deploys; nobody waits on the one person with server access.
- The pipeline still ran as root over SSH with a password secret. The team accepted this as a stopgap, and the Vercel migration (ADR-0010) retired it two months later.
