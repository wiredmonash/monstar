---
title: Convert the backend to TypeScript
status: accepted
date: 2026-07-05
tags: [backend]
---

# Convert the backend to TypeScript

## Context

After about two years of plain JavaScript, the untyped Express/Mongoose codebase kept biting rotating student contributors: silent field-name mismatches (the `googleId`/`googleID` class of bug), untyped request handlers, and Mongoose documents with no compile-time shape.

## Decision

Convert the whole backend to TypeScript (PR #192, shipped 5 July 2026):

- Type helpers derive Mongoose model types from the schemas (unit, review, user, notification, org logo, setu), so no hand-written interface can drift from its schema.
- Typed Express helpers wrap request handlers; the team converted the providers (mongodb, cloudinary, cache) first.
- AI-assisted refactoring made the conversion practical in 2026; by hand it would have been prohibitive for a student team.

**Deployment consequence:** `@vercel/node` cannot resolve TS path aliases, so the Vercel backend function serves compiled JS (`index.js` pointing into `dist/`) instead of building from TS source.

## Consequences

- Field-name and shape mismatches are compile errors instead of production bugs.
- Contributors get editor-level API discovery on models and handlers.
- The build step (and the compiled-JS Vercel entrypoint) is now part of the deploy contract.
