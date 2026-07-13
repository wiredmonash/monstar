---
title: Integrate scraped SETU survey data into unit pages
status: superseded
superseded-by: 0013-remove-setu-data.md
date: 2025-05-06
tags: [backend, frontend, product, seo]
---

# Integrate scraped SETU survey data into unit pages

## Context

MonSTAR's value depends on unit pages having content, but a young review platform has a cold-start problem: most units have few or no student reviews. Monash publishes SETU (Student Evaluation of Teaching and Units) survey results, official quantitative scores per unit offering.

## Decision

Scrape SETU results and integrate them into the platform:

- A scraper (later the `data/` folder) ingested SETU results; bulk-create endpoints loaded them.
- Unit overview pages showed a SETU card next to student reviews; each unit got a dedicated SETU page, plus a SETU main page.
- SETU pages got SEO treatment: meta tags and generated sitemap entries, making thousands of unit-offering pages indexable.

## Rationale

Official aggregate scores complement subjective student reviews, so a unit page stays useful with zero user reviews. The indexable SETU pages were an SEO play to pull search traffic to the platform.

## Consequences

- Unit pages had content from day one of the feature; search traffic grew.
- WIRED republished the data without authorization from Monash. The university lodged a formal complaint in December 2025; ADR-0013 reverses this decision.
