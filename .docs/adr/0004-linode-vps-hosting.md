---
title: Host production on the WIRED Linode VPS at monstar.wired.org.au
status: superseded
superseded-by: 0010-migrate-to-vercel.md
date: 2024-12-01
tags: [infra]
---

# Host production on the WIRED Linode VPS at monstar.wired.org.au

## Context

Faye ran WIRED Monash's club website (`wired.org.au`) on a Linode VPS. MonSTAR needed a production home and had no budget for dedicated infrastructure.

## Decision

Deploy MonSTAR on the same Linode server, next to the club website, at the subdomain `monstar.wired.org.au`. The app ran as a plain Node/Express server from `/var/www/monstar`. Faye set up the original deployment; after that the project lead deployed by hand until September 2025, when a GitHub Action took over the job (ADR-0009).

A December 2024 `vercel.json` experiment (routing the whole app through `@vercel/node`) never served production traffic.

## Consequences

- Zero additional hosting cost and a working deployment with no new infrastructure decisions.
- Each deploy depended on one person's server access and a root-SSH pull pipeline, a fragile arrangement.
- The Vercel migration (ADR-0010) superseded this in November 2025.
