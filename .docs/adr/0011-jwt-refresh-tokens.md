---
title: Add JWT refresh tokens to keep users signed in
status: accepted
date: 2025-12-14
tags: [backend, security]
---

# Add JWT refresh tokens to keep users signed in

## Context

After Google sign-in (ADR-0005), short-lived JWT access tokens carried sessions. When a token expired, the app logged the user out without warning and forced a fresh sign-in, a recurring complaint.

## Decision

Introduce refresh tokens (PR #131): the access token stays short-lived, and a refresh token obtains new access tokens behind the scenes, extending session life without lengthening the access-token TTL.

## Consequences

- Users stay signed in across visits; no more surprise logouts.
- The team chose this over the lazy fix, long-lived access tokens, to keep the blast radius of a leaked token small.
