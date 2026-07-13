---
title: Generate AI overviews for units using Gemini 2.5 Pro
status: accepted
date: 2025-09-22
tags: [backend, frontend, product, ai]
---

# Generate AI overviews for units using Gemini 2.5 Pro

## Context

Unit pages accumulate reviews and quantitative metrics; a student deciding on a unit wants a quick take without reading it all.

## Decision

Add per-unit AI overviews: the backend feeds a unit's reviews and metrics (as an XML-structured prompt) to Gemini 2.5 Pro and stores the summary; the frontend shows it on the unit overview page with a model badge and a loading skeleton. The team added an `llms.txt` for AI crawlers in the same push.

The team picked Gemini for its free tier; on a student-club budget, cost mattered more than marginal quality.

## Consequences

- Unit pages get a readable summary that scales with review volume at no API cost.
- Output quality and availability track Google's free-tier terms; swapping models means re-tuning the prompt, kept in XML for structure.
