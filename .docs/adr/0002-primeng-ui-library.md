---
title: Adopt PrimeNG as the UI component library, phasing out Bootstrap
status: accepted
date: 2024-10-14
tags: [frontend]
---

# Adopt PrimeNG as the UI component library, phasing out Bootstrap

## Context

The frontend started on Bootstrap, which covers layout and basic styling but lacks rich interactive components. The write-review dialog and homepage accordion needed more than Bootstrap offered.

## Decision

Adopt PrimeNG as the component library and phase Bootstrap out over time. The team layered PrimeNG on top of Bootstrap via CSS layers (`public/styles/layer.css`), moved style references from `angular.json` into `styles.scss`, and added `provideAnimations()` to enable PrimeNG's animated components, so both libraries could coexist during the transition.

## Consequences

- PrimeNG gave the team dialogs, accordions, and sidebars without custom builds.
- The team has not finished the Bootstrap phase-out: as of 2026, `bootstrap`, `bootstrap-icons`, and `primeng` all remain in `package.json`. The dual dependency is drift from this decision's intent. Finishing the migration, or reversing this ADR, remains open.
