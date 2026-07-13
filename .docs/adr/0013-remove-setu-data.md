---
title: Remove all SETU data following Monash takedown request
status: accepted
date: 2025-12-23
tags: [backend, frontend, product, legal]
supersedes: 0006-setu-data-integration.md
---

# Remove all SETU data following Monash takedown request

## Context

On 16 December 2025, Monash Student Conduct, on advice from the university's Office of General Counsel, requested that WIRED remove all SETU data from its sites within 5 working days (by 23 December 2025, 11 PM). The advice held that:

- SETU survey responses are confidential under the Learning and Teaching Quality Procedure (LTQP) clause 2.5, which limits distribution to defined university audiences; nothing in the LTQP authorizes public publication.
- Publishing the data may breach clause 2.3 of the university's Media and Social Media Policy (confidential information in media).
- Restricting the WIRED site to staff and students would not cure the breach, because the LTQP does not list WIRED as an authorized recipient of SETU data at all.
- Copyright in the compilation and presentation of the data (as opposed to raw numbers) remained an open question.

Monash could refer non-compliance to Student Conduct as general misconduct.

## Decision

Comply and remove SETU from the platform:

- The team removed SETU data and UI by the 23 December 2025 deadline (`fix/remove-setu`, PR #133, merged 23 Dec 2025).
- July 2026 follow-ups hardened SETU routes to hard 404s (rather than soft redirects) and removed SETU sitemap entries so search engines drop the pages.
- PR #254 deleted the remaining public SETU API endpoints (July 2026).

## Consequences

- The platform loses its official-data content layer and the SEO surface built on it (ADR-0006 superseded); student reviews and AI overviews carry unit pages instead.
- Monash accepted the removal and took no further conduct action.
- WIRED plans to ask Monash for permission to reinstate SETU data through an authorized arrangement. If Monash agrees, a new ADR should record the terms.
