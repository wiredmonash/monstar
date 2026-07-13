---
title: Cache hot endpoints in Upstash Redis
status: accepted
date: 2025-12-21
tags: [backend, infra, performance]
---

# Cache hot endpoints in Upstash Redis

## Context

On Vercel (ADR-0010), each function invocation pays MongoDB connection and query cost. Hot read endpoints (unit lists, unit overviews) were slow because of this per-invocation latency.

## Decision

Add a Redis cache layer using Upstash (PR #132):

- Upstash serves Redis over HTTP, the flavor that fits Vercel functions, and has a free tier.
- A cache provider wraps hot reads; an admin router exposes a cache-invalidation helper endpoint; invalidation uses pattern matching.
- Tests mock Redis via `ioredis-mock`, and the team added artillery to load-test the gains.

## Consequences

- Hot endpoints skip Mongo on cache hits.
- Cache invalidation is now a correctness concern: writes must invalidate matching keys, and the team later added manual invalidation hooks to the frontend (jobs board).
