---
title: Document the API with Swagger, replacing Bruno collections
status: accepted
date: 2025-09-26
tags: [backend, process]
---

# Document the API with Swagger, replacing Bruno collections

## Context

New student contributors needed a browsable, current API reference. Contributors maintained the Bruno request collections by hand, and the collections drifted from the real API.

## Decision

Adopt Swagger (OpenAPI), served by the backend, as the canonical API documentation. The team deleted the Bruno files in December 2025 ("since we have swagger now") and adopted Prettier in the same contributor-experience push.

## Consequences

- Contributors explore and try endpoints from the Swagger UI instead of reading route code.
- Someone must keep the spec honest: dev boots can clobber `swagger.json` with stale definitions, and swagger generation needed fixes when the team restructured routes in June and July 2026.
