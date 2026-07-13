# Academics

Units of study and what students say about them.

- [units](units/): unit catalogue, tags, filtering and sorting, AI-generated overviews.
  Routes: `/api/v1/units`, `/api/v2/units`
- [reviews](reviews/): student reviews of units.
  Routes: `/api/v2/reviews`
- [setu](setu/): scraped SETU survey results.
  Routes: none mounted

Notes:

- [setu](setu/) defines [setus.v1.routes.ts](setu/setus.v1.routes.ts) but [server.ts](../../server.ts) never mounts it. The SETU model feeds the [AI overview service](units/aiOverview.service.ts) and the [sitemap script](../../scripts/generateSitemap.ts), and `enableSetuCards` is off in every frontend environment.
- reviews referencing identity (users, notifications) is an accepted cycle; see the import rules in the [backend source README](../../README.md).
