# Recruitment

The jobs board.

- [jobs](jobs/): job postings synced from Notion via [notion.gateway.ts](jobs/notion.gateway.ts).
  Routes: `/api/v2/jobs`
- [orgLogo](orgLogo/): cached organisation logos for job cards.
  Routes: served through the jobs router

[orgLogo](orgLogo/) has no routes file of its own; [jobs.v2.routes.ts](jobs/jobs.v2.routes.ts) exposes it.
