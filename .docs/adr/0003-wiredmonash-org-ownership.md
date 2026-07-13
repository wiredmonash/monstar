---
title: Move the repository to the wiredmonash organization with a Jira-backed team workflow
status: accepted
date: 2024-12-16
tags: [process]
---

# Move the repository to the wiredmonash organization with a Jira-backed team workflow

## Context

MonSTAR was a WIRED Monash project from the beginning: team member Phuong Do proposed the review-platform idea, and Jenul Ferdinand led a team of student developers while a student himself. The repo, though, sat under the project lead's personal GitHub account with the slug `wired-unit-review`.

The name was MonSTAR from day one: "Mon" for Monash, "STAR" for star-based reviewing. It is a brand rather than an acronym, and as the platform grows beyond unit reviews the team treats it as a general name.

## Decision

Move the repository to the `wiredmonash` GitHub organization under the `monstar` slug, and coordinate team work through Jira with `MONSTAR-N` ticket IDs in branches and commits.

## Consequences

- Ownership matches reality: the project belongs to the club and survives contributor turnover.
- Branch and commit names (`MONSTAR-N`) tie code changes to tickets during the Jira era. Later eras moved to descriptive branch names and conventional commits.
