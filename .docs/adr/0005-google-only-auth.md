---
title: Use Google OAuth as the only sign-in method
status: accepted
date: 2025-02-25
tags: [backend, frontend, security]
---

# Use Google OAuth as the only sign-in method

## Context

MonSTAR launched with hand-rolled email/password registration and login next to Google sign-in. Both paths required Monash-email student verification, so verification did not distinguish them. The concern was the manual auth implementation itself: password handling that student developers wrote in-house may not have been secure.

## Decision

Remove email/password auth and keep Google OAuth as the sole sign-in method.

Google because:

- Delegating auth to a third party removes the risk surface of self-managed passwords: hashing, resets, breaches.
- Google accounts are ubiquitous among students.
- Monash student Okta accounts work with Google sign-in the same way, so the target audience loses nothing.

## Consequences

- No password storage or reset flows to maintain or get wrong.
- Sign-in depends on Google availability and OAuth client configuration.
- Later hardening (JWT refresh tokens, ADR-0011) builds on this single-provider model.
