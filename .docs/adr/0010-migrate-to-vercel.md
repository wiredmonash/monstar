---
title: Migrate hosting from the Linode VPS to Vercel serverless
status: accepted
date: 2025-11-26
tags: [infra]
supersedes: [0004-linode-vps-hosting.md, 0009-automated-linode-deploys.md]
---

# Migrate hosting from the Linode VPS to Vercel serverless

## Context

MonSTAR ran on the shared WIRED Linode VPS (ADR-0004) with a root-SSH pull deploy pipeline (ADR-0009). The club paid for the server, and the team owned its upkeep: OS, nginx, process management, each outage.

## Decision

Move the whole app to Vercel: the Angular frontend as static assets on the CDN, the Express backend as a serverless function (`@vercel/node`), with `vercel.json` routing between them. Deploys become git-push previews and automatic production deploys; the team deleted the old CI workflow.

Cost and operational burden drove the move: Vercel's free tier with zero server maintenance beat paying for and babysitting a VPS.

## Consequences

- No servers to maintain; preview deployments per branch; the team added Vercel Analytics.
- The team engineered around serverless constraints: Mongo connections optimized for function reuse (ready-state checks), SPA routing expressed in `vercel.json` (several iterations to mimic `express.static`), and a query-parameter serialization fix.
- Two later decisions follow from this one: the team added Redis caching (ADR-0012) to absorb per-invocation Mongo latency, and TypeScript path aliases forced the backend to ship as compiled JS (ADR-0014).
