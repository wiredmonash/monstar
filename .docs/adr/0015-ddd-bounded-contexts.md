---
title: Restructure the backend into DDD bounded contexts
status: accepted
date: 2026-07-05
tags: [backend, architecture]
---

# Restructure the backend into DDD bounded contexts

## Context

The backend was organized layer-by-type (`routes/`, `controllers/`, `models/`), so each feature change touched folders across the tree and new contributors had no obvious home for new code. The project lead had also been studying domain-driven design (the Contextive glossary in `.contextive/`, domain-modeling practice) and chose to bring that discipline to the project.

## Decision

Restructure `backend/src/` into bounded contexts (units, reviews, users, notifications, and so on), each exposing a public API through its `index.ts`:

- Cross-context imports go through the target context's `index.ts`; no reaching into internals.
- PR #201 folded the legacy v1 API routes into their owning domains as `*.v1.*` files and deleted the separate `deprecated/` tree.
- The glossary in `.contextive/definitions.yml` records the ubiquitous language the structure follows.

## Consequences

- A feature change stays inside one context, and contributors navigate by domain noun.
- The `*.v1.*` naming contains and marks v1 endpoints for removal as v2 cutovers proceed (units read cutover and dead v1 endpoint drops, July 2026).
- Reviewers must hold the import discipline at `index.ts` boundaries. Known gotcha: some entrypoints must import model files for their side effects.
