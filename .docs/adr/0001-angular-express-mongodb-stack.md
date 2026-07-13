---
title: Use Angular, Express, and MongoDB as the core stack
status: accepted
date: 2024-09-04
tags: [frontend, backend, infra]
---

# Use Angular, Express, and MongoDB as the core stack

## Context and Problem Statement

MonSTAR (repo slug `wired-unit-review` at the time) needed a web stack for a unit-review platform run by a rotating team of student contributors at WIRED Monash. The stack had to be easy for new members to pick up and cheap enough for a student-club budget.

## Decision Drivers

- Team familiarity: the founding contributors knew Angular, Express, and MongoDB, or were learning them.
- Maintainability with a rotating contributor base: strong conventions matter more than flexibility.
- Zero or near-zero hosting cost.

## Considered Options

- Angular + Express + MongoDB (MEAN)
- React frontend
- SQL database (PostgreSQL/MySQL)

## Decision Outcome

Chosen: **Angular + Express + MongoDB**.

**Angular over React:** Angular enforces strong separation between components and features and ships with router, HTTP client, forms, and DI included. React projects accumulate clutter and ad-hoc structure; Angular's opinionated layout keeps the codebase navigable as contributors rotate through the club.

**MongoDB over SQL:** one economic reason and one modeling reason.

- MongoDB Atlas's free 500 MB tier made it the zero-cost choice.
- Units and reviews are document-shaped (nested reviews, flexible fields), and the app had low relational complexity: few entities, few joins. The team judged SQL's multi-table machinery unwarranted at this scale.

### Consequences

- Good: new contributors find a conventional Angular/Express layout with little architectural bikeshedding.
- Good: the database costs nothing to host.
- Risk: if the domain grows more relational (many cross-entity features), the team may revisit a relational database. The team acknowledged this at decision time.
